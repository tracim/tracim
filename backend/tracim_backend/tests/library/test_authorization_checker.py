import pytest
import transaction

from tracim_backend.exceptions import ContentTypeNotAllowed
from tracim_backend.exceptions import ContentTypeNotExist
from tracim_backend.exceptions import InsufficientUserProfile
from tracim_backend.exceptions import InsufficientUserRoleInWorkspace
from tracim_backend.exceptions import TracimException
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserGivenIsNotTheSameAsAuthenticated
from tracim_backend.exceptions import UserIsNotContentOwner
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.lib.utils.authorization import AndAuthorizationChecker
from tracim_backend.lib.utils.authorization import AuthorizationChecker
from tracim_backend.lib.utils.authorization import CandidateUserProfileChecker
from tracim_backend.lib.utils.authorization import CandidateWorkspaceRoleChecker
from tracim_backend.lib.utils.authorization import CommentOwnerChecker
from tracim_backend.lib.utils.authorization import ContentTypeChecker
from tracim_backend.lib.utils.authorization import ContentTypeCreationChecker
from tracim_backend.lib.utils.authorization import KnowsCandidateUserChecker
from tracim_backend.lib.utils.authorization import OrAuthorizationChecker
from tracim_backend.lib.utils.authorization import ProfileChecker
from tracim_backend.lib.utils.authorization import RoleChecker
from tracim_backend.lib.utils.authorization import SameUserChecker
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.tests.fixtures import *  # noqa F403,F401


class BaseFakeTracimContext(TracimContext):
    app_config = None
    dbsession = None
    current_user = None
    plugin_manager = None


class TestAuthorizationChecker(object):
    def test_unit__SameUserChecker_ok__nominal_case(self):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_user = User(user_id=3)
            candidate_user = User(user_id=3)

        assert SameUserChecker().check(FakeBaseFakeTracimContext())

    def test_unit__SameUserChecker_err__not_same_user(self):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_user = User(user_id=2)
            candidate_user = User(user_id=3)

        with pytest.raises(UserGivenIsNotTheSameAsAuthenticated):
            SameUserChecker().check(FakeBaseFakeTracimContext())

    def test__unit__ProfileChecker__ok__nominal_case(self):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_user = User(user_id=2)
            current_user.profile = Profile.TRUSTED_USER

        assert ProfileChecker(Profile.USER).check(FakeBaseFakeTracimContext())
        assert ProfileChecker(Profile.TRUSTED_USER).check(FakeBaseFakeTracimContext())

    def test__unit__ProfileChecker__err__profile_insufficient(self):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_user = User(user_id=2)
            current_user.profile = Profile.TRUSTED_USER

        assert ProfileChecker(Profile.USER).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserProfile):
            ProfileChecker(Profile.ADMIN).check(FakeBaseFakeTracimContext())

    def test__unit__CandidateUserProfileChecker__ok__nominal_case(self):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            candidate_user = User(user_id=2)
            candidate_user.profile = Profile.TRUSTED_USER

        assert CandidateUserProfileChecker(Profile.USER).check(FakeBaseFakeTracimContext())
        assert CandidateUserProfileChecker(Profile.TRUSTED_USER).check(FakeBaseFakeTracimContext())

    def test__unit__CandidateUserProfileChecker__err__profile_insufficient(self):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            candidate_user = User(user_id=2)
            candidate_user.profile = Profile.TRUSTED_USER

        assert CandidateUserProfileChecker(Profile.TRUSTED_USER).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserProfile):
            CandidateUserProfileChecker(Profile.ADMIN).check(FakeBaseFakeTracimContext())

    def test__unit__RoleChecker__ok__nominal_case(self, session):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        current_workspace = Workspace(workspace_id=3, owner=current_user)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=2)
        session.add(current_user)
        session.add(current_workspace)
        session.add(role)
        session.flush()
        transaction.commit()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        assert RoleChecker(1).check(FakeBaseFakeTracimContext())
        assert RoleChecker(2).check(FakeBaseFakeTracimContext())

    def test__unit__RoleChecker__err_role_insufficient(self, session):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        current_workspace = Workspace(workspace_id=3, owner=current_user)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=2)
        session.add(current_user)
        session.add(current_workspace)
        session.add(role)
        session.flush()
        transaction.commit()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        assert RoleChecker(2).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(3).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(4).check(FakeBaseFakeTracimContext())

    def test__unit__RoleChecker__err_no_role_in_workspace(self, session):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        current_workspace = Workspace(workspace_id=3, owner=current_user)
        session.add(current_user)
        session.add(current_workspace)
        session.flush()
        transaction.commit()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        assert RoleChecker(0).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(1).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(2).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(3).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            RoleChecker(4).check(FakeBaseFakeTracimContext())

    def test__unit__CandidateWorkspaceRoleChecker__ok__nominal_case(self, session):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        candidate_workspace = Workspace(workspace_id=3, owner=current_user)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=2)
        session.add(current_user)
        session.add(candidate_workspace)
        session.add(role)
        session.flush()
        transaction.commit()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def candidate_workspace(self):
                return candidate_workspace

        assert CandidateWorkspaceRoleChecker(1).check(FakeBaseFakeTracimContext())
        assert CandidateWorkspaceRoleChecker(2).check(FakeBaseFakeTracimContext())

    def test__unit__CandidateWorkspaceRoleChecker__err_role_insufficient(self, session):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        candidate_workspace = Workspace(workspace_id=3, owner=current_user)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=2)
        session.add(current_user)
        session.add(candidate_workspace)
        session.add(role)
        session.flush()
        transaction.commit()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def candidate_workspace(self):
                return candidate_workspace

        assert CandidateWorkspaceRoleChecker(2).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(3).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(4).check(FakeBaseFakeTracimContext())

    def test__unit__CandidateWorkspaceRoleChecker__err_no_role_in_workspace(self, session):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        candidate_workspace = Workspace(workspace_id=3, owner=current_user)
        session.add(current_user)
        session.add(candidate_workspace)
        session.flush()
        transaction.commit()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def candidate_workspace(self):
                return candidate_workspace

        assert CandidateWorkspaceRoleChecker(0).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(1).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(2).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(3).check(FakeBaseFakeTracimContext())
        with pytest.raises(InsufficientUserRoleInWorkspace):
            CandidateWorkspaceRoleChecker(4).check(FakeBaseFakeTracimContext())

    def test__unit__ContentTypeChecker__ok_nominal_test(self, content_type_list):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_content = Content(content_id=15, type=content_type_list.Thread.slug)

        assert ContentTypeChecker(
            [
                content_type_list.File.slug,
                content_type_list.Thread.slug,
                content_type_list.Comment.slug,
            ]
        ).check(FakeBaseFakeTracimContext())
        assert ContentTypeChecker([content_type_list.Thread.slug]).check(
            FakeBaseFakeTracimContext()
        )

    def test__unit__ContentTypeChecker__err_content_type_not_allowed(self, content_type_list):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_content = Content(content_id=15, type=content_type_list.Thread.slug)

        with pytest.raises(ContentTypeNotAllowed):
            assert ContentTypeChecker(
                [content_type_list.File.slug, content_type_list.Comment.slug]
            ).check(FakeBaseFakeTracimContext())

        with pytest.raises(ContentTypeNotAllowed):
            assert ContentTypeChecker([content_type_list.File.slug]).check(
                FakeBaseFakeTracimContext()
            )

    def test__unit__ContentTypeChecker__err_content_type_not_exist(self, content_type_list):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_content = Content(content_id=15, type="unexistent_type")

        with pytest.raises(ContentTypeNotExist):
            assert ContentTypeChecker(
                ["unexistent_type", content_type_list.File.slug, content_type_list.Comment.slug]
            ).check(FakeBaseFakeTracimContext())

        with pytest.raises(ContentTypeNotExist):
            assert ContentTypeChecker(["unexistent_type"]).check(FakeBaseFakeTracimContext())

    def test__unit__CommentOwnerChecker__ok__nominal_case(self, content_type_list):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_user = User(user_id=2, email="toto@toto.toto")
            current_comment = Content(
                content_id=15, type=content_type_list.Comment.slug, owner=current_user
            )

        assert CommentOwnerChecker().check(FakeBaseFakeTracimContext())

    def test__unit__CommentOwnerChecker__err_user_not_owner_case(self, content_type_list):
        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            current_user = User(user_id=2, email="toto@toto.toto")
            current_comment = Content(
                content_id=15,
                type=content_type_list.Comment.slug,
                owner=User(user_id=3, email="another@user.toto"),
            )

        with pytest.raises(UserIsNotContentOwner):
            CommentOwnerChecker().check(FakeBaseFakeTracimContext())

    def test__unit__AndAuthorizationChecker__ok__nominal_case(self):
        class OkChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                return True

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            pass

        assert OkChecker().check(FakeBaseFakeTracimContext())
        assert AndAuthorizationChecker(OkChecker(), OkChecker())
        assert AndAuthorizationChecker([OkChecker] * 5)

    def test__unit__AndAuthorizationChecker__err__exception(self):
        class CheckerFailed(TracimException):
            pass

        class OkChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                return True

        class ExceptionChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                raise CheckerFailed()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            pass

        with pytest.raises(CheckerFailed):
            ExceptionChecker().check(FakeBaseFakeTracimContext())

        with pytest.raises(CheckerFailed):
            AndAuthorizationChecker(ExceptionChecker(), OkChecker()).check(
                FakeBaseFakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            AndAuthorizationChecker(OkChecker(), ExceptionChecker()).check(
                FakeBaseFakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            checkers = [OkChecker()] * 5 + [ExceptionChecker()] + [OkChecker()] * 5
            and_auth_checker = AndAuthorizationChecker(*checkers)
            assert list(and_auth_checker.authorization_checkers) == checkers
            and_auth_checker.check(FakeBaseFakeTracimContext())

    def test__unit__AndAuthorizationChecker__err__exception_order(self):
        class CheckerFailed(TracimException):
            pass

        class CheckerFailed2(TracimException):
            pass

        class OkChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                return True

        class ExceptionChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                raise CheckerFailed()

        class Exception2Checker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                raise CheckerFailed2()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            pass

        with pytest.raises(CheckerFailed):
            ExceptionChecker().check(FakeBaseFakeTracimContext())
        with pytest.raises(CheckerFailed2):
            Exception2Checker().check(FakeBaseFakeTracimContext())

        with pytest.raises(CheckerFailed2):
            AndAuthorizationChecker(Exception2Checker(), ExceptionChecker()).check(
                FakeBaseFakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            AndAuthorizationChecker(ExceptionChecker(), Exception2Checker()).check(
                FakeBaseFakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            checkers = [ExceptionChecker()] * 5 + [Exception2Checker()] * 5 + [OkChecker()]
            and_auth_checker = AndAuthorizationChecker(*checkers)
            assert list(and_auth_checker.authorization_checkers) == checkers
            and_auth_checker.check(FakeBaseFakeTracimContext())

    def test__unit__OrAuthorizationChecker__ok__nominal_case(self):
        class CheckerFailed(TracimException):
            pass

        class OkChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                return True

        class ExceptionChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                raise CheckerFailed()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            pass

        assert OkChecker().check(FakeBaseFakeTracimContext())
        assert OrAuthorizationChecker(OkChecker(), ExceptionChecker())
        assert OrAuthorizationChecker(ExceptionChecker(), OkChecker())
        assert OrAuthorizationChecker(
            [ExceptionChecker()] * 5 + [OkChecker()] + [ExceptionChecker()] * 5
        )

    def test__unit__OrAuthorizationChecker__err__exception_order(self):
        class CheckerFailed(TracimException):
            pass

        class CheckerFailed2(TracimException):
            pass

        class ExceptionChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                raise CheckerFailed()

        class Exception2Checker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                raise CheckerFailed2()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            pass

        with pytest.raises(CheckerFailed):
            ExceptionChecker().check(FakeBaseFakeTracimContext())
        with pytest.raises(CheckerFailed2):
            Exception2Checker().check(FakeBaseFakeTracimContext())

        with pytest.raises(CheckerFailed2):
            OrAuthorizationChecker(ExceptionChecker(), Exception2Checker()).check(
                FakeBaseFakeTracimContext()
            )
        with pytest.raises(CheckerFailed):
            OrAuthorizationChecker(Exception2Checker(), ExceptionChecker()).check(
                FakeBaseFakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            checkers = [Exception2Checker()] * 5 + [ExceptionChecker()]
            or_auth_checker = OrAuthorizationChecker(*checkers)
            assert list(or_auth_checker.authorization_checkers) == checkers
            or_auth_checker.check(FakeBaseFakeTracimContext())

    def test__unit__OrAuthorizationChecker__err__exception(self):
        class CheckerFailed(TracimException):
            pass

        class OkChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                return True

        class ExceptionChecker(AuthorizationChecker):
            def check(self, tracim_context: BaseFakeTracimContext):
                raise CheckerFailed()

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            pass

        with pytest.raises(CheckerFailed):
            ExceptionChecker().check(FakeBaseFakeTracimContext())

        with pytest.raises(CheckerFailed):
            OrAuthorizationChecker(ExceptionChecker(), ExceptionChecker()).check(
                FakeBaseFakeTracimContext()
            )

        with pytest.raises(CheckerFailed):
            checkers = [ExceptionChecker()] * 5
            or_auth_checker = OrAuthorizationChecker(*checkers)
            assert list(or_auth_checker.authorization_checkers) == checkers
            or_auth_checker.check(FakeBaseFakeTracimContext())

    def test__unit__ContentTypeCreationChecker__ok__implicit(self, session):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        current_workspace = Workspace(workspace_id=3, owner=current_user)
        candidate_content_type = TracimContentType(
            slug="test",
            fa_icon="",
            label="Test",
            creation_label="Test",
            available_statuses=[],
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER,
        )
        role = UserRoleInWorkspace(
            user_id=2, workspace_id=3, role=WorkspaceRoles.CONTENT_MANAGER.level
        )
        session.add(current_user)
        session.add(current_workspace)
        session.add(role)
        session.flush()
        transaction.commit()

        class FakeContentTypeList(object):
            def get_one_by_slug(self, slug=str) -> TracimContentType:
                return candidate_content_type

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

            @property
            def candidate_content_type(self):
                return candidate_content_type

        assert ContentTypeCreationChecker(FakeContentTypeList()).check(FakeBaseFakeTracimContext())

    def test__unit__ContentTypeCreationChecker__ok__explicit(self, session):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        current_workspace = Workspace(workspace_id=3, owner=current_user)
        candidate_content_type = TracimContentType(
            slug="test",
            fa_icon="",
            label="Test",
            creation_label="Test",
            available_statuses=[],
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER,
        )
        role = UserRoleInWorkspace(
            user_id=2, workspace_id=3, role=WorkspaceRoles.CONTENT_MANAGER.level
        )
        session.add(current_user)
        session.add(current_workspace)
        session.add(role)
        session.flush()
        transaction.commit()

        class FakeContentTypeList(object):
            def get_one_by_slug(self, slug=str) -> TracimContentType:
                return candidate_content_type

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        assert ContentTypeCreationChecker(FakeContentTypeList(), content_type_slug="test").check(
            FakeBaseFakeTracimContext()
        )

    def test__unit__ContentTypeCreationChecker__err__implicit_insufficent_role_in_workspace(
        self, session
    ):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        current_workspace = Workspace(workspace_id=3, owner=current_user)
        candidate_content_type = TracimContentType(
            slug="test",
            fa_icon="",
            label="Test",
            creation_label="Test",
            available_statuses=[],
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER,
        )
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=WorkspaceRoles.CONTRIBUTOR.level)
        session.add(current_user)
        session.add(current_workspace)
        session.add(role)
        session.flush()
        transaction.commit()

        class FakeContentTypeList(object):
            def get_one_by_slug(self, slug=str) -> TracimContentType:
                return candidate_content_type

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
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
            assert ContentTypeCreationChecker(FakeContentTypeList()).check(
                FakeBaseFakeTracimContext()
            )

    def test__unit__ContentTypeCreationChecker__err__explicit_insufficent_role_in_workspace(
        self, session
    ):

        current_user = User(user_id=2, email="toto@toto.toto")
        current_user.profile = Profile.TRUSTED_USER
        current_workspace = Workspace(workspace_id=3, owner=current_user)
        role = UserRoleInWorkspace(user_id=2, workspace_id=3, role=WorkspaceRoles.CONTRIBUTOR.level)
        candidate_content_type = TracimContentType(
            slug="test",
            fa_icon="",
            label="Test",
            creation_label="Test",
            available_statuses=[],
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER,
        )
        session.add(current_user)
        session.add(current_workspace)
        session.add(role)
        session.flush()
        transaction.commit()

        class FakeContentTypeList(object):
            def get_one_by_slug(self, slug=str) -> TracimContentType:
                return candidate_content_type

        class FakeBaseFakeTracimContext(BaseFakeTracimContext):
            @property
            def current_user(self):
                return current_user

            @property
            def current_workspace(self):
                return current_workspace

        with pytest.raises(InsufficientUserRoleInWorkspace):
            assert ContentTypeCreationChecker(
                FakeContentTypeList(), content_type_slug="test"
            ).check(FakeBaseFakeTracimContext())

    def test_unit__KnowsCandidateUserChecker__ok__nominal_case(self, session, app_config) -> None:
        cfg = app_config

        class Context(BaseFakeTracimContext):
            app_config = cfg
            dbsession = session
            current_user = User(user_id=1, email="toto@toto.toto")
            candidate_user = User(user_id=2, email="foo@foo.fo")

        workspace = Workspace(workspace_id=3, owner=Context.current_user)
        current_user_role = UserRoleInWorkspace(
            user_id=1, workspace_id=3, role=WorkspaceRoles.CONTRIBUTOR.level
        )
        candidate_user_role = UserRoleInWorkspace(
            user_id=2, workspace_id=3, role=WorkspaceRoles.CONTRIBUTOR.level
        )
        session.add_all(
            [
                Context.current_user,
                Context.candidate_user,
                workspace,
                current_user_role,
                candidate_user_role,
            ]
        )
        session.flush()
        transaction.commit()
        assert KnowsCandidateUserChecker().check(Context())

    @pytest.mark.parametrize(
        "config_section", [{"name": "test_known_member_filter_disabled"}], indirect=True,
    )
    def test_unit__KnowsCandidateUserChecker__ok__no_filter(self, session, app_config) -> None:
        cfg = app_config

        class Context(BaseFakeTracimContext):
            app_config = cfg
            dbsession = session
            current_user = User(user_id=1, email="toto@toto.toto")
            candidate_user = User(user_id=2, email="foo@foo.fo")

        session.add_all([Context.current_user, Context.candidate_user])
        assert KnowsCandidateUserChecker().check(Context())

    def test_unit__KnowsCandidateUserChecker__err__no_common_workspace(
        self, session, app_config
    ) -> None:
        cfg = app_config

        class Context(BaseFakeTracimContext):
            app_config = cfg
            dbsession = session
            current_user = User(user_id=1, email="toto@toto.toto")
            candidate_user = User(user_id=2, email="foo@foo.fo")

        session.add_all([Context.current_user, Context.candidate_user])
        with pytest.raises(UserDoesNotExist):
            KnowsCandidateUserChecker().check(Context())
