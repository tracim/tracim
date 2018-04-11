# -*- coding: utf-8 -*-
import typing

from pyramid.interfaces import IAuthorizationPolicy
from zope.interface import implementer

try:
    from json.decoder import JSONDecodeError
except ImportError:  # python3.4
    JSONDecodeError = ValueError
from sqlalchemy.orm.exc import NoResultFound

from pyramid.request import Request

from tracim.models.auth import User
from tracim.models.data import Workspace
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi

from tracim.exceptions import NotAuthentificated
from tracim.exceptions import WorkspaceNotFound
from tracim.exceptions import InsufficientUserWorkspaceRole
BASIC_AUTH_WEBUI_REALM = "tracim"
TRACIM_DEFAULT_PERM = 'tracim'


def get_safe_user(
        request: Request,
) -> User:
    """
    Get current pyramid authenticated user from request
    :param request: pyramid request
    :return: current authenticated user
    """
    app_config = request.registry.settings['CFG']
    uapi = UserApi(None, session=request.dbsession, config=app_config)
    user = None
    try:
        login = request.authenticated_userid
        if not login:
            raise NotAuthentificated('not authenticated user_id,'
                                     'Failed Authentification ?')
        user = uapi.get_one_by_email(login)
    except NoResultFound:
        raise NotAuthentificated('User not found')
    return user


def get_workspace(user: User, request: Request) -> typing.Optional[Workspace]:
    """
    Get current workspace from request
    :param user: User who want to check the workspace
    :param request: pyramid request
    :return:
    """
    workspace_id = ''
    try:
        if 'workspace_id' not in request.json_body:
            return None
        workspace_id = request.json_body['workspace_id']
        wapi = WorkspaceApi(current_user=user, session=request.dbsession)
        workspace = wapi.get_one(workspace_id)
    except JSONDecodeError:
        raise WorkspaceNotFound('Bad json body')
    except NoResultFound:
        raise WorkspaceNotFound(
            'Workspace {} does not exist '
            'or is not visible for this user'.format(workspace_id)
        )
    return workspace

###
# BASIC AUTH
###


def basic_auth_check_credentials(
        login: str,
        cleartext_password: str,
        request: 'TracimRequest'
) -> typing.Optional[list]:
    """
    Check credential for pyramid basic_auth
    :param login: login of user
    :param cleartext_password: user password in cleartext
    :param request: Pyramid request
    :return: None if auth failed, list of permissions if auth succeed
    """

    # Do not accept invalid user
    user = _get_basic_auth_unsafe_user(request)
    if not user \
            or user.email != login \
            or not user.validate_password(cleartext_password):
        return None
    return []


def _get_basic_auth_unsafe_user(
    request: Request,
) -> typing.Optional[User]:
    """
    :param request: pyramid request
    :return: User or None
    """
    app_config = request.registry.settings['CFG']
    uapi = UserApi(None, session=request.dbsession, config=app_config)
    try:
        login = request.unauthenticated_userid
        if not login:
            return None
        user = uapi.get_one_by_email(login)
    except NoResultFound:
        return None
    return user

####


def require_workspace_role(minimal_required_role):
    def decorator(func):

        def wrapper(self, request: 'TracimRequest'):
            user = request.current_user
            workspace = request.current_workspace
            if workspace.get_user_role(user) >= minimal_required_role:
                return func(self, request)
            raise InsufficientUserWorkspaceRole()

        return wrapper
    return decorator

###


@implementer(IAuthorizationPolicy)
class AcceptAllAuthorizationPolicy(object):
    """
    Simple AuthorizationPolicy to avoid trouble with pyramid.
    Acceot any request.
    """
    def permits(self, context, principals, permision):
        return True

    def principals_allowed_by_permission(self, context, permission):
        raise NotImplementedError()
