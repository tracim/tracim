import transaction
from tracim_backend.app_models.contents import content_type_list

from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.core.content import ContentApi
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

    ## Move test
    # move same workspaces : file
    def test_functional__webdav_move_file__ok__same_workspace_folder_to_folder(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
                        False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='examples',
            do_save=True,
            do_notify=False,
        )
        product_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='products',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/examples', status=200)
        self.testapp.get('/documentation/examples/report_sample.txt', status=200)
        self.testapp.get('/documentation/products', status=200)
        # do move
        self.testapp.request(
            '/documentation/examples/report_sample.txt',
            method='MOVE',
            headers={'destination': '/documentation/products/super_product_readme_ZA41.txt'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/examples/report_sample.txt', status=404)
        self.testapp.get('/documentation/products/super_product_readme_ZA41.txt', status=200)

    def test_functional__webdav_move_file__ok__same_workspace_root_to_folder(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
                        False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        product_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='products',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/report_sample.txt', status=200)
        self.testapp.get('/documentation/products', status=200)
        # do move
        self.testapp.request(
            '/documentation/report_sample.txt',
            method='MOVE',
            headers={'destination': '/documentation/products/super_product_readme_ZA41.txt'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/report_sample.txt', status=404)
        self.testapp.get('/documentation/products/super_product_readme_ZA41.txt', status=200)

    def test_functional__webdav_move_file__ok__same_workspace_folder_to_root(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
                        False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='examples',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/examples', status=200)
        self.testapp.get('/documentation/examples/report_sample.txt', status=200)
        # do move
        self.testapp.request(
            '/documentation/examples/report_sample.txt',
            method='MOVE',
            headers={'destination': '/documentation/super_product_readme_ZA41.txt'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/examples/report_sample.txt', status=404)
        self.testapp.get('/documentation/super_product_readme_ZA41.txt', status=200)

    def test_functional__webdav_move_file__ok__rename_file_at_root(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
                        False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/report_sample.txt', status=200)
        # do move
        self.testapp.request(
            '/documentation/report_sample.txt',
            method='MOVE',
            headers={'destination': '/documentation/super_product_readme_ZA41.txt'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/report_sample.txt', status=404)
        self.testapp.get('/documentation/super_product_readme_ZA41.txt', status=200)

    # move same workspaces: folder
    def test_functional__webdav_move_folder__ok__same_workspace_folder_to_folder(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
                        False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='examples',
            do_save=True,
            do_notify=False,
        )
        product_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='products',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            example_product_folder = api.create(
                content_type_list.Folder.slug,
                workspace,
                example_folder,
                label='example_product',
                do_save=True,
                do_notify=False,
            )
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_product_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/examples', status=200)
        self.testapp.get('/documentation/examples/example_product', status=200)
        self.testapp.get('/documentation/examples/example_product/report_sample.txt', status=200)
        self.testapp.get('/documentation/products', status=200)
        # do move
        self.testapp.request(
            '/documentation/examples/example_product',
            method='MOVE',
            headers={'destination': '/documentation/products/ZA41'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/examples/example_product', status=404)
        self.testapp.get('/documentation/examples/example_product/report_sample.txt', status=404)
        self.testapp.get('/documentation/examples/ZA41', status=404)
        self.testapp.get('/documentation/products/ZA41', status=200)
        self.testapp.get('/documentation/products/ZA41/report_sample.txt', status=200)

    def test_functional__webdav_move_folder__ok__same_workspace_root_to_folder(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
                        False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        product_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='products',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            example_product_folder = api.create(
                content_type_list.Folder.slug,
                workspace,
                None,
                label='example_product',
                do_save=True,
                do_notify=False,
            )
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_product_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/example_product', status=200)
        self.testapp.get('/documentation/example_product/report_sample.txt', status=200)
        self.testapp.get('/documentation/products', status=200)
        # do move
        self.testapp.request(
            '/documentation/example_product',
            method='MOVE',
            headers={'destination': '/documentation/products/ZA41'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/example_product', status=404)
        self.testapp.get('/documentation/example_product/report_sample.txt', status=404)
        self.testapp.get('/documentation/products/ZA41', status=200)
        self.testapp.get('/documentation/products/ZA41/report_sample.txt', status=200)

    def test_functional__webdav_move_folder__ok__same_workspace_folder_to_root(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
                        False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='examples',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            example_product_folder = api.create(
                content_type_list.Folder.slug,
                workspace,
                example_folder,
                label='example_product',
                do_save=True,
                do_notify=False,
            )
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_product_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/examples', status=200)
        self.testapp.get('/documentation/examples/example_product', status=200)
        self.testapp.get('/documentation/examples/example_product/report_sample.txt', status=200)
        # do move
        self.testapp.request(
            '/documentation/examples/example_product',
            method='MOVE',
            headers={'destination': '/documentation/ZA41'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/examples/example_product', status=404)
        self.testapp.get('/documentation/examples/example_product/report_sample.txt', status=404)
        self.testapp.get('/documentation/ZA41', status=200)
        self.testapp.get('/documentation/ZA41/report_sample.txt', status=200)

    def test_functional__webdav_move_folder__ok__rename_file_at_root(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
                        False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        with dbsession.no_autoflush:
            example_product_folder = api.create(
                content_type_list.Folder.slug,
                workspace,
                None,
                label='example_product',
                do_save=True,
                do_notify=False,
            )
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_product_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/example_product', status=200)
        self.testapp.get('/documentation/example_product/report_sample.txt', status=200)

        # do move
        self.testapp.request(
            '/documentation/example_product',
            method='MOVE',
            headers={'destination': '/documentation/products'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/example_product', status=404)
        self.testapp.get('/documentation/example_product/report_sample.txt', status=404)
        self.testapp.get('/documentation/products', status=200)
        self.testapp.get('/documentation/products/report_sample.txt', status=200)

    # move different workspaces: file
    def test_functional__webdav_move_file__ok__different_workspace_folder_to_folder(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        workspace2 = workspace_api.create_workspace('projects', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='examples',
            do_save=True,
            do_notify=False,
        )
        product_folder = api.create(
            content_type_list.Folder.slug,
            workspace2,
            None,
            label='products',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/examples', status=200)
        self.testapp.get('/documentation/examples/report_sample.txt', status=200)
        self.testapp.get('/projects/products', status=200)
        # do move
        self.testapp.request(
            '/documentation/examples/report_sample.txt',
            method='MOVE',
            headers={'destination': '/projects/products/super_product_readme_ZA41.txt'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/examples/report_sample.txt', status=404)
        self.testapp.get('/projects/products/super_product_readme_ZA41.txt', status=200)

    def test_functional__webdav_move_file__ok__different_workspace_root_to_folder(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        workspace2 = workspace_api.create_workspace('projects', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        product_folder = api.create(
            content_type_list.Folder.slug,
            workspace2,
            None,
            label='products',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/report_sample.txt', status=200)
        self.testapp.get('/projects/products', status=200)
        # do move
        self.testapp.request(
            '/documentation/report_sample.txt',
            method='MOVE',
            headers={'destination': '/projects/products/super_product_readme_ZA41.txt'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/report_sample.txt', status=404)
        self.testapp.get('/projects/products/super_product_readme_ZA41.txt', status=200)

    def test_functional__webdav_move_file__ok__different_workspace_folder_to_root(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        workspace2 = workspace_api.create_workspace('projects', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='examples',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/examples', status=200)
        self.testapp.get('/documentation/examples/report_sample.txt', status=200)
        # do move
        self.testapp.request(
            '/documentation/examples/report_sample.txt',
            method='MOVE',
            headers={'destination': '/projects/super_product_readme_ZA41.txt'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/examples/report_sample.txt', status=404)
        self.testapp.get('/projects/super_product_readme_ZA41.txt', status=200)

    def test_functional__webdav_move_file__ok__different_workspace_root_to_root(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        workspace2 = workspace_api.create_workspace('projects', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/report_sample.txt', status=200)
        # do move
        self.testapp.request(
            '/documentation/report_sample.txt',
            method='MOVE',
            headers={'destination': '/projects/super_product_readme_ZA41.txt'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/report_sample.txt', status=404)
        self.testapp.get('/projects/super_product_readme_ZA41.txt', status=200)

    # move different workspace: folder
    def test_functional__webdav_move_folder__ok__different_workspace_folder_to_folder(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        workspace2 = workspace_api.create_workspace('projects', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='examples',
            do_save=True,
            do_notify=False,
        )
        product_folder = api.create(
            content_type_list.Folder.slug,
            workspace2,
            None,
            label='products',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            example_product_folder = api.create(
                content_type_list.Folder.slug,
                workspace,
                example_folder,
                label='example_product',
                do_save=True,
                do_notify=False,
            )
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_product_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/examples', status=200)
        self.testapp.get('/documentation/examples/example_product', status=200)
        self.testapp.get('/documentation/examples/example_product/report_sample.txt', status=200)
        self.testapp.get('/projects/products', status=200)
        # do move
        self.testapp.request(
            '/documentation/examples/example_product',
            method='MOVE',
            headers={'destination': '/projects/products/ZA41'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/examples/example_product', status=404)
        self.testapp.get('/documentation/examples/example_product/report_sample.txt', status=404)
        self.testapp.get('/documentation/examples/ZA41', status=404)
        self.testapp.get('/projects/products/ZA41', status=200)
        self.testapp.get('/projects/products/ZA41/report_sample.txt', status=200)

    def test_functional__webdav_move_folder__ok__different_workspace_root_to_folder(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        workspace2 = workspace_api.create_workspace('projects', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        product_folder = api.create(
            content_type_list.Folder.slug,
            workspace2,
            None,
            label='products',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            example_product_folder = api.create(
                content_type_list.Folder.slug,
                workspace,
                None,
                label='example_product',
                do_save=True,
                do_notify=False,
            )
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_product_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/example_product', status=200)
        self.testapp.get('/documentation/example_product/report_sample.txt', status=200)
        self.testapp.get('/projects/products', status=200)
        # do move
        self.testapp.request(
            '/documentation/example_product',
            method='MOVE',
            headers={'destination': '/projects/products/ZA41'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/example_product', status=404)
        self.testapp.get('/documentation/example_product/report_sample.txt', status=404)
        self.testapp.get('/projects/products/ZA41', status=200)
        self.testapp.get('/projects/products/ZA41/report_sample.txt', status=200)

    def test_functional__webdav_move_folder__ok__different_workspace_folder_to_root(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        workspace2 = workspace_api.create_workspace('projects', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label='examples',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            example_product_folder = api.create(
                content_type_list.Folder.slug,
                workspace,
                example_folder,
                label='example_product',
                do_save=True,
                do_notify=False,
            )
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_product_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/examples', status=200)
        self.testapp.get('/documentation/examples/example_product', status=200)
        self.testapp.get('/documentation/examples/example_product/report_sample.txt', status=200)
        # do move
        self.testapp.request(
            '/documentation/examples/example_product',
            method='MOVE',
            headers={'destination': '/projects/ZA41'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/examples/example_product', status=404)
        self.testapp.get('/documentation/examples/example_product/report_sample.txt', status=404)
        self.testapp.get('/projects/ZA41', status=200)
        self.testapp.get('/projects/ZA41/report_sample.txt', status=200)

    def test_functional__webdav_move_folder__ok__different_workspace_root_to_root(self) -> None:
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
        workspace = workspace_api.create_workspace('documentation', save_now=True)  # nopep8
        workspace2 = workspace_api.create_workspace('projects', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)  # nopep8
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        with dbsession.no_autoflush:
            example_product_folder = api.create(
                content_type_list.Folder.slug,
                workspace,
                None,
                label='example_product',
                do_save=True,
                do_notify=False,
            )
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_product_folder,
                filename='report_sample.txt',
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(
                file,
                'report_sample.txt',
                'text/plain',
                b'test_content'
            )
            api.save(file)
        transaction.commit()


        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # check availability of content
        self.testapp.get('/documentation', status=200)
        self.testapp.get('/documentation/example_product', status=200)
        self.testapp.get('/documentation/example_product/report_sample.txt', status=200)

        # do move
        self.testapp.request(
            '/documentation/example_product',
            method='MOVE',
            headers={'destination': '/projects/products'},
            status=201
        )
        # verify move
        self.testapp.get('/documentation/example_product', status=404)
        self.testapp.get('/documentation/example_product/report_sample.txt', status=404)
        self.testapp.get('/projects/products', status=200)
        self.testapp.get('/projects/products/report_sample.txt', status=200)
