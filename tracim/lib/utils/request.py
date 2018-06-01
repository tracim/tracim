# -*- coding: utf-8 -*-
"""
TracimRequest and related functions
"""
from pyramid.request import Request
from sqlalchemy.orm.exc import NoResultFound

from tracim.exceptions import NotAuthentificated
from tracim.exceptions import UserNotExist
from tracim.exceptions import WorkspaceNotFound
from tracim.exceptions import ImmutableAttribute
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.lib.utils.authorization import JSONDecodeError

from tracim.models import User
from tracim.models.data import Workspace


class TracimRequest(Request):
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
        super().__init__(
            environ,
            charset,
            unicode_errors,
            decode_param_names,
            **kw
        )
        # Current workspace, found by request headers or content
        self._current_workspace = None  # type: Workspace
        # Authenticated user
        self._current_user = None  # type: User
        # User found from request headers, content, distinct from authenticated
        # user
        self._user_candidate = None  # type: User
        # INFO - G.M - 18-05-2018 - Close db at the end of the request
        self.add_finished_callback(self._cleanup)

    @property
    def current_workspace(self) -> Workspace:
        """
        Get current workspace of the request according to authentification and
        request headers (to retrieve workspace). Setted by default value the
        first time if not configured.
        :return: Workspace of the request
        """
        if self._current_workspace is None:
            self.current_workspace = get_workspace(self.current_user, self)
        return self._current_workspace

    @current_workspace.setter
    def current_workspace(self, workspace: Workspace) -> None:
        """
        Setting current_workspace
        :param workspace:
        :return:
        """
        if self._current_workspace is not None:
            raise ImmutableAttribute(
                "Can't modify already setted current_workspace"
            )
        self._current_workspace = workspace

    @property
    def current_user(self) -> User:
        """
        Get user from authentication mecanism.
        """
        if self._current_user is None:
            self.current_user = get_auth_safe_user(self)
        return self._current_user

    @current_user.setter
    def current_user(self, user: User) -> None:
        if self._current_user is not None:
            raise ImmutableAttribute(
                "Can't modify already setted current_user"
            )
        self._current_user = user

    # TODO - G.M - 24-05-2018 - Find a better naming for this ?
    @property
    def candidate_user(self) -> User:
        """
        Get user from headers/body request. This user is not
        the one found by authentication mecanism. This user
        can help user to know about who one page is about in
        a similar way as current_workspace.
        """
        if self._user_candidate is None:
            self.candidate_user = get_candidate_user(self)
        return self._user_candidate

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


    @candidate_user.setter
    def candidate_user(self, user: User) -> None:
        if self._user_candidate is not None:
            raise ImmutableAttribute(
                "Can't modify already setted candidate_user"
            )
        self._user_candidate = user
###
# Utils for TracimRequest
###


def get_candidate_user(
        request: TracimRequest
) -> User:
    """
    Get candidate user
    :param request: pyramid request
    :return: user found from header/body
    """
    app_config = request.registry.settings['CFG']
    uapi = UserApi(None, session=request.dbsession, config=app_config)

    try:
        login = None
        if 'user_id' in request.matchdict:
            login = request.matchdict['user_id']
        if not login:
            raise UserNotExist('no user_id found, incorrect request ?')
        user = uapi.get_one(login)
    except NoResultFound:
        raise NotAuthentificated('User not found')
    return user


def get_auth_safe_user(
        request: TracimRequest,
) -> User:
    """
    Get current pyramid authenticated user from request
    :param request: pyramid request
    :return: current authenticated user
    """
    app_config = request.registry.settings['CFG']
    uapi = UserApi(None, session=request.dbsession, config=app_config)
    try:
        login = request.authenticated_userid
        if not login:
            raise NotAuthentificated('not authenticated user_id,'
                                     'Failed Authentification ?')
        user = uapi.get_one_by_email(login)
    except NoResultFound:
        raise NotAuthentificated('User not found')
    return user


def get_workspace(
        user: User,
        request: TracimRequest
) -> Workspace:
    """
    Get current workspace from request
    :param user: User who want to check the workspace
    :param request: pyramid request
    :return: current workspace
    """
    workspace_id = ''
    try:
        if 'workspace_id' in request.matchdict:
            workspace_id = request.matchdict['workspace_id']
        if not workspace_id:
            raise WorkspaceNotFound('No workspace_id param')
        wapi = WorkspaceApi(
            current_user=user,
            session=request.dbsession,
            config=request.registry.settings['CFG']
        )
        workspace = wapi.get_one(workspace_id)
    except JSONDecodeError:
        raise WorkspaceNotFound('Bad json body')
    except NoResultFound:
        raise WorkspaceNotFound(
            'Workspace {} does not exist '
            'or is not visible for this user'.format(workspace_id)
        )
    return workspace
