import pytest
import transaction

from tracim_backend.app_models.contents import ContentType
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import ContentTypeNotAllowed
from tracim_backend.exceptions import ContentTypeNotExist
from tracim_backend.exceptions import InsufficientUserProfile
from tracim_backend.exceptions import InsufficientUserRoleInWorkspace
from tracim_backend.exceptions import TracimException
from tracim_backend.exceptions import UserGivenIsNotTheSameAsAuthenticated
from tracim_backend.exceptions import UserIsNotContentOwner
from tracim_backend.lib.utils.authorization import AndAuthorizationChecker
from tracim_backend.lib.utils.authorization import AuthorizationChecker
from tracim_backend.lib.utils.authorization import CandidateUserProfileChecker
from tracim_backend.lib.utils.authorization import \
    CandidateWorkspaceRoleChecker
from tracim_backend.lib.utils.authorization import CommentOwnerChecker
from tracim_backend.lib.utils.authorization import ContentTypeChecker
from tracim_backend.lib.utils.authorization import ContentTypeCreationChecker
from tracim_backend.lib.utils.authorization import OrAuthorizationChecker
from tracim_backend.lib.utils.authorization import ProfileChecker
from tracim_backend.lib.utils.authorization import RoleChecker
from tracim_backend.lib.utils.authorization import SameUserChecker
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import Group
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.tests import BaseTest


class TestAuthorizationChecker(BaseTest):


    def test_unit__SameUserChecker_ok__nominal_case(self):
        class FakeTracimContext(TracimContext):
            current_user = User(user_id=3)
            candidate_user = User(user_id=3)

        assert SameUserChecker().check(FakeTracimContext())

    def test_unit__SameUserChecker_err__not_same_user(self):
        class FakeTracimContext(TracimContext):
            current_user = User(user_id=2)
            candidate_user = User(user_id=3)

        with pytest.raises(UserGivenIsNotTheSameAsAuthenticated):
            SameUserChecker().check(FakeTracimContext())

    def test__unit__ProfileChecker__ok__nominal_case(self):
        class FakeTracimContext(TracimContext):
            current_user = User(user_id=2)
            current_user.groups.append(Group(group_id=2))

        assert ProfileChecker(1).check(FakeTracimContext())
        assert ProfileChecker(2).check(FakeTracimContext())

    def test__unit__ProfileChecker__err__profile_insufficient(self):
        class FakeTracimContext(TracimContext):
            current_user = User(user_id=2)
            current_user.groups.append(Group(group_id=2))

        assert ProfileChecker(2).check(FakeTracimContext())
        with pytest.raises(InsufficientUserProfile):
            ProfileChecker(3).check(FakeTracimContext())
        with pytest.raises(InsufficientUserProfile):
            ProfileChecker(4).check(FakeTracimContext())

    def test__unit__CandidateUserProfileChecker__ok__nominal_case(self):
        class FakeTracimContext(TracimContext):
            candidate_user = User(user_id=2)
            candidate_user.groups.append(Group(group_id=2))

        assert CandidateUserProfileChecker(1).check(FakeTracimContext())
        assert CandidateUserProfileChecker(2).check(FakeTracimContext())

    def test__unit__CandidateUserProfileChecker__err__profile_insufficient(self):
        class FakeTracimContext(TracimContext):
            candidate_user = User(user_id=2)
            candidate_user.groups.append(Group(group_id=2))

        assert CandidateUserProfileChecker(2).check(FakeTracimContext())
        with pytest.raises(InsufficientUserProfile):
            CandidateUserProfileChecker(3).check(FakeTracimContext())
        with pytest.raises(InsufficientUserProfile):
            CandidateUserProfileChecker(4).check(FakeTracimContext())

    def test__unit__RoleChecker__ok__nominal_case(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        current_workspace = Workspace(workspace_id=3)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=5)
        self.session.add(current_user)
        self.session.add(current_workspace)
        self.session.add(role)
        self.session.flush()
        transaction.commit()

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        assert RoleChecker(1).check(FakeTracimContext())
        assert RoleChecker(2).check(FakeTracimContext())

    def test__unit__RoleChecker__err_role_insufficient(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        current_workspace = Workspace(workspace_id=3)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=2)
        self.session.add(current_user)
        self.session.add(current_workspace)
        self.session.add(role)
        self.session.flush()
        transaction.commit()

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        assert RoleChecker(2).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(3).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(4).check(FakeTracimContext())

    def test__unit__RoleChecker__err_no_role_in_workspace(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        current_workspace = Workspace(workspace_id=3)
        self.session.add(current_user)
        self.session.add(current_workspace)
        self.session.flush()
        transaction.commit()

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        assert RoleChecker(0).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(1).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(2).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(3).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(4).check(FakeTracimContext())


    def test__unit__CandidateWorkspaceRoleChecker__ok__nominal_case(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        candidate_workspace = Workspace(workspace_id=3)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=5)
        self.session.add(current_user)
        self.session.add(candidate_workspace)
        self.session.add(role)
        self.session.flush()
        transaction.commit()

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def candidate_workspace(self):
                return candidate_workspace

        assert CandidateWorkspaceRoleChecker(1).check(FakeTracimContext())
        assert CandidateWorkspaceRoleChecker(2).check(FakeTracimContext())

    def test__unit__CandidateWorkspaceRoleChecker__err_role_insufficient(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        candidate_workspace = Workspace(workspace_id=3)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=2)
        self.session.add(current_user)
        self.session.add(candidate_workspace)
        self.session.add(role)
        self.session.flush()
        transaction.commit()

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def candidate_workspace(self):
                return candidate_workspace

        assert CandidateWorkspaceRoleChecker(2).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(3).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(4).check(FakeTracimContext())

    def test__unit__CandidateWorkspaceRoleChecker__err_no_role_in_workspace(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        candidate_workspace = Workspace(workspace_id=3)
        self.session.add(current_user)
        self.session.add(candidate_workspace)
        self.session.flush()
        transaction.commit()

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def candidate_workspace(self):
                return candidate_workspace

        assert CandidateWorkspaceRoleChecker(0).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(1).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(2).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(3).check(FakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(4).check(FakeTracimContext())

    def test__unit__ContentTypeChecker__ok_nominal_test(self):

        class FakeTracimContext(TracimContext):
            current_content = Content(
                content_id=15,
                type=content_type_list.Thread.slug
            )

        assert ContentTypeChecker(
            [
                content_type_list.File.slug,
                content_type_list.Thread.slug,
                content_type_list.Comment.slug
            ]
        ).check(FakeTracimContext())
        assert ContentTypeChecker([content_type_list.Thread.slug]).check(
            FakeTracimContext()
        )

    def test__unit__ContentTypeChecker__err_content_type_not_allowed(self):

        class FakeTracimContext(TracimContext):
            current_content = Content(
                content_id=15,
                type=content_type_list.Thread.slug
            )

        with pytest.raises(ContentTypeNotAllowed):
            assert ContentTypeChecker(
                [
                    content_type_list.File.slug,
                    content_type_list.Comment.slug
                ]
            ).check(FakeTracimContext())

        with pytest.raises(ContentTypeNotAllowed):
            assert ContentTypeChecker([content_type_list.File.slug]).check(
                FakeTracimContext()
            )

    def test__unit__ContentTypeChecker__err_content_type_not_exist(self):

        class FakeTracimContext(TracimContext):
            current_content = Content(
                content_id=15,
                type='unexistent_type',
            )

        with pytest.raises(ContentTypeNotExist):
            assert ContentTypeChecker(
                [
                    'unexistent_type',
                    content_type_list.File.slug,
                    content_type_list.Comment.slug,
                ]
            ).check(FakeTracimContext())

        with pytest.raises(ContentTypeNotExist):
            assert ContentTypeChecker(['unexistent_type']).check(
                FakeTracimContext()
            )

    def test__unit__CommentOwnerChecker__ok__nominal_case(self):


        class FakeTracimContext(TracimContext):
            current_user = User(user_id=2, email='toto@toto.toto')
            current_comment = Content(
                content_id=15,
                type=content_type_list.Comment.slug,
                owner= current_user

            )

        assert CommentOwnerChecker().check(FakeTracimContext())


    def test__unit__CommentOwnerChecker__err_user_not_owner_case(self):


        class FakeTracimContext(TracimContext):
            current_user = User(user_id=2, email='toto@toto.toto')
            current_comment = Content(
                content_id=15,
                type=content_type_list.Comment.slug,
                owner= User(user_id=3, email='another@user.toto')

            )

        with pytest.raises(UserIsNotContentOwner):
            CommentOwnerChecker().check(FakeTracimContext())

    def test__unit__AndAuthorizationChecker__ok__nominal_case(self):

        class OkChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                return True

        class FakeTracimContext(TracimContext):
            pass


        assert OkChecker().check(FakeTracimContext())
        assert AndAuthorizationChecker(OkChecker(), OkChecker())
        assert AndAuthorizationChecker([OkChecker] * 5)

    def test__unit__AndAuthorizationChecker__err__exception(self):

        class CheckerFailed(TracimException):
            pass

        class OkChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                return True

        class ExceptionChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                raise CheckerFailed()

        class FakeTracimContext(TracimContext):
            pass

        with pytest.raises(CheckerFailed):
            ExceptionChecker().check(FakeTracimContext())

        with pytest.raises(CheckerFailed):
            AndAuthorizationChecker(ExceptionChecker(), OkChecker()).check(
                FakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            AndAuthorizationChecker(OkChecker(), ExceptionChecker()).check(
                FakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            checkers = [OkChecker()] * 5 + [ExceptionChecker()] + [OkChecker()] * 5
            and_auth_checker = AndAuthorizationChecker(*checkers)
            assert list(and_auth_checker.authorization_checkers) == checkers
            and_auth_checker.check(FakeTracimContext())

    def test__unit__AndAuthorizationChecker__err__exception_order(self):

        class CheckerFailed(TracimException):
            pass

        class CheckerFailed2(TracimException):
            pass

        class OkChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                return True

        class ExceptionChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                raise CheckerFailed()

        class Exception2Checker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                raise CheckerFailed2()

        class FakeTracimContext(TracimContext):
            pass

        with pytest.raises(CheckerFailed):
            ExceptionChecker().check(FakeTracimContext())
        with pytest.raises(CheckerFailed2):
            Exception2Checker().check(FakeTracimContext())

        with pytest.raises(CheckerFailed2):
            AndAuthorizationChecker(Exception2Checker(), ExceptionChecker()).check(
                FakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            AndAuthorizationChecker(ExceptionChecker(), Exception2Checker()).check(
                FakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            checkers = [ExceptionChecker()] * 5 + [Exception2Checker()] * 5 + [OkChecker()]
            and_auth_checker = AndAuthorizationChecker(*checkers)
            assert list(and_auth_checker.authorization_checkers) == checkers
            and_auth_checker.check(FakeTracimContext())

    def test__unit__OrAuthorizationChecker__ok__nominal_case(self):

        class CheckerFailed(TracimException):
            pass

        class OkChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                return True

        class ExceptionChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                raise CheckerFailed()


        class FakeTracimContext(TracimContext):
            pass


        assert OkChecker().check(FakeTracimContext())
        assert OrAuthorizationChecker(OkChecker(), ExceptionChecker())
        assert OrAuthorizationChecker(ExceptionChecker(), OkChecker())
        assert OrAuthorizationChecker(
            [ExceptionChecker()] * 5 +
            [OkChecker()] +
            [ExceptionChecker()] * 5
        )

    def test__unit__OrAuthorizationChecker__err__exception_order(self):

        class CheckerFailed(TracimException):
            pass

        class CheckerFailed2(TracimException):
            pass

        class ExceptionChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                raise CheckerFailed()

        class Exception2Checker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                raise CheckerFailed2()

        class FakeTracimContext(TracimContext):
            pass

        with pytest.raises(CheckerFailed):
            ExceptionChecker().check(FakeTracimContext())
        with pytest.raises(CheckerFailed2):
            Exception2Checker().check(FakeTracimContext())

        with pytest.raises(CheckerFailed2):
            OrAuthorizationChecker(ExceptionChecker(), Exception2Checker()).check(
                FakeTracimContext()
            )
        with pytest.raises(CheckerFailed):
            OrAuthorizationChecker(Exception2Checker(), ExceptionChecker()).check(
                FakeTracimContext()
            )


        with pytest.raises(CheckerFailed):
            checkers = [Exception2Checker()] * 5 + [ExceptionChecker()]
            or_auth_checker = OrAuthorizationChecker(*checkers)
            assert list(or_auth_checker.authorization_checkers) == checkers
            or_auth_checker.check(FakeTracimContext())

    def test__unit__OrAuthorizationChecker__err__exception(self):

        class CheckerFailed(TracimException):
            pass

        class OkChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                return True

        class ExceptionChecker(AuthorizationChecker):

            def check(
                self,
                tracim_context: TracimContext
            ):
                raise CheckerFailed()

        class FakeTracimContext(TracimContext):
            pass

        with pytest.raises(CheckerFailed):
            ExceptionChecker().check(FakeTracimContext())

        with pytest.raises(CheckerFailed):
            OrAuthorizationChecker(ExceptionChecker(), ExceptionChecker()).check(
                FakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            checkers = [ExceptionChecker()] * 5
            or_auth_checker = OrAuthorizationChecker(*checkers)
            assert list(or_auth_checker.authorization_checkers) == checkers
            or_auth_checker.check(FakeTracimContext())

    def test__unit__ContentTypeCreationChecker__ok__implicit(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        current_workspace = Workspace(workspace_id=3)
        candidate_content_type = ContentType(
            slug='test',
            fa_icon='',
            hexcolor='',
            label='Test',
            creation_label='Test',
            available_statuses=[],
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER
        )
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=WorkspaceRoles.CONTENT_MANAGER.level)
        self.session.add(current_user)
        self.session.add(current_workspace)
        self.session.add(role)
        self.session.flush()
        transaction.commit()

        class FakeContentTypeList(object):

            def get_one_by_slug(self, slug=str) -> ContentType:
                return candidate_content_type

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

            @property
            def candidate_content_type(self):
                return candidate_content_type

        assert ContentTypeCreationChecker(FakeContentTypeList()).check(FakeTracimContext())

    def test__unit__ContentTypeCreationChecker__ok__explicit(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        current_workspace = Workspace(workspace_id=3)
        candidate_content_type = ContentType(
            slug='test',
            fa_icon='',
            hexcolor='',
            label='Test',
            creation_label='Test',
            available_statuses=[],
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER
        )
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=WorkspaceRoles.CONTENT_MANAGER.level)
        self.session.add(current_user)
        self.session.add(current_workspace)
        self.session.add(role)
        self.session.flush()
        transaction.commit()

        class FakeContentTypeList(object):

            def get_one_by_slug(self, slug=str) -> ContentType:
                return candidate_content_type

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        assert ContentTypeCreationChecker(FakeContentTypeList(), content_type_slug='test').check(FakeTracimContext())

    def test__unit__ContentTypeCreationChecker__err__implicit_insufficent_role_in_workspace(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        current_workspace = Workspace(workspace_id=3)
        candidate_content_type = ContentType(
            slug='test',
            fa_icon='',
            hexcolor='',
            label='Test',
            creation_label='Test',
            available_statuses=[],
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER
        )
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=WorkspaceRoles.CONTRIBUTOR.level)
        self.session.add(current_user)
        self.session.add(current_workspace)
        self.session.add(role)
        self.session.flush()
        transaction.commit()

        class FakeContentTypeList(object):

            def get_one_by_slug(self, slug=str) -> ContentType:
                return candidate_content_type

        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

            @property
            def candidate_content_type(self):
                return candidate_content_type

        with pytest.raises(InsufficientUserRoleInWorkspace):
            assert ContentTypeCreationChecker(FakeContentTypeList()).check(FakeTracimContext())


    def test__unit__ContentTypeCreationChecker__err__explicit_insufficent_role_in_workspace(self):

        current_user = User(user_id=2, email='toto@toto.toto')
        current_user.groups.append(Group(group_id=2, group_name=Group.TIM_MANAGER_GROUPNAME))
        current_workspace = Workspace(workspace_id=3)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=WorkspaceRoles.CONTRIBUTOR.level)
        candidate_content_type = ContentType(
            slug='test',
            fa_icon='',
            hexcolor='',
            label='Test',
            creation_label='Test',
            available_statuses=[],
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER
        )
        self.session.add(current_user)
        self.session.add(current_workspace)
        self.session.add(role)
        self.session.flush()
        transaction.commit()

        class FakeContentTypeList(object):

            def get_one_by_slug(self, slug=str) -> ContentType:
                return candidate_content_type


        class FakeTracimContext(TracimContext):

            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        with pytest.raises(InsufficientUserRoleInWorkspace):
            assert ContentTypeCreationChecker(FakeContentTypeList(), content_type_slug='test').check(FakeTracimContext())
