# -*- coding: utf-8 -*-
from typing import TYPE_CHECKING

from pyramid.interfaces import IAuthorizationPolicy
from zope.interface import implementer
try:
    from json.decoder import JSONDecodeError
except ImportError:  # python3.4
    JSONDecodeError = ValueError

from tracim.exceptions import InsufficientUserWorkspaceRole
if TYPE_CHECKING:
    from tracim import TracimRequest
###
# Pyramid default permission/authorization mecanism

# INFO - G.M - 12-04-2018 - Setiing a Default permission on view is
#  needed to activate AuthentificationPolicy and
# AuthorizationPolicy on pyramid request
TRACIM_DEFAULT_PERM = 'tracim'


@implementer(IAuthorizationPolicy)
class AcceptAllAuthorizationPolicy(object):
    """
    Empty AuthorizationPolicy : Allow all request. As Pyramid need
    a Authorization policy when we use AuthentificationPolicy, this
    class permit use to disable pyramid authorization mecanism with
    working a AuthentificationPolicy.
    """
    def permits(self, context, principals, permision):
        return True

    def principals_allowed_by_permission(self, context, permission):
        raise NotImplementedError()

###
# Authorization decorators for views

# INFO - G.M - 12-04-2018
# Instead of relying on pyramid authorization mecanism
# We prefer to use decorators


def require_workspace_role(minimal_required_role):
    """
    Decorator for view to restrict access of tracim request if role
    is not high enough
    :param minimal_required_role:
    :return:
    """
    def decorator(func):

        def wrapper(self, request: 'TracimRequest'):
            user = request.current_user
            workspace = request.current_workspace
            if workspace.get_user_role(user) >= minimal_required_role:
                return func(self, request)
            raise InsufficientUserWorkspaceRole()

        return wrapper
    return decorator
