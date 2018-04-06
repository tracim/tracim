import typing
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Authenticated
from tracim.lib.core.user import UserApi
from tracim.models.auth import Group
from tracim.lib.core.workspace import WorkspaceApi

# INFO - G.M - 06-04-2018 - Auth for pyramid
# based on this tutorial : https://docs.pylonsproject.org/projects/pyramid-cookbook/en/latest/auth/basic.html  # nopep8


def check_credentials(username, password, request) -> typing.Optional[dict]:
    permissions = None
    app_config = request.registry.settings['CFG']
    uapi = UserApi(None, session=request.dbsession, config=app_config)
    try:
        user = uapi.get_one_by_email(username)
        if user.validate_password(password):
            permissions = []
            for group in user.groups:
                permissions.append(group.group_name)
            # TODO - G.M - 06-04-2018 - Add workspace specific permission ?
    # TODO - G.M - 06-04-2018 - Better catch for exception of bad password, bad
    # user
    except:
        pass
    return permissions


class Root:
    # root
    __acl__ = (
        (Allow, Group.TIM_ADMIN_GROUPNAME, ALL_PERMISSIONS),
        (Allow, Group.TIM_MANAGER_GROUPNAME, 'manager'),
        (Allow, Group.TIM_USER_GROUPNAME, 'user'),
    )
