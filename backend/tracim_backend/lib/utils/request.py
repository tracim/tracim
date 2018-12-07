# -*- coding: utf-8 -*-
import re
import typing
from json import JSONDecodeError
from os.path import dirname, basename

from pyramid.request import Request
from sqlalchemy.orm import Session

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentNotFoundInTracimRequest
from tracim_backend.exceptions import ContentTypeNotInTracimRequest
from tracim_backend.exceptions import InvalidCommentId
from tracim_backend.exceptions import InvalidContentId
from tracim_backend.exceptions import InvalidUserId
from tracim_backend.exceptions import InvalidWorkspaceId
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import UserNotFoundInTracimRequest
from tracim_backend.exceptions import WorkspaceNotFoundInTracimRequest
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import Workspace


class TracimContext(object):
    """
    Abstract class, Context of Tracim, neede for tracim authorization mecanism.
    """

    def __init__(self):
        # Authenticated user
        self._current_user = None  # type: User
        # Current workspace, found in request path
        self._current_workspace = None  # type: Workspace
        # Current content, found in request path
        self._current_content = None  # type: Content
        # Current comment, found in request path
        self._current_comment = None  # type: Content
        # Candidate user found in request body
        self._candidate_user = None  # type: User
        # Candidate workspace found in request body
        self._candidate_workspace = None  # type: Workspace
        # Candidate content_type found in request body
        self._candidate_content_type = None

    # INFO - G.M - 2018-12-03 - Useful property of Tracim Context

    @property
    def current_user(self):
        """
        Current authenticated user if exist
        """
        return self._generate_if_none(
            self._current_user,
            self._get_user,
            self._get_current_user_id
        )

    @property
    def current_workspace(self):
        """
        Workspace of current ressources used if exist, for example,
        if you are editing content 21 in workspace 3,
        current_workspace will be 3.
        """
        return self._generate_if_none(
            self._current_workspace,
            self._get_workspace,
            self._get_current_workspace_id
        )

    @property
    def current_content(self):
        """
        Current content if exist, if you are editing content 21, current content
        will be content 21.
        """
        return self._generate_if_none(
            self._current_content,
            self._get_content,
            self._get_current_content_id
        )

    @property
    def current_comment(self):
        """
        Current comment if exist, if you are deleting comment 8 of content 21,
        current comment will be 8.
        """
        return self._generate_if_none(
            self._current_comment,
            self._get_content,
            self._get_current_comment_id
        )

    @property
    def candidate_user(self):
        """
        User which is not authenticated user but needed for an action,
        for example if admin (user_id=1) want to change profile of bob
        (user_id=2), current_user will be admin but candidate user will be bob.
        """
        return self._generate_if_none(
            self._candidate_user,
            self._get_user,
            self._get_candidate_user_id
        )

    @property
    def candidate_workspace(self):
        """
        Secondary workspace if exist, useful for special action.
        For example, if you want to move
        file from workspace A to B, current_workspace
        will be A but candidate workspace will be B.
        """
        return self._generate_if_none(
            self._candidate_workspace,
            self._get_workspace,
            self._get_candidate_workspace_id
        )

    @property
    def candidate_content_type(self):
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
            self,
            param: typing.Any,
            generator: typing.Callable,
            id_fetcher: typing.Callable
    ):
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

    def _get_user(self, user_id_fetcher: typing.Callable):
        user_id = user_id_fetcher()
        uapi = UserApi(
            None,
            show_deleted=True,
            session=self.dbsession,
            config=self.app_config
        )
        return uapi.get_one(user_id)

    def _get_workspace(self, workspace_id_fetcher):
        workspace_id = workspace_id_fetcher()
        wapi = WorkspaceApi(
            current_user=self.current_user,
            session=self.dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        return wapi.get_one(workspace_id)

    def _get_content(self, content_id_fetcher):
        content_id = content_id_fetcher()
        api = ContentApi(
            current_user = self.current_user,
            show_deleted = True,
            show_archived = True,
            session = self.dbsession,
            config = self.app_config,
        )
        return api.get_one(
            content_id=content_id,
            workspace=self.current_workspace,
            content_type=content_type_list.Any_SLUG
        )

    def _get_content_type(self, content_type_slug_fetcher):
        content_type_slug = content_type_slug_fetcher()
        return content_type_list.get_one_by_slug(content_type_slug)
    # INFO - G.M - 2018-12-03 - Theses method need to be implemented
    # to support correctly Tracim Context
    # Method to Implements

    # General context parameters

    @property
    def dbsession(self) -> Session:
        """
        Current session available
        """
        raise NotImplemented()

    @property
    def app_config(self) -> CFG:
        """
        Current config available
        """
        raise NotImplemented()

    # IDs fetchers

    def _get_current_user_id(self) -> int:
        raise NotImplemented()

    def _get_current_workspace_id(self) -> int:
        raise NotImplemented()

    def _get_current_content_id(self) -> int:
        raise NotImplemented()

    def _get_current_comment_id(self) -> int:
        raise NotImplemented()

    def _get_candidate_user_id(self) -> int:
        raise NotImplemented()

    def _get_candidate_workspace_id(self) -> int:
        raise NotImplemented()

    def _get_candidate_content_type_slug(self) -> str:
        raise NotImplemented()


class TracimRequest(TracimContext, Request):
    """
    Request with tracim specific params/methods
    """
    def __init__(
            self,
            environ,
            charset=None,
            unicode_errors=None,
            decode_param_names=None,
            **kw
    ):
        Request.__init__(
            self,
            environ,
            charset,
            unicode_errors,
            decode_param_names,
            **kw
        )
        TracimContext.__init__(self)

        # INFO - G.M - 18-05-2018 - Close db at the end of the request
        self.add_finished_callback(self._cleanup)

    @property
    def dbsession(self) -> Session:
        """Overriden by Pyramid, see models/_init_.py file"""
        pass

    @property
    def app_config(self) -> CFG:
        return self.registry.settings['CFG']

    def _cleanup(self, request: 'TracimRequest') -> None:
        """
        Close dbsession at the end of the request in order to avoid exception
        about not properly closed session or "object created in another thread"
        issue
        see https://github.com/tracim/tracim_backend/issues/62
        :param request: same as self, request
        :return: nothing.
        """
        self._current_user = None
        self._current_workspace = None
        self.dbsession.close()

    # INFO - G.M - 2018-12-03 - Internal utils function to simplify ID fetching

    def _get_path_id(
        self,
        name: str,
        exception_if_none: Exception,
        exception_if_invalid_id: Exception
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
        if not isinstance(id_param_as_str, str) \
                or not id_param_as_str.isdecimal():
            raise exception_if_invalid_id
        return int(id_param_as_str)

    def _get_body_id(
            self,
            name: str,
            exception_if_none: Exception,
            exception_if_invalid_id: Exception
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

    def _get_body_str(
            self,
            name: str,
            exception_if_none: Exception,
    ) -> str:
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
    def _get_current_user_id(self) -> int:
        try:
            if not self.authenticated_userid:
                raise UserNotFoundInTracimRequest(
                    'You request a current user '
                    'but the context not permit to found one'
                )
        except UserNotFoundInTracimRequest as exc:
            raise NotAuthenticated('User not found') from exc
        return self.authenticated_userid

    def _get_current_workspace_id(self) -> int:
        exception_if_none = WorkspaceNotFoundInTracimRequest(
            'No workspace_id property found in request'
        )
        exception_if_invalid_id = InvalidWorkspaceId(
            'workspace_id is not a correct integer'
        )
        return self._get_path_id(
            'workspace_id',
            exception_if_none,
            exception_if_invalid_id
        )

    def _get_current_content_id(self) -> int:
        exception_if_none = ContentNotFoundInTracimRequest(
            'No content_id property found in request'
        )
        exception_if_invalid_id = InvalidContentId(
            'content_id is not a correct integer'
        )
        return self._get_path_id(
            'content_id',
            exception_if_none,
            exception_if_invalid_id
        )

    def _get_current_comment_id(self) -> int:
        exception_if_none = ContentNotFoundInTracimRequest(
            'No comment_id property found in request'
        )
        exception_if_invalid_id = InvalidCommentId(
            'comment_id is not a correct integer'
        )
        return self._get_path_id(
            'comment_id',
            exception_if_none,
            exception_if_invalid_id
        )

    def _get_candidate_user_id(self) -> int:
        exception_if_none = UserNotFoundInTracimRequest(
            'You request a candidate user but the '
            'context not permit to found one'
        )
        exception_if_invalid_id = InvalidUserId(
            'user_id is not a correct integer'
        )
        return self._get_path_id(
            'user_id',
            exception_if_none,
            exception_if_invalid_id
        )

    def _get_candidate_workspace_id(self) -> int:
        exception_if_none = WorkspaceNotFoundInTracimRequest(
            'No new_workspace_id property found in body'
        )
        exception_if_invalid_id = InvalidWorkspaceId(
            'new_workspace_id is not a correct integer'
        )
        return self._get_body_id(
            'new_workspace_id',
            exception_if_none,
            exception_if_invalid_id
        )

    def _get_candidate_content_type_slug(self):
        exception_if_none = ContentTypeNotInTracimRequest(
            'No content_type property found in body'
        )
        return self._get_body_str(
            'content_type',
            exception_if_none,
        )