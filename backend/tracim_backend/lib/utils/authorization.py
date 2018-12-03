# -*- coding: utf-8 -*-
import functools
import typing
from typing import TYPE_CHECKING

from pyramid.interfaces import IAuthorizationPolicy
from zope.interface import implementer

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import ContentTypeNotAllowed
from tracim_backend.exceptions import InsufficientUserProfile
from tracim_backend.exceptions import InsufficientUserRoleInWorkspace
from tracim_backend.exceptions import UserGivenIsNotTheSameAsAuthenticated
from tracim_backend.exceptions import UserIsNotContentOwner
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.lib.utils.utils import deprecated
from tracim_backend.models.auth import Group
from tracim_backend.models.roles import WorkspaceRoles

try:
    from json.decoder import JSONDecodeError
except ImportError:  # python3.4
    JSONDecodeError = ValueError

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


class AuthorizationChecker(object):
    """
    Abstract class for AuthorizationChecker
    Authorization Checker are class who does check on tracim_context.
    There are usable in every tracim context (you just need to implement
    needed method in TracimContext) and are very flexible (see
    AndAuthorizationChecker and OrAuthorizationChecker for checker combination
    )
    """

    def __init__(self):
        pass

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:
        """Return true or raise error if check doesnt pass"""
        raise NotImplemented()


class SameUserChecker(AuthorizationChecker):
    """
    Check if candidate_user is same as current_user
    """
    def __init__(self):
        super().__init__()

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:
        if tracim_context.current_user.user_id == \
                tracim_context.candidate_user.user_id:
            return True
        raise UserGivenIsNotTheSameAsAuthenticated()


class ProfileChecker(AuthorizationChecker):
    """
    Check if current_user profile
    is as high as profile level given
    """

    def __init__(self, profile_level: int):
        super().__init__()
        self.profile_level = profile_level

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:
        if tracim_context.current_user.profile.id >= self.profile_level:
            return True
        raise InsufficientUserProfile()


class CandidateUserProfileChecker(AuthorizationChecker):
    """
    Check if candidate_user profile
    is as high as profile level given
    """

    def __init__(self, profile_level: int):
        super().__init__()
        self.profile_level = profile_level

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:
        if tracim_context.candidate_user.profile.id >= self.profile_level:
            return True
        raise InsufficientUserProfile()


class RoleChecker(AuthorizationChecker):
    """
    Check if current_user in current_workspace role
    is as high as role level given
    """
    def __init__(self, role_level: int):
        super().__init__()
        self.role_level = role_level

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:
        if tracim_context.current_workspace\
                .get_user_role(tracim_context.current_user) >= self.role_level:
            return True
        raise InsufficientUserRoleInWorkspace()


class CandidateWorkspaceRoleChecker(AuthorizationChecker):
    """
    Check if current_user in candidate_workspace role
    is as high as role level given
    """
    def __init__(self, role_level: int):
        super().__init__()
        self.role_level = role_level

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:
        if tracim_context.candidate_workspace\
                .get_user_role(tracim_context.current_user) >= self.role_level:
            return True
        raise InsufficientUserRoleInWorkspace()


class ContentTypeChecker(AuthorizationChecker):
    """
    Check if current_content match content_types given
    """
    def __init__(self, allowed_content_type_list: typing.List[str]):
        super().__init__()
        self.allowed_content_type_list = allowed_content_type_list

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:
        content = tracim_context.current_content
        current_content_type_slug = content_type_list\
            .get_one_by_slug(content.type).slug
        if current_content_type_slug in self.allowed_content_type_list:
            return True
        raise ContentTypeNotAllowed()


class CommentOwnerChecker(AuthorizationChecker):
    """
    Check if current_user is owner of current_comment
    """
    def __init__(self):
        super().__init__()

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:

        if tracim_context.current_comment.owner.user_id\
                == tracim_context.current_user.user_id:
            return True
        raise UserIsNotContentOwner(
            'user {} is not owner of comment  {}'.format(
                tracim_context.current_user.user_id,
                tracim_context.current_comment.content_id
            )
        )


class OrAuthorizationChecker(AuthorizationChecker):
    """
    Check multiple auth_checker with a logical operator "or"
    return last exception found in list of checker
    """
    def __init__(self, *authorization_checkers):
        super().__init__()
        self.authorization_checkers = authorization_checkers

    def check(
        self,
        tracim_context: TracimContext
    ) -> bool:
        exception_to_raise = None
        for authorization_checker in self.authorization_checkers:
            try:
                authorization_checker.check(
                    tracim_context=tracim_context,
                )
                return True
            except Exception as e:
                exception_to_raise = e

        raise exception_to_raise


class AndAuthorizationChecker(AuthorizationChecker):
    """
    Check multiple auth_checker with an logical operator "and"
    return first exception found in list of checker
    """

    def __init__(self, *authorization_checkers):
        super().__init__()
        self.authorization_checkers = authorization_checkers

    def check(
            self,
            tracim_context: TracimContext
    ) -> bool:
        for authorization_checker in self.authorization_checkers:
            authorization_checker.check(
                tracim_context=tracim_context,
            )
        return True

# Useful Authorization Checker
# profile
is_administrator = ProfileChecker(Group.TIM_ADMIN)
is_trusted_user = ProfileChecker(Group.TIM_MANAGER)
is_user = ProfileChecker(Group.TIM_USER)
# role
is_workspace_manager = RoleChecker(WorkspaceRoles.WORKSPACE_MANAGER.level)
is_content_manager = RoleChecker(WorkspaceRoles.CONTENT_MANAGER.level)
is_reader = RoleChecker(WorkspaceRoles.READER.level)
is_contributor = RoleChecker(WorkspaceRoles.READER.level)
# personal_access
has_personal_access = OrAuthorizationChecker(
    SameUserChecker(),
    is_administrator
)
# workspace
can_see_workspace_information = OrAuthorizationChecker(
    is_administrator,
    AndAuthorizationChecker(is_reader, is_user)
)
can_modify_workspace = OrAuthorizationChecker(
    is_administrator,
    AndAuthorizationChecker(is_workspace_manager, is_trusted_user)
)
can_delete_workspace = OrAuthorizationChecker(
    is_administrator,
    AndAuthorizationChecker(is_workspace_manager, is_trusted_user)
)
# content
can_move_content = AndAuthorizationChecker(
    is_content_manager,
    CandidateWorkspaceRoleChecker(WorkspaceRoles.WORKSPACE_MANAGER.level)
)
# comments
is_comment_owner = CommentOwnerChecker()
can_delete_comment = OrAuthorizationChecker(
    AndAuthorizationChecker(is_contributor, is_comment_owner),
    is_workspace_manager
)

###
# Authorization decorators for views

# INFO - G.M - 12-04-2018
# Instead of relying on pyramid authorization mecanism
# We prefer to use decorators


def check_right(authorization_checker: AuthorizationChecker):

    def decorator(func: typing.Callable) -> typing.Callable:
        @functools.wraps(func)
        def wrapper(self, context, request: 'TracimRequest') -> typing.Callable:
            authorization_checker.check(
                tracim_context=request,
            )
            return func(self, context, request)
        return wrapper
    return decorator


@deprecated
def require_same_user_or_profile(group: int) -> typing.Callable:
    """
    Decorator for view to restrict access of tracim request if candidate user
    is distinct from authenticated user and not with high enough profile.
    :param group: value from Group Object
    like Group.TIM_USER or Group.TIM_MANAGER
    :return:
    """
    authorization_checker = OrAuthorizationChecker(
        SameUserChecker(),
        ProfileChecker(group)
    )
    return check_right(authorization_checker)


def require_profile(group: int) -> typing.Callable:
    """
    Decorator for view to restrict access of tracim request if profile is
    not high enough
    :param group: value from Group Object
    like Group.TIM_USER or Group.TIM_MANAGER
    :return:
    """
    authorization_checker = ProfileChecker(group)
    return check_right(authorization_checker)


@deprecated
def require_profile_and_workspace_role(
        minimal_profile: int,
        minimal_required_role: int,
        allow_superadmin=False
) -> typing.Callable:
    normal_user_checker = AndAuthorizationChecker(
        RoleChecker(minimal_required_role),
        ProfileChecker(minimal_profile)
    )
    admin_checker = ProfileChecker(Group.TIM_ADMIN)
    if allow_superadmin:
        authorization_checker = OrAuthorizationChecker(
            admin_checker,
            normal_user_checker
        )
    else:
        authorization_checker = normal_user_checker
    return check_right(authorization_checker)


@deprecated
def require_workspace_role(minimal_required_role: int) -> typing.Callable:
    """
    Restricts access to endpoint to minimal role or raise an exception.
    Check role for current_workspace.
    :param minimal_required_role: value from UserInWorkspace Object like
    UserRoleInWorkspace.CONTRIBUTOR or UserRoleInWorkspace.READER
    :return: decorator
    """
    return check_right(RoleChecker(minimal_required_role))


@deprecated
def require_candidate_workspace_role(minimal_required_role: int) -> typing.Callable:  # nopep8
    """
    Restricts access to endpoint to minimal role or raise an exception.
    Check role for candidate_workspace.
    :param minimal_required_role: value from UserInWorkspace Object like
    UserRoleInWorkspace.CONTRIBUTOR or UserRoleInWorkspace.READER
    :return: decorator
    """
    return check_right(CandidateWorkspaceRoleChecker(minimal_required_role))


@deprecated
def require_content_types(content_types_slug: typing.List[str]) -> typing.Callable:  # nopep8
    """
    Restricts access to specific file type or raise an exception.
    Check role for candidate_workspace.
    :param content_types_slug: list of slug of content_types
    :return: decorator
    """
    return check_right(ContentTypeChecker(content_types_slug))


@deprecated
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
    normal_owner_checker = AndAuthorizationChecker(
        ProfileChecker(minimal_required_role_for_owner),
        CommentOwnerChecker()
    )
    normal_user_checker = RoleChecker(minimal_required_role_for_anyone)
    return check_right(
        OrAuthorizationChecker(
            normal_owner_checker,
            normal_user_checker
        )
    )
