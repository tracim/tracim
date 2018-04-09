# -*- coding: utf-8 -*-
import typing

from json.decoder import JSONDecodeError
from sqlalchemy.orm.exc import NoResultFound

from pyramid.request import Request
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import unauthenticated_userid

from tracim.models.auth import Group
from tracim.models.auth import User
from tracim.models.data import Workspace
from tracim.models.data import UserRoleInWorkspace
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.lib.core.userworkspace import RoleApi

# INFO - G.M - 06-04-2018 - Auth for pyramid
# based on this tutorial : https://docs.pylonsproject.org/projects/pyramid-cookbook/en/latest/auth/basic.html  # nopep8
BASIC_AUTH_WEBUI_REALM = "tracim"


def get_user(request: Request) -> typing.Optional[User]:
    """
    Get current pyramid user from request
    :param request: pyramid request
    :return:
    """
    app_config = request.registry.settings['CFG']
    uapi = UserApi(None, session=request.dbsession, config=app_config)
    user = None
    try:
        login = unauthenticated_userid(request)
        user = uapi.get_one_by_email(login)
    except NoResultFound:
        pass
    return user


def get_workspace(request: Request) -> typing.Optional[Workspace]:
    """
    Get current workspace from request
    :param request: pyramid request
    :return:
    """
    workspace = None
    try:
        if 'workspace_id' not in request.json_body:
            return None
        workspace_id = request.json_body['workspace_id']
        wapi = WorkspaceApi(current_user=None, session=request.dbsession)
        workspace = wapi.get_one(workspace_id)
    except JSONDecodeError:
        pass
    except NoResultFound:
        pass
    return workspace


def check_credentials(
        login: str,
        cleartext_password: str,
        request: Request
) -> typing.Optional[list]:
    """
    Check credential for pyramid basic_auth, checks also for
    global and Workspace related permissions.
    :param login: login of user
    :param cleartext_password: user password in cleartext
    :param request: Pyramid request
    :return: None if auth failed, list of permissions if auth succeed
    """
    user = get_user(request)

    # Do not accept invalid user
    if not user \
            or user.email != login \
            or not user.validate_password(cleartext_password):
        return None
    permissions = []

    # Global groups
    for group in user.groups:
        permissions.append(group.group_id)

    # Current workspace related group
    workspace = get_workspace(request)
    if workspace:
        roleapi = RoleApi(current_user=user, session=request.dbsession)
        role = roleapi.get_one(
            user_id=user.user_id,
            workspace_id=workspace.workspace_id,
        )
        permissions.append(role)

    return permissions


# Global Permissions
ADMIN_PERM = 'admin'
MANAGE_GLOBAL_PERM = 'manage_global'
USER_PERM = 'user'
# Workspace-specific permission
READ_PERM = 'read'
CONTRIBUTE_PERM = 'contribute'
MANAGE_CONTENT_PERM = 'manage_content'
MANAGE_WORKSPACE_PERM = 'manage_workspace'


class Root(object):
    """
    Root of all Pyramid requests, used to store global acl
    """
    __acl__ = ()
