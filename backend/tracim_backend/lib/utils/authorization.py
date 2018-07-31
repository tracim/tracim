# -*- coding: utf-8 -*-
import typing
from typing import TYPE_CHECKING
import functools
from pyramid.interfaces import IAuthorizationPolicy
from zope.interface import implementer

from tracim_backend.models.contents import ContentType
from tracim_backend.models.contents import CONTENT_TYPES

try:
    from json.decoder import JSONDecodeError
except ImportError:  # python3.4
    JSONDecodeError = ValueError

from tracim_backend.models.contents import ContentType
from tracim_backend.exceptions import InsufficientUserRoleInWorkspace
from tracim_backend.exceptions import ContentTypeNotAllowed
from tracim_backend.exceptions import InsufficientUserProfile
if TYPE_CHECKING:
    from tracim_backend import TracimRequest
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


def require_same_user_or_profile(group: int) -> typing.Callable:
    """
    Decorator for view to restrict access of tracim request if candidate user
    is distinct from authenticated user and not with high enough profile.
    :param group: value from Group Object
    like Group.TIM_USER or Group.TIM_MANAGER
    :return:
    """
    def decorator(func: typing.Callable) -> typing.Callable:
        @functools.wraps(func)
        def wrapper(self, context, request: 'TracimRequest') -> typing.Callable:
            auth_user = request.current_user
            candidate_user = request.candidate_user
            if auth_user.user_id == candidate_user.user_id or \
                    auth_user.profile.id >= group:
                return func(self, context, request)
            raise InsufficientUserProfile()
        return wrapper
    return decorator


def require_profile(group: int) -> typing.Callable:
    """
    Decorator for view to restrict access of tracim request if profile is
    not high enough
    :param group: value from Group Object
    like Group.TIM_USER or Group.TIM_MANAGER
    :return:
    """
    def decorator(func: typing.Callable) -> typing.Callable:
        @functools.wraps(func)
        def wrapper(self, context, request: 'TracimRequest') -> typing.Callable:
            user = request.current_user
            if user.profile.id >= group:
                return func(self, context, request)
            raise InsufficientUserProfile()
        return wrapper
    return decorator


def require_workspace_role(minimal_required_role: int) -> typing.Callable:
    """
    Restricts access to endpoint to minimal role or raise an exception.
    Check role for current_workspace.
    :param minimal_required_role: value from UserInWorkspace Object like
    UserRoleInWorkspace.CONTRIBUTOR or UserRoleInWorkspace.READER
    :return: decorator
    """
    def decorator(func: typing.Callable) -> typing.Callable:
        @functools.wraps(func)
        def wrapper(self, context, request: 'TracimRequest') -> typing.Callable:
            user = request.current_user
            workspace = request.current_workspace
            if workspace.get_user_role(user) >= minimal_required_role:
                return func(self, context, request)
            raise InsufficientUserRoleInWorkspace()

        return wrapper
    return decorator


def require_candidate_workspace_role(minimal_required_role: int) -> typing.Callable:  # nopep8
    """
    Restricts access to endpoint to minimal role or raise an exception.
    Check role for candidate_workspace.
    :param minimal_required_role: value from UserInWorkspace Object like
    UserRoleInWorkspace.CONTRIBUTOR or UserRoleInWorkspace.READER
    :return: decorator
    """
    def decorator(func: typing.Callable) -> typing.Callable:

        def wrapper(self, context, request: 'TracimRequest') -> typing.Callable:
            user = request.current_user
            workspace = request.candidate_workspace

            if workspace.get_user_role(user) >= minimal_required_role:
                return func(self, context, request)
            raise InsufficientUserRoleInWorkspace()

        return wrapper
    return decorator


def require_content_types(content_types: typing.List['ContentType']) -> typing.Callable:  # nopep8
    """
    Restricts access to specific file type or raise an exception.
    Check role for candidate_workspace.
    :param content_types: list of ContentType object
    :return: decorator
    """
    def decorator(func: typing.Callable) -> typing.Callable:
        @functools.wraps(func)
        def wrapper(self, context, request: 'TracimRequest') -> typing.Callable:
            content = request.current_content
            current_content_type_slug = CONTENT_TYPES.get_one_by_slug(content.type).slug
            content_types_slug = [content_type.slug for content_type in content_types]  # nopep8
            if current_content_type_slug in content_types_slug:
                return func(self, context, request)
            raise ContentTypeNotAllowed()
        return wrapper
    return decorator


def require_comment_ownership_or_role(
        minimal_required_role_for_owner: int,
        minimal_required_role_for_anyone: int,
) -> typing.Callable:
    """
    Decorator for view to restrict access of tracim request if role is
    not high enough and user is not owner of the current_content
    :param minimal_required_role_for_owner: minimal role for owner
    of current_content to access to this view
    :param minimal_required_role_for_anyone: minimal role for anyone to
    access to this view.
    :return:
    """
    def decorator(func: typing.Callable) -> typing.Callable:
        @functools.wraps(func)
        def wrapper(self, context, request: 'TracimRequest') -> typing.Callable:
            user = request.current_user
            workspace = request.current_workspace
            comment = request.current_comment
            # INFO - G.M - 2018-06-178 - find minimal role required
            if comment.owner.user_id == user.user_id:
                minimal_required_role = minimal_required_role_for_owner
            else:
                minimal_required_role = minimal_required_role_for_anyone
            # INFO - G.M - 2018-06-178 - normal role test
            if workspace.get_user_role(user) >= minimal_required_role:
                return func(self, context, request)
            raise InsufficientUserRoleInWorkspace()
        return wrapper
    return decorator
