import transaction

from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.tests import WebdavFunctionalTest


class TestFunctionWebdavRemoteUser(WebdavFunctionalTest):
    config_section = 'functional_webdav_test_remote_user'

    def test_functional__webdav_access_to_root_remote_auth__as_http_header(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('remoteuser@emoteuser.remoteuser', password=None, do_save=True,
                                do_notify=False, groups=groups,
                                auth_type=AuthType.REMOTE)  # nopep8
        transaction.commit()
        headers_auth = {
            'REMOTE_USER': 'remoteuser@remoteuser.remoteuser',
        }
        res = self.testapp.get('/', status=401, headers=headers_auth)
        assert res

    def test_functional__webdav_access_to_root__remote_auth(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user(
            'remoteuser@remoteuser.remoteuser',
            password=None,
            do_save=True,
            do_notify=False,
            groups=groups,
            auth_type=AuthType.REMOTE
        )
        uapi.save(user)
        transaction.commit()
        extra_environ = {
            'REMOTE_USER': 'remoteuser@remoteuser.remoteuser',
        }
        res = self.testapp.get('/', status=200, extra_environ=extra_environ)
        assert res

class TestFunctionalWebdav(WebdavFunctionalTest):

    def test_functional__webdav_access_to_root__nominal_case(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get('/', status=200)
        assert res

    def test_functional__webdav_access_to_root__user_not_exist(self) -> None:
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get('/', status=401)

    def test_functional__webdav_access_to_workspace__nominal_case(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('test@test.test', password='test@test.test',
                                do_save=True, do_notify=False,
                                groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER,
                        False)  # nopep8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get('/test', status=200)

    def test_functional__webdav_access_to_workspace__no_role_in_workspace(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('test@test.test', password='test@test.test',
                                do_save=True, do_notify=False,
                                groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get('/test', status=404)

    def test_functional__webdav_access_to_workspace__workspace_not_exist(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('test@test.test', password='test@test.test',
                                do_save=True, do_notify=False,
                                groups=groups)  # nopep8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get('/test', status=404)
