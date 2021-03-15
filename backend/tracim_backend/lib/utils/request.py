# -*- coding: utf-8 -*-
from abc import ABC
from abc import abstractmethod
from json import JSONDecodeError
import typing

import pluggy
from pyramid.request import Request
from sqlalchemy.orm import Session

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentNotFoundInTracimRequest
from tracim_backend.exceptions import ContentTypeNotInTracimRequest
from tracim_backend.exceptions import InvalidCommentId
from tracim_backend.exceptions import InvalidContentId
from tracim_backend.exceptions import InvalidReactionId
from tracim_backend.exceptions import InvalidUserId
from tracim_backend.exceptions import InvalidWorkspaceId
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import ReactionNotFoundInTracimRequest
from tracim_backend.exceptions import UserNotFoundInTracimRequest
from tracim_backend.exceptions import WorkspaceNotFoundInTracimRequest
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.reaction import ReactionLib
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import Workspace
from tracim_backend.models.event import Event
from tracim_backend.models.reaction import Reaction


class TracimContext(ABC):
    """
    Abstract class, Context of Tracim, needed for tracim authorization mechanism.
    """

    def __init__(self) -> None:
        # Authenticated user
        self._current_user = None  # type: User
        # Current workspace, found in request path
        self._current_workspace = None  # type: Workspace
        # Current content, found in request path
        self._current_content = None  # type: Content
        # Current comment, found in request path
        self._current_comment = None  # type: Content
        # Current reaction, found in request path
        self._current_reaction = None  # type: Reaction
        # Candidate user found in request body
        self._candidate_user = None  # type: User
        # Candidate workspace found in request body
        self._candidate_workspace = None  # type: Workspace
        # Candidate content_type found in request body
        self._candidate_content_type = None
        # Client token, useful to permit link between request and TLM response
        self._client_token = None  # type: typing.Optional[str]
        # Pending events: have been created but are commited to the DB
        self._pending_events = []  # type: typing.List[Event]

    @property
    def pending_events(self) -> typing.List[Event]:
        return self._pending_events

    @pending_events.setter
    def pending_events(self, events: typing.List[Event]) -> None:
        self._pending_events = events

    # INFO - G.M - 2018-12-03 - Useful property of Tracim Context
    def set_user(self, user: User):
        self._current_user = user
        self.plugin_manager.hook.on_context_current_user_set(user=user, context=self)

    def set_client_token(self, client_token: str):
        self._client_token = client_token

    @property
    def client_token(self) -> typing.Optional[str]:
        return self._client_token

    def safe_current_user(self) -> typing.Optional[User]:
        """Current authenticated user or None.

        None can happen with tracimcli commands (or unauthenticated endpoints).
        """
        try:
            return self.current_user
        except NotAuthenticated:
            return None

    @property
    @abstractmethod
    def current_user(self) -> User:
        """
        Current authenticated user if exist
        """
        pass

    @property
    def current_workspace(self) -> Workspace:
        """
        Workspace of current ressources used if exist, for example,
        if you are editing content 21 in workspace 3,
        current_workspace will be 3.
        """
        return self._generate_if_none(
            self._current_workspace, self._get_workspace, self._get_current_workspace_id
        )

    @property
    def current_content(self) -> Content:
        """
        Current content if exist, if you are editing content 21, current content
        will be content 21.
        """
        return self._generate_if_none(
            self._current_content, self._get_content, self._get_current_content_id
        )

    @property
    def current_comment(self) -> Content:
        """
        Current comment if exist, if you are deleting comment 8 of content 21,
        current comment will be 8.
        """
        return self._generate_if_none(
            self._current_comment, self._get_content, self._get_current_comment_id
        )

    @property
    def current_reaction(self) -> Reaction:
        """
        Current reaction if exist, if you are deleting reaction 8 of content 21,
        current reaction will be 8.
        """
        return self._generate_if_none(
            self._current_reaction, self._get_reaction, self._get_current_reaction_id
        )

    @property
    def candidate_user(self) -> User:
        """
        User which is not authenticated user but needed for an action,
        for example if admin (user_id=1) want to change profile of bob
        (user_id=2), current_user will be admin but candidate user will be bob.
        """
        return self._generate_if_none(
            self._candidate_user, self._get_user, self._get_candidate_user_id
        )

    @property
    def candidate_workspace(self) -> Workspace:
        """
        Secondary workspace if exist, useful for special action.
        For example, if you want to move
        file from workspace A to B, current_workspace
        will be A but candidate workspace will be B.
        """
        return self._generate_if_none(
            self._candidate_workspace, self._get_workspace, self._get_candidate_workspace_id
        )

    @property
    def candidate_content_type(self) -> TracimContentType:
        """
        content_type given in entry
        """
        return self._generate_if_none(
            self._candidate_content_type,
            self._get_content_type,
            self._get_candidate_content_type_slug,
        )

    # INFO - G.M - 2018-12-03 - Internal utils method to simplfy source code
    # in access of public_parameters

    def _generate_if_none(
        self, param: typing.Any, generator: typing.Callable, id_fetcher: typing.Callable
    ) -> typing.Any:
        """
        generate parameter if None else return it directly
        :param param: param to check
        :param generator: function to use to generate param value
        :param id_fetcher: id_fetcher function to pass to generator in order
        to allow it to obtain id and generate param value
        """
        if param is None:
            return generator(id_fetcher)
        return param

    def _get_user(self, user_id_fetcher: typing.Callable[[], int]) -> User:
        user_id = user_id_fetcher()
        uapi = UserApi(None, show_deleted=True, session=self.dbsession, config=self.app_config)
        return uapi.get_one(user_id)

    def _get_workspace(self, workspace_id_fetcher: typing.Callable[[], int]) -> Workspace:
        workspace_id = workspace_id_fetcher()
        wapi = WorkspaceApi(
            current_user=self.current_user,
            session=self.dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        return wapi.get_one(workspace_id)

    def _get_workspace_id_in_request(self) -> typing.Optional[int]:
        """
        Return workspace_id if exist, return None if workspace_id doesn't exist
        This differ from _get_current_workspace_id as it does not raise exception
        but None in case workspace_id doesn't exist
        :return:
        """
        try:
            return self._get_current_workspace_id()
        except WorkspaceNotFoundInTracimRequest:
            return None

    def _get_content_id_in_request(self) -> typing.Optional[int]:
        """
        Return content_id if exist, return None if content_id doesn't exist
        This differ from _get_content_reaction_id as it does not raise exception
        but None in case content_id doesn't exist
        :return:
        """
        try:
            return self._get_current_content_id()
        except ContentNotFoundInTracimRequest:
            return None

    def _get_content(self, content_id_fetcher: typing.Callable[[], int]) -> Content:
        content_id = content_id_fetcher()
        api = ContentApi(
            current_user=self.current_user,
            show_deleted=True,
            show_archived=True,
            session=self.dbsession,
            config=self.app_config,
        )
        # INFO - G.M - 2019-07-18 - code to allow get current_content according to current_workspace
        # only if there is a current workspace id.
        current_workspace = None
        if self._get_workspace_id_in_request():
            current_workspace = self.current_workspace

        return api.get_one(
            content_id=content_id,
            workspace=current_workspace,
            content_type=content_type_list.Any_SLUG,
        )

    def _get_reaction(self, reaction_id_fetcher: typing.Callable[[], int]) -> Reaction:
        reaction_id = reaction_id_fetcher()
        reaction_lib = ReactionLib(self.dbsession)
        current_content = None
        if self._get_content_id_in_request():
            current_content = self.current_content
        return reaction_lib.get_one(reaction_id=reaction_id, content_id=current_content.content_id)

    def _get_content_type(
        self, content_type_slug_fetcher: typing.Callable[[], str]
    ) -> TracimContentType:
        content_type_slug = content_type_slug_fetcher()
        return content_type_list.get_one_by_slug(content_type_slug)

    def cleanup(self) -> None:
        """
        Close dbsession at the end of the request in order to avoid exception
        about not properly closed session or "object created in another thread"
        issue
        see https://github.com/tracim/tracim_backend/issues/62
        :return: nothing.
        """
        self.plugin_manager.hook.on_context_finished(context=self)
        self._current_user = None
        self._current_workspace = None
        if self.dbsession:
            self.dbsession.close()

    # INFO - G.M - 2018-12-03 - Theses method need to be implemented
    # to support correctly Tracim Context
    # Method to Implements

    # General context parameters

    @property
    @abstractmethod
    def dbsession(self) -> Session:
        """
        Current session available
        """
        pass

    @property
    @abstractmethod
    def app_config(self) -> CFG:
        """
        Current config available
        """
        pass

    @property
    @abstractmethod
    def plugin_manager(self) -> pluggy.PluginManager:
        """
        Plugin manager of the context
        """
        pass

    def _get_current_workspace_id(self) -> int:
        raise NotImplementedError()

    def _get_current_content_id(self) -> int:
        raise NotImplementedError()

    def _get_current_comment_id(self) -> int:
        raise NotImplementedError()

    def _get_current_reaction_id(self) -> int:
        raise NotImplementedError()

    def _get_candidate_user_id(self) -> int:
        raise NotImplementedError()

    def _get_candidate_workspace_id(self) -> int:
        raise NotImplementedError()

    def _get_candidate_content_type_slug(self) -> str:
        raise NotImplementedError()


class TracimRequest(TracimContext, Request):
    """
    Request with tracim specific params/methods
    """

    def __init__(self, environ, charset=None, unicode_errors=None, decode_param_names=None, **kw):
        Request.__init__(self, environ, charset, unicode_errors, decode_param_names, **kw)
        TracimContext.__init__(self)

        # INFO - G.M - 18-05-2018 - Close db at the end of the request
        self.add_finished_callback(lambda r: r.cleanup())

    @property
    def current_user(self) -> User:
        # INFO - G.M - 24-03-2020 - load authenticate mecanism by calling authenticated_userid.
        # this will prefetch self._current_user value.
        try:
            if not self.authenticated_userid:
                raise UserNotFoundInTracimRequest("No current user has been found in the context")
        except UserNotFoundInTracimRequest as exc:
            raise NotAuthenticated("User not found") from exc

        current_user = self._current_user
        return current_user

    @property
    def dbsession(self) -> typing.Optional[Session]:
        """Overriden by Pyramid, see models/_init_.py file"""
        pass

    @property
    def app_config(self) -> CFG:
        return self.registry.settings["CFG"]

    @property
    def plugin_manager(self) -> pluggy.PluginManager:
        return self.registry.settings["plugin_manager"]

    # INFO - G.M - 2018-12-03 - Internal utils function to simplify ID fetching

    def _get_path_id(
        self, name: str, exception_if_none: Exception, exception_if_invalid_id: Exception
    ) -> int:
        """
        Get id from pyramid path or raise one of the Exception
        given in params, this allow to have specific exception for each id.
        :param name: name of the parameter
        :param exception_if_none: exception if no param found
        :param exception_if_invalid_id: exception if id is not a correct integer
        :return: id of parameter
        """
        if name not in self.matchdict:
            raise exception_if_none
        id_param_as_str = self.matchdict[name]
        if not isinstance(id_param_as_str, str) or not id_param_as_str.isdecimal():
            raise exception_if_invalid_id
        return int(id_param_as_str)

    def _get_body_id(
        self, name: str, exception_if_none: Exception, exception_if_invalid_id: Exception
    ) -> int:
        """
        Get id from pyramid json_body or raise one of the Exception
        given in params, this allow to have specific exception for each id.
        :param name: name of the parameter
        :param exception_if_none: exception if no param found
        :param exception_if_invalid_id: exception if id is not a correct integer
        :return: id of parameter
        """
        try:
            body = self.json_body
        except JSONDecodeError as exc:
            raise exception_if_none from exc

        if name not in body:
            raise exception_if_none
        id_param = body[name]
        if not isinstance(id_param, int):
            if id_param.isdecimal():
                return int(id_param)
            raise exception_if_invalid_id
        return id_param

    def _get_body_str(self, name: str, exception_if_none: Exception) -> str:
        """
        Get string from pyramid json_body
        :param name: name of the parameter
        :param exception_if_none: exception if no param found
        :return: string value of parameter
        """
        try:
            body = self.json_body
        except JSONDecodeError as exc:
            raise exception_if_none from exc

        if name not in body:
            raise exception_if_none
        str_value_param = body[name]
        if not isinstance(str_value_param, str):
            return str(str_value_param)
        return str_value_param

    # ID fetchers
    def _get_current_workspace_id(self) -> int:
        exception_if_none = WorkspaceNotFoundInTracimRequest(
            "No workspace_id property found in request"
        )
        exception_if_invalid_id = InvalidWorkspaceId("workspace_id is not a correct integer")
        return self._get_path_id("workspace_id", exception_if_none, exception_if_invalid_id)

    def _get_current_content_id(self) -> int:
        exception_if_none = ContentNotFoundInTracimRequest(
            "No content_id property found in request"
        )
        exception_if_invalid_id = InvalidContentId("content_id is not a correct integer")
        return self._get_path_id("content_id", exception_if_none, exception_if_invalid_id)

    def _get_current_comment_id(self) -> int:
        exception_if_none = ContentNotFoundInTracimRequest(
            "No comment_id property found in request"
        )
        exception_if_invalid_id = InvalidCommentId("comment_id is not a correct integer")
        return self._get_path_id("comment_id", exception_if_none, exception_if_invalid_id)

    def _get_current_reaction_id(self) -> int:
        exception_if_none = ReactionNotFoundInTracimRequest(
            "No reaction_id property found in request"
        )
        exception_if_invalid_id = InvalidReactionId("comment_id is not a correct integer")
        return self._get_path_id("reaction_id", exception_if_none, exception_if_invalid_id)

    def _get_candidate_user_id(self) -> int:
        exception_if_none = UserNotFoundInTracimRequest(
            "No candidate user has been found in the context"
        )
        exception_if_invalid_id = InvalidUserId("user_id is not a correct integer")
        return self._get_path_id("user_id", exception_if_none, exception_if_invalid_id)

    def _get_candidate_workspace_id(self) -> int:
        exception_if_none = WorkspaceNotFoundInTracimRequest(
            "No new_workspace_id property found in body"
        )
        exception_if_invalid_id = InvalidWorkspaceId("new_workspace_id is not a correct integer")
        return self._get_body_id("new_workspace_id", exception_if_none, exception_if_invalid_id)

    def _get_candidate_content_type_slug(self) -> str:
        exception_if_none = ContentTypeNotInTracimRequest("No content_type property found in body")
        return self._get_body_str("content_type", exception_if_none)
