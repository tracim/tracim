# -*- coding: utf-8 -*-
"""
Tests for /api/v2/workspaces subpath endpoints.
"""
import requests
import transaction
from depot.io.utils import FileIntent

from tracim_backend import models
from tracim_backend.app_models.contents import content_type_list
from tracim_backend import error
from tracim_backend.extensions import app_list
from tracim_backend.fixtures.content import Content as ContentFixtures
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models import get_tm_session
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests import FunctionalTest
from tracim_backend.tests import set_html_document_slug_to_legacy


class TestWorkspaceEndpoint(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id} endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_workspace__ok_200__nominal_case(self) -> None:
        """
        Check obtain workspace reachable for user.
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        workspace_api = WorkspaceApi(
            session=dbsession,
            current_user=admin,
            config=self.app_config,
        )
        workspace = workspace_api.get_one(workspace.workspace_id)
        app_api = ApplicationApi(
            app_list
        )
        default_sidebar_entry = app_api.get_default_workspace_menu_entry(workspace=workspace)  # nope8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/{}'.format(workspace.workspace_id), status=200)
        workspace_dict = res.json_body
        assert workspace_dict['workspace_id'] == workspace.workspace_id
        assert workspace_dict['label'] == workspace.label
        assert workspace_dict['description'] == workspace.description
        assert workspace_dict['is_deleted'] is False

        assert len(workspace_dict['sidebar_entries']) == len(default_sidebar_entry)
        for counter, sidebar_entry in enumerate(default_sidebar_entry):
            workspace_dict['sidebar_entries'][counter]['slug'] = sidebar_entry.slug
            workspace_dict['sidebar_entries'][counter]['label'] = sidebar_entry.label
            workspace_dict['sidebar_entries'][counter]['route'] = sidebar_entry.route
            workspace_dict['sidebar_entries'][counter]['hexcolor'] = sidebar_entry.hexcolor  # nopep8
            workspace_dict['sidebar_entries'][counter]['fa_icon'] = sidebar_entry.fa_icon  # nopep8

    def test_api__get_workspace__ok_200__admin_and_not_in_workspace(self) -> None:
        """
        Check obtain workspace reachable for user.
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.delete_one(admin.user_id, workspace.workspace_id)
        workspace_api = WorkspaceApi(
            session=dbsession,
            current_user=admin,
            config=self.app_config,
        )
        workspace = workspace_api.get_one(workspace.workspace_id)
        app_api = ApplicationApi(
            app_list
        )
        default_sidebar_entry = app_api.get_default_workspace_menu_entry(workspace=workspace)  # nope8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/{}'.format(workspace.workspace_id), status=200)
        workspace_dict = res.json_body
        assert workspace_dict['workspace_id'] == workspace.workspace_id
        assert workspace_dict['label'] == workspace.label
        assert workspace_dict['description'] == workspace.description
        assert workspace_dict['is_deleted'] is False

        assert len(workspace_dict['sidebar_entries']) == len(default_sidebar_entry)
        for counter, sidebar_entry in enumerate(default_sidebar_entry):
            workspace_dict['sidebar_entries'][counter]['slug'] = sidebar_entry.slug
            workspace_dict['sidebar_entries'][counter]['label'] = sidebar_entry.label
            workspace_dict['sidebar_entries'][counter]['route'] = sidebar_entry.route
            workspace_dict['sidebar_entries'][counter]['hexcolor'] = sidebar_entry.hexcolor  # nopep8
            workspace_dict['sidebar_entries'][counter]['fa_icon'] = sidebar_entry.fa_icon  # nopep8

    def test_api__update_workspace__ok_200__nominal_case(self) -> None:
        """
        Test update workspace
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()

        workspace_api = WorkspaceApi(
            session=dbsession,
            current_user=admin,
            config=self.app_config,
        )
        workspace = workspace_api.get_one(1)
        app_api = ApplicationApi(
            app_list
        )
        default_sidebar_entry = app_api.get_default_workspace_menu_entry(workspace=workspace)  # nope8

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': 'superworkspace',
            'description': 'mysuperdescription'
        }
        # Before
        res = self.testapp.get(
            '/api/v2/workspaces/1',
            status=200
        )
        assert res.json_body
        workspace = res.json_body
        assert workspace['workspace_id'] == 1
        assert workspace['slug'] == 'business'
        assert workspace['label'] == 'Business'
        assert workspace['description'] == 'All importants documents'
        assert len(workspace['sidebar_entries']) == len(default_sidebar_entry)
        assert workspace['is_deleted'] is False

        # modify workspace
        res = self.testapp.put_json(
            '/api/v2/workspaces/1',
            status=200,
            params=params,
        )
        assert res.json_body
        workspace = res.json_body
        assert workspace['workspace_id'] == 1
        assert workspace['slug'] == 'superworkspace'
        assert workspace['label'] == 'superworkspace'
        assert workspace['description'] == 'mysuperdescription'
        assert len(workspace['sidebar_entries']) == len(default_sidebar_entry)
        assert workspace['is_deleted'] is False

        # after
        res = self.testapp.get(
            '/api/v2/workspaces/1',
            status=200
        )
        assert res.json_body
        workspace = res.json_body
        assert workspace['workspace_id'] == 1
        assert workspace['slug'] == 'superworkspace'
        assert workspace['label'] == 'superworkspace'
        assert workspace['description'] == 'mysuperdescription'
        assert len(workspace['sidebar_entries']) == len(default_sidebar_entry)
        assert workspace['is_deleted'] is False

    def test_api__update_workspace__err_400__empty_label(self) -> None:
        """
        Test update workspace with empty label
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': '',
            'description': 'mysuperdescription'
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/1',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8

    def test_api__create_workspace__ok_200__nominal_case(self) -> None:
        """
        Test create workspace
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': 'superworkspace',
            'description': 'mysuperdescription'
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces',
            status=200,
            params=params,
        )
        assert res.json_body
        workspace = res.json_body
        workspace_id = res.json_body['workspace_id']
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace_2 = res.json_body
        assert workspace == workspace_2

    def test_api__create_workspace_err_400__label_already_used(self) -> None:
        """
        Test create workspace : label already used
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': 'superworkspace',
            'description': 'mysuperdescription'
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces',
            status=200,
            params=params,
        )
        res = self.testapp.post_json(
            '/api/v2/workspaces',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_LABEL_ALREADY_USED

    def test_api__create_workspace__err_400__empty_label(self) -> None:
        """
        Test create workspace with empty label
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': '',
            'description': 'mysuperdescription'
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8

    def test_api__delete_workspace__ok_200__admin(self) -> None:
        """
        Test delete workspace as admin
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed'.format(workspace_id),
            status=204
        )
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND  # nopep8
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace = res.json_body
        assert workspace['is_deleted'] is True

    def test_api__delete_workspace__ok_200__manager_workspace_manager(self) -> None:
        """
        Test delete workspace as global manager and workspace manager
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed'.format(workspace_id),
            status=204
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace = res.json_body
        assert workspace['is_deleted'] is True

    def test_api__delete_workspace__err_403__user_workspace_manager(self) -> None:
        """
        Test delete workspace as simple user and workspace manager
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed'.format(workspace_id),
            status=403
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.INSUFFICIENT_USER_PROFILE
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace = res.json_body
        assert workspace['is_deleted'] is False

    def test_api__delete_workspace__err_403__manager_reader(self) -> None:
        """
        Test delete workspace as manager and reader of the workspace
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False)  # nopep8
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed'.format(workspace_id),
            status=403
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.INSUFFICIENT_USER_PROFILE
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace = res.json_body
        assert workspace['is_deleted'] is False

    def test_api__delete_workspace__err_400__manager(self) -> None:
        """
        Test delete workspace as global manager without having any role in the
        workspace
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        user = uapi.create_user('test@test.test', password='test@test.test',
                                do_save=True, do_notify=False)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test',
                                                   save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed'.format(workspace_id),
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND

    def test_api__undelete_workspace__ok_200__admin(self) -> None:
        """
        Test undelete workspace as admin
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        workspace_api.delete(workspace, flush=True)
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        # undelete
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed/restore'.format(workspace_id),
            status=204
        )
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND  # nopep8

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace = res.json_body
        assert workspace['is_deleted'] is False

    def test_api__undelete_workspace__ok_200__manager_workspace_manager(self) -> None:
        """
        Test undelete workspace as global manager and workspace manager
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        workspace_api.delete(workspace, flush=True)
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed/restore'.format(workspace_id),
            status=204
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace = res.json_body
        assert workspace['is_deleted'] is False

    def test_api__undelete_workspace__err_403__user_workspace_manager(self) -> None:
        """
        Test undelete workspace as simple user and workspace manager
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        workspace_api.delete(workspace, flush=True)
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed/restore'.format(workspace_id),
            status=403
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.INSUFFICIENT_USER_PROFILE
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace = res.json_body
        assert workspace['is_deleted'] is True

    def test_api__undelete_workspace__err_403__manager_reader(self) -> None:
        """
        Test undelete workspace as manager and reader of the workspace
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        workspace_api.delete(workspace, flush=True)
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed/restore'.format(workspace_id),
            status=403
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.INSUFFICIENT_USER_PROFILE
        res = self.testapp.get(
            '/api/v2/workspaces/{}'.format(workspace_id),
            status=200
        )
        workspace = res.json_body
        assert workspace['is_deleted'] is True

    def test_api__undelete_workspace__err_400__manager(self) -> None:
        """
        Test delete workspace as global manager without having any role in the
        workspace
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        user = uapi.create_user('test@test.test', password='test@test.test',
                                do_save=True, do_notify=False)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        workspace_api.delete(workspace, flush=True)
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        transaction.commit()
        workspace_id = int(workspace.workspace_id)
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # delete
        res = self.testapp.put(
            '/api/v2/workspaces/{}/trashed/restore'.format(workspace_id),
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND

    def test_api__get_workspace__err_400__unallowed_user(self) -> None:
        """
        Check obtain workspace unreachable for user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'lawrence-not-real-email@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace__err_401__unregistered_user(self) -> None:
        """
        Check obtain workspace without registered user.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] is None
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace__err_400__workspace_does_not_exist(self) -> None:  # nopep8
        """
        Check obtain workspace who does not exist with an existing user.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/5', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()


class TestWorkspacesEndpoints(FunctionalTest):
    """
    Tests for /api/v2/workspaces
    """
    fixtures = [BaseFixture]

    def test_api__get_workspaces__ok_200__nominal_case(self):
        """
        Check obtain all workspaces reachables for user with user auth.
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()

        workspace_api = WorkspaceApi(
            session=dbsession,
            current_user=admin,
            config=self.app_config,
        )
        workspace_api.create_workspace('test', save_now=True)  # nopep8
        workspace_api.create_workspace('test2', save_now=True)  # nopep8
        workspace_api.create_workspace('test3', save_now=True)  # nopep8
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces', status=200)
        res = res.json_body
        assert len(res) == 3
        workspace = res[0]
        assert workspace['label'] == 'test'
        assert workspace['slug'] == 'test'
        workspace = res[1]
        assert workspace['label'] == 'test2'
        assert workspace['slug'] == 'test2'
        workspace = res[2]
        assert workspace['label'] == 'test3'
        assert workspace['slug'] == 'test3'

    def test_api__get_workspaces__err_403__unallowed_user(self):
        """
        Check obtain all workspaces reachables for one user
        with another non-admin user auth.
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        res = self.testapp.get('/api/v2/workspaces', status=403)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.INSUFFICIENT_USER_PROFILE
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspaces__err_401__unregistered_user(self):
        """
        Check obtain all workspaces reachables for one user
        without correct user auth (user unregistered).
        """
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] is None
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()


class TestWorkspaceMembersEndpoint(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/members endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_workspace_members__ok_200__nominal_case(self):
        """
        Check obtain workspace members list with a reachable workspace for user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1/members', status=200).json_body   # nopep8
        assert len(res) == 1
        user_role = res[0]
        assert user_role['role'] == 'workspace-manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1
        assert user_role['workspace']['workspace_id'] == 1
        assert user_role['workspace']['label'] == 'Business'
        assert user_role['workspace']['slug'] == 'business'
        assert user_role['user']['public_name'] == 'Global manager'
        assert user_role['user']['user_id'] == 1
        assert user_role['is_active'] is True
        assert user_role['do_notify'] is True
        # TODO - G.M - 24-05-2018 - [Avatar] Replace
        # by correct value when avatar feature will be enabled
        assert user_role['user']['avatar_url'] is None

    def test_api__get_workspace_members__ok_200__as_admin(self):
        """
        Check obtain workspace members list of a workspace where admin doesn't
        have any right
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        workspace = workspace_api.create_workspace('test_2', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        rapi.delete_one(admin.user_id, workspace.workspace_id)
        transaction.commit()
        user_id = user.user_id
        workspace_id = workspace.workspace_id
        admin_id = admin.user_id
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/{}/members'.format(
            workspace_id,
            user_id
        ), status=200).json_body
        assert len(res) == 1
        user_role = res[0]
        assert user_role['role'] == 'reader'
        assert user_role['user_id'] == user_id
        assert user_role['workspace_id'] == workspace_id
        assert user_role['is_active'] is True
        assert user_role['do_notify'] is False

    def test_api__get_workspace_members__err_400__unallowed_user(self):
        """
        Check obtain workspace members list with an unreachable workspace for
        user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'lawrence-not-real-email@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/3/members', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace_members__err_401__unregistered_user(self):
        """
        Check obtain workspace members list with an unregistered user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1/members', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] is None
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace_member__ok_200__self(self):
        """
        Check obtain workspace members list with a reachable workspace for user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1/members/1', status=200).json_body   # nopep8
        user_role = res
        assert user_role['role'] == 'workspace-manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1
        assert user_role['workspace']['workspace_id'] == 1
        assert user_role['workspace']['label'] == 'Business'
        assert user_role['workspace']['slug'] == 'business'
        assert user_role['user']['public_name'] == 'Global manager'
        assert user_role['user']['user_id'] == 1
        assert user_role['is_active'] is True
        assert user_role['do_notify'] is True
        # TODO - G.M - 24-05-2018 - [Avatar] Replace
        # by correct value when avatar feature will be enabled
        assert user_role['user']['avatar_url'] is None

    def test_api__get_workspace_member__ok_200__as_admin(self):
        """
        Check obtain workspace members list with a reachable workspace for user
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        workspace = workspace_api.create_workspace('test_2', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        rapi.delete_one(admin.user_id, workspace.workspace_id)
        transaction.commit()
        user_id = user.user_id
        workspace_id = workspace.workspace_id
        admin_id = admin.user_id
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/{}/members/{}'.format(
            workspace_id,
            user_id
        ), status=200).json_body
        user_role = res
        assert user_role['role'] == 'reader'
        assert user_role['user_id'] == user_id
        assert user_role['workspace_id'] == workspace_id
        assert user_role['is_active'] is True
        assert user_role['do_notify'] is False

    def test_api__get_workspace_member__ok_200__other_user(self):
        """
        Check obtain workspace members list with a reachable workspace for user
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        workspace = workspace_api.create_workspace('test_2', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        transaction.commit()
        user_id = user.user_id
        workspace_id = workspace.workspace_id
        admin_id = admin.user_id
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/{}/members/{}'.format(
            workspace_id,
            user_id
        ), status=200).json_body
        user_role = res
        assert user_role['role'] == 'reader'
        assert user_role['user_id'] == user_id
        assert user_role['workspace_id'] == workspace_id
        assert user_role['is_active'] is True
        assert user_role['do_notify'] is False

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/{}/members/{}'.format(
            workspace_id,
            admin_id
        ), status=200).json_body
        user_role = res
        assert user_role['role'] == 'workspace-manager'
        assert user_role['user_id'] == admin_id
        assert user_role['workspace_id'] == workspace_id
        assert user_role['is_active'] is True
        assert user_role['do_notify'] is True

    def test_api__get_workspace_member__err_400__unallowed_user(self):
        """
        Check obtain workspace members info with an unreachable workspace for
        user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'lawrence-not-real-email@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/3/members/1', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace_member__err_401__unregistered_user(self):
        """
        Check obtain workspace member info with an unregistered user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1/members/1', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] is None
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace_members__err_400__workspace_does_not_exist(self):  # nopep8
        """
        Check obtain workspace members list with an existing user but
        an unexisting workspace
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/5/members', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__create_workspace_member_role__ok_200__user_id(self):
        """
        Create workspace member role
        :return:
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': 2,
            'user_email': None,
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=200,
            params=params,
        )
        user_role_found = res.json_body
        assert user_role_found['role'] == 'content-manager'
        assert user_role_found['user_id'] == 2
        assert user_role_found['workspace_id'] == 1
        assert user_role_found['newly_created'] is False
        assert user_role_found['email_sent'] is False
        assert user_role_found['do_notify'] is False

        res = self.testapp.get('/api/v2/workspaces/1/members', status=200).json_body   # nopep8
        assert len(res) == 2
        user_role = res[0]
        assert user_role['role'] == 'workspace-manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1
        user_role = res[1]
        assert user_role_found['role'] == user_role['role']
        assert user_role_found['user_id'] == user_role['user_id']
        assert user_role_found['workspace_id'] == user_role['workspace_id']

    def test_api__create_workspace_members_role_ok_200__user_email_as_admin(self):
        """
        Check obtain workspace members list of a workspace where admin doesn't
        have any right
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        workspace = workspace_api.create_workspace('test_2', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.delete_one(admin.user_id, workspace.workspace_id)
        transaction.commit()
        workspace_id = workspace.workspace_id
        admin_id = admin.user_id
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_email': 'lawrence-not-real-email@fsf.local',
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/{}/members'.format(workspace_id),
            status=200,
            params=params,
        )
        user_role_found = res.json_body
        assert user_role_found['role'] == 'content-manager'
        assert user_role_found['user_id']
        assert user_role_found['workspace_id'] == workspace_id
        assert user_role_found['newly_created'] is False
        assert user_role_found['email_sent'] is False
        assert user_role_found['do_notify'] is False

        res = self.testapp.get('/api/v2/workspaces/{}/members'.format(workspace_id), status=200).json_body   # nopep8
        assert len(res) == 1
        user_role = res[0]
        assert user_role_found['role'] == user_role['role']
        assert user_role_found['user_id'] == user_role['user_id']
        assert user_role_found['workspace_id'] == user_role['workspace_id']

    def test_api__create_workspace_members_role_ok_200__user_email_as_workspace_manager(self):  # nopep8
        """
        Check obtain workspace members list of a workspace where admin doesn't
        have any right
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        workspace = workspace_api.create_workspace('test_2', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        rapi.delete_one(admin.user_id, workspace.workspace_id)
        transaction.commit()
        user_id = user.user_id
        workspace_id = workspace.workspace_id
        admin_id = admin.user_id
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_email': 'lawrence-not-real-email@fsf.local',
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/{}/members'.format(workspace_id),
            status=200,
            params=params,
        )
        user_role_found = res.json_body
        assert user_role_found['role'] == 'content-manager'
        assert user_role_found['user_id']
        assert user_role_found['workspace_id'] == workspace_id
        assert user_role_found['newly_created'] is False
        assert user_role_found['email_sent'] is False
        assert user_role_found['do_notify'] is False

        res = self.testapp.get('/api/v2/workspaces/{}/members'.format(workspace_id), status=200).json_body   # nopep8
        assert len(res) == 2
        user_role = res[0]
        assert user_role_found['role'] == user_role['role']
        assert user_role_found['user_id'] == user_role['user_id']
        assert user_role_found['workspace_id'] == user_role['workspace_id']
        user_role = res[1]
        assert user_role['role'] == 'workspace-manager'
        assert user_role['user_id'] == user_id
        assert user_role['workspace_id'] == workspace_id

    def test_api__create_workspace_member_role__ok_200__user_email(self):
        """
        Create workspace member role
        :return:
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_email': 'lawrence-not-real-email@fsf.local',
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=200,
            params=params,
        )
        user_role_found = res.json_body
        assert user_role_found['role'] == 'content-manager'
        assert user_role_found['user_id'] == 2
        assert user_role_found['workspace_id'] == 1
        assert user_role_found['newly_created'] is False
        assert user_role_found['email_sent'] is False
        assert user_role_found['do_notify'] is False

        res = self.testapp.get('/api/v2/workspaces/1/members', status=200).json_body   # nopep8
        assert len(res) == 2
        user_role = res[0]
        assert user_role['role'] == 'workspace-manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1
        user_role = res[1]
        assert user_role_found['role'] == user_role['role']
        assert user_role_found['user_id'] == user_role['user_id']
        assert user_role_found['workspace_id'] == user_role['workspace_id']

    def test_api__create_workspace_member_role__err_400__user_email__user_deactivated(self):  # nopep8
        """
        Create workspace member role
        :return:
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        lawrence = uapi.get_one_by_email('lawrence-not-real-email@fsf.local')
        lawrence.is_active = False
        uapi.save(lawrence)
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )

        # create workspace role
        params = {
            'user_id': None,
            'user_email': 'lawrence-not-real-email@fsf.local',
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_NOT_ACTIVE

    def test_api__create_workspace_member_role__err_400__user_email__user_deleted(self):  # nopep8
        """
        Create workspace member role
        :return:
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        lawrence = uapi.get_one_by_email('lawrence-not-real-email@fsf.local')
        lawrence.is_deleted = True
        uapi.save(lawrence)
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )

        # create workspace role
        params = {
            'user_id': None,
            'user_email': 'lawrence-not-real-email@fsf.local',
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_DELETED

    def test_api__create_workspace_member_role__ok_200__user_public_name(self):
        """
        Create workspace member role
        :return:
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_email': None,
            'user_public_name': 'Lawrence L.',
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=200,
            params=params,
        )
        user_role_found = res.json_body
        assert user_role_found['role'] == 'content-manager'
        assert user_role_found['user_id'] == 2
        assert user_role_found['workspace_id'] == 1
        assert user_role_found['newly_created'] is False
        assert user_role_found['email_sent'] is False
        assert user_role_found['do_notify'] is False

        res = self.testapp.get('/api/v2/workspaces/1/members', status=200).json_body   # nopep8
        assert len(res) == 2
        user_role = res[0]
        assert user_role['role'] == 'workspace-manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1
        user_role = res[1]
        assert user_role_found['role'] == user_role['role']
        assert user_role_found['user_id'] == user_role['user_id']
        assert user_role_found['workspace_id'] == user_role['workspace_id']

    def test_api__create_workspace_member_role__ok_400__user_public_name_user_already_in_workspace(self):
        """
        Create workspace member role
        :return:
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_email': None,
            'user_public_name': 'Lawrence L.',
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=200,
            params=params,
        )
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_ROLE_ALREADY_EXIST

    def test_api__create_workspace_member_role__err_400__nothing_and_no_notification(self):  # nopep8
        """
        Create workspace member role
        :return:
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_email': None,
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_NOT_FOUND

    def test_api__create_workspace_member_role__err_400__wrong_user_id_and_not_notification(self):  # nopep8
        """
        Create workspace member role
        :return:
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': 47,
            'user_email': None,
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_NOT_FOUND

    def test_api__create_workspace_member_role__err_400__notification_disabled_user_not_found(self):  # nopep8
        """
        Create workspace member role
        :return:
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_email': 'nothing@nothing.nothing',
            'user_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_NOT_FOUND

    def test_api__update_workspace_member_role__ok_200__nominal_case(self):
        """
        Update worskpace member role
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        user2 = uapi.create_user('test2@test2.test2', password='test2@test2.test2', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        rapi.create_one(user2, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        rapi.delete_one(admin.user_id, workspace.workspace_id)
        transaction.commit()
        # before
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id
            ),
            status=200,
        )
        # update workspace role
        params = {
            'role': 'content-manager',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id
            ),
            status=200,
            params=params,
        )
        user_role = res.json_body
        assert user_role['role'] == 'content-manager'
        assert user_role['user_id'] == user2.user_id
        assert user_role['workspace_id'] == workspace.workspace_id
        # after
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id,
            ),
            status=200
        ).json_body   # nopep8
        user_role = res
        assert user_role['role'] == 'content-manager'
        assert user_role['do_notify'] is False
        assert user_role['user_id'] == user2.user_id
        assert user_role['workspace_id'] == workspace.workspace_id

    def test_api__update_workspace_member_role__err_400__role_not_exist(self):
        """
        Update worskpace member role
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        user2 = uapi.create_user('test2@test2.test2', password='test2@test2.test2', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.delete_one(admin.user_id, workspace.workspace_id)
        transaction.commit()
        # update workspace role
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'role': 'content-manager',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id
            ),
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_ROLE_NOT_FOUND

    def test_api__update_workspace_member_role__ok_200__as_admin(self):
        """
        Update worskpace member role
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        user2 = uapi.create_user('test2@test2.test2', password='test2@test2.test2', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=None,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        rapi.create_one(user2, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        rapi.delete_one(admin.user_id, workspace.workspace_id)
        transaction.commit()
        # before
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id
            ),
            status=200,
        )
        # update workspace role
        params = {
            'role': 'content-manager',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id
            ),
            status=200,
            params=params,
        )
        user_role = res.json_body
        assert user_role['role'] == 'content-manager'
        assert user_role['user_id'] == user2.user_id
        assert user_role['workspace_id'] == workspace.workspace_id
        # after
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id,
            ),
            status=200
        ).json_body   # nopep8
        user_role = res
        assert user_role['role'] == 'content-manager'
        assert user_role['do_notify'] is False
        assert user_role['user_id'] == user2.user_id
        assert user_role['workspace_id'] == workspace.workspace_id

    def test_api__delete_workspace_member_role__ok_200__as_admin(self):
        """
        Delete worskpace member role
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.delete(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user.user_id,
            ),
            status=204,
        )
        # after
        roles = self.testapp.get('/api/v2/workspaces/{}/members'.format(workspace.workspace_id), status=200).json_body   # nopep8
        for role in roles:
            assert role['user_id'] != user.user_id

    def test_api__delete_workspace_member_role__ok_200__nominal_case(self):
        """
        Delete worskpace member role
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        user2 = uapi.create_user('test2@test2.test2', password='test2@test2.test2', do_save=True, do_notify=False, groups=groups)  # nopep8
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        rapi.create_one(user2, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        res = self.testapp.delete(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id,
            ),
            status=204,
        )
        # after
        roles = self.testapp.get('/api/v2/workspaces/{}/members'.format(workspace.workspace_id), status=200).json_body   # nopep8
        for role in roles:
            assert role['user_id'] != user2.user_id

    def test_api__delete_workspace_member_role__err_400__role_not_exist(self):
        """
        Delete worskpace member role
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        user2 = uapi.create_user('test2@test2.test2', password='test2@test2.test2', do_save=True, do_notify=False, groups=groups)  # nopep8
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
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.delete(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id,
            ),
            status=400,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_ROLE_NOT_FOUND

    def test_api__delete_workspace_member_role__err_400__workspace_manager_itself(self):  # nopep8
        """
        Delete worskpace member role.
        Unallow to delete himself as workspace_manager
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        user2 = uapi.create_user('test2@test2.test2', password='test2@test2.test2', do_save=True, do_notify=False, groups=groups)  # nopep8
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        rapi.create_one(user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'test2@test2.test2',
                'test2@test2.test2'
            )
        )
        res = self.testapp.delete(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user2.user_id,
            ),
            status=400,
        )
        assert res.json_body['code'] == error.USER_CANT_REMOVE_IS_OWN_ROLE_IN_WORKSPACE  # nopep8
        # after
        roles = self.testapp.get('/api/v2/workspaces/{}/members'.format(workspace.workspace_id), status=200).json_body   # nopep8
        assert user2.user_id in [role['user_id'] for role in roles]

    def test_api__delete_workspace_member_role__err_400__simple_user(self):
        """
        Delete worskpace member role
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        user2 = uapi.create_user('test2@test2.test2', password='test2@test2.test2', do_save=True, do_notify=False, groups=groups)  # nopep8
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        rapi.create_one(user2, workspace, UserRoleInWorkspace.READER, False)  # nopep8
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'test2@test2.test2',
                'test2@test2.test2'
            )
        )
        res = self.testapp.delete(
            '/api/v2/workspaces/{workspace_id}/members/{user_id}'.format(
                workspace_id=workspace.workspace_id,
                user_id=user.user_id,
            ),
            status=403,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.INSUFFICIENT_USER_ROLE_IN_WORKSPACE
        # after
        roles = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/members'.format(
                workspace_id=workspace.workspace_id
            ),
            status=200
        ).json_body
        assert len([role for role in roles if role['user_id'] == user.user_id]) == 1  # nopep8


class TestUserInvitationWithMailActivatedSync(FunctionalTest):

    fixtures = [BaseFixture, ContentFixtures]
    config_section = 'functional_test_with_mail_test_sync'

    def test_api__create_workspace_member_role__ok_200__new_user(self):  # nopep8
        """
        Create workspace member role
        :return:
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        groups = [gapi.get_one_with_name('trusted-users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        transaction.commit()

        requests.delete('http://127.0.0.1:8025/api/v1/messages')
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_public_name': None,
            'user_email': 'bob@bob.bob',
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/{}/members'.format(workspace.workspace_id),
            status=200,
            params=params,
        )
        user_role_found = res.json_body
        assert user_role_found['role'] == 'content-manager'
        assert user_role_found['user_id']
        user_id = user_role_found['user_id']
        assert user_role_found['workspace_id'] == workspace.workspace_id
        assert user_role_found['newly_created'] is True
        assert user_role_found['email_sent'] is True
        assert user_role_found['do_notify'] is False

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200,
        )
        res = res.json_body
        assert res['profile'] == 'users'

        # check mail received
        response = requests.get('http://127.0.0.1:8025/api/v1/messages')
        response = response.json()
        assert len(response) == 1
        headers = response[0]['Content']['Headers']
        assert headers['From'][0] == 'Tracim Notifications <test_user_from+0@localhost>'  # nopep8
        assert headers['To'][0] == 'bob <bob@bob.bob>'
        assert headers['Subject'][0] == '[TRACIM] Created account'

        # TODO - G.M - 2018-08-02 - Place cleanup outside of the test
        requests.delete('http://127.0.0.1:8025/api/v1/messages')

    def test_api__create_workspace_member_role__err_400__user_not_found_as_simple_user(self):  # nopep8
        """
        Create workspace member role
        :return:
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
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
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)  # nopep8
        transaction.commit()

        requests.delete('http://127.0.0.1:8025/api/v1/messages')
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_public_name': None,
            'user_email': 'bob@bob.bob',
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/{}/members'.format(workspace.workspace_id),
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_NOT_FOUND


class TestUserInvitationWithMailActivatedASync(FunctionalTest):

    fixtures = [BaseFixture, ContentFixtures]
    config_section = 'functional_test_with_mail_test_async'

    def test_api__create_workspace_member_role__ok_200__new_user(self):  # nopep8
        """
        Create workspace member role
        :return:
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # create workspace role
        params = {
            'user_id': None,
            'user_public_name': None,
            'user_email': 'bob@bob.bob',
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=200,
            params=params,
        )
        user_role_found = res.json_body
        assert user_role_found['newly_created'] is True
        assert user_role_found['email_sent'] is False


class TestWorkspaceContents(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/contents endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_workspace_content__ok_200__get_default(self):
        """
        Check obtain workspace contents with defaults filters
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1/contents', status=200).json_body   # nopep8
        # TODO - G.M - 30-05-2018 - Check this test
        assert len(res) == 3
        content = res[0]
        assert content['content_id'] == 11
        assert content['content_type'] == 'html-document'
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Current Menu'
        assert content['parent_id'] == 2
        assert content['show_in_ui'] is True
        assert content['slug'] == 'current-menu'
        assert content['status'] == 'open'
        assert content['modified']
        assert content['created']
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 1
        content = res[1]
        assert content['content_id'] == 2
        assert content['content_type'] == 'folder'
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Menus'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'menus'
        assert content['status'] == 'open'
        assert len(content['sub_content_types']) > 1
        assert 'comment' in content['sub_content_types']
        assert 'folder' in content['sub_content_types']
        assert content['workspace_id'] == 1
        assert content['modified']
        assert content['created']
        content = res[2]
        assert content['content_id'] == 1
        assert content['content_type'] == 'folder'
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Tools'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'tools'
        assert content['status'] == 'open'
        assert len(content['sub_content_types']) > 1
        assert 'comment' in content['sub_content_types']
        assert 'folder' in content['sub_content_types']
        assert content['workspace_id'] == 1
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_default_html_documents(self):
        """
        Check obtain workspace contents with defaults filters + content_filter
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'content_type': 'html-document',
        }
        res = self.testapp.get('/api/v2/workspaces/1/contents', status=200, params=params).json_body   # nopep8
        assert len(res) == 1
        content = res[0]
        assert content
        assert content['content_id'] == 11
        assert content['content_type'] == 'html-document'
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Current Menu'
        assert content['parent_id'] == 2
        assert content['show_in_ui'] is True
        assert content['slug'] == 'current-menu'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 1
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_all_root_content__legacy_html_slug(self):  # nopep8
        """
        Check obtain workspace all root contents
        """
        set_html_document_slug_to_legacy(self.session_factory)
        params = {
            'parent_id': 0,
            'show_archived': 1,
            'show_deleted': 1,
            'show_active': 1,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/3/contents',
            status=200,
            params=params,
        ).json_body  # nopep8
        # TODO - G.M - 30-05-2018 - Check this test
        assert len(res) == 4
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 17
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']
        content = res[1]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 16
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']
        content = res[3]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_all_root_content(self):
        """
        Check obtain workspace all root contents
        """
        params = {
            'parent_id': 0,
            'show_archived': 1,
            'show_deleted': 1,
            'show_active': 1,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/3/contents',
            status=200,
            params=params,
        ).json_body  # nopep8
        # TODO - G.M - 30-05-2018 - Check this test
        assert len(res) == 4
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 17
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']
        content = res[1]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 16
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']
        content = res[3]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_all_root_content_filter_by_label(self):  # nopep8
        """
        Check obtain workspace all root contents
        """
        params = {
            'parent_id': 0,
            'show_archived': 1,
            'show_deleted': 1,
            'show_active': 1,
            'label': 'ew'
        }
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/3/contents',
            status=200,
            params=params,
        ).json_body  # nopep8
        # TODO - G.M - 30-05-2018 - Check this test
        assert len(res) == 1
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_only_active_root_content(self):  # nopep8
        """
        Check obtain workspace root active contents
        """
        params = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/3/contents',
            status=200,
            params=params,
        ).json_body   # nopep8
        # TODO - G.M - 30-05-2018 - Check this test
        assert len(res) == 2
        content = res[1]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_only_archived_root_content(self):  # nopep8
        """
        Check obtain workspace root archived contents
        """
        params = {
            'parent_id': 0,
            'show_archived': 1,
            'show_deleted': 0,
            'show_active': 0,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/3/contents',
            status=200,
            params=params,
        ).json_body   # nopep8
        assert len(res) == 1
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 16
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_only_deleted_root_content(self):  # nopep8
        """
         Check obtain workspace root deleted contents
         """
        params = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 1,
            'show_active': 0,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/3/contents',
            status=200,
            params=params,
        ).json_body   # nopep8
        # TODO - G.M - 30-05-2018 - Check this test

        assert len(res) == 1
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 17
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 3
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_nothing_root_content(self):
        """
        Check obtain workspace root content who does not match any type
        (archived, deleted, active) result should be empty list.
        """
        params = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 0,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/3/contents',
            status=200,
            params=params,
        ).json_body  # nopep8
        # TODO - G.M - 30-05-2018 - Check this test
        assert res == []

    # Folder related
    def test_api__get_workspace_content__ok_200__get_all_filter_content_thread(self):
        # prepare data
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_thread = content_api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test Thread',
            do_save=False,
            do_notify=False,
        )
        test_thread.description = 'Thread description'
        dbsession.add(test_thread)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = '.txt'
        test_file.depot_file = FileIntent(
            b'Test file',
            'Test_file.txt',
            'text/plain',
        )
        test_page_legacy = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=business_workspace,
            label='test_page',
            do_save=False,
            do_notify=False,
        )
        test_page_legacy.type = 'page'
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_page_legacy,
        ):
            content_api.update_content(test_page_legacy, 'test_page', '<p>PAGE</p>')
        test_html_document = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=business_workspace,
            label='test_html_page',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_html_document,
        ):
            content_api.update_content(test_html_document, 'test_page', '<p>HTML_DOCUMENT</p>')  # nopep8
        dbsession.flush()
        transaction.commit()
        # test-itself
        params = {
            'parent_id': 1,
            'show_archived': 1,
            'show_deleted': 1,
            'show_active': 1,
            'content_type': 'thread',
        }
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/contents',
            status=200,
            params=params,
        ).json_body
        assert len(res) == 1
        content = res[0]
        assert content['content_type'] == 'thread'
        assert content['content_id']
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Test Thread'
        assert content['parent_id'] == 1
        assert content['show_in_ui'] is True
        assert content['slug'] == 'test-thread'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}
        assert content['workspace_id'] == 1
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_all_filter_content_html_and_legacy_page(self):  # nopep8
        # prepare data
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_thread = content_api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test Thread',
            do_save=False,
            do_notify=False,
        )
        test_thread.description = 'Thread description'
        dbsession.add(test_thread)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = '.txt'
        test_file.depot_file = FileIntent(
            b'Test file',
            'Test_file.txt',
            'text/plain',
        )
        test_page_legacy = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='test_page',
            do_save=False,
            do_notify=False,
        )
        test_page_legacy.type = 'page'
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_page_legacy,
        ):
            content_api.update_content(test_page_legacy, 'test_page', '<p>PAGE</p>')
        test_html_document = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='test_html_page',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_html_document,
        ):
            content_api.update_content(test_html_document, 'test_html_page', '<p>HTML_DOCUMENT</p>')  # nopep8
            dbsession.flush()
        transaction.commit()
        # test-itself
        params = {
            'parent_id': 1,
            'show_archived': 1,
            'show_deleted': 1,
            'show_active': 1,
            'content_type': 'html-document',
        }
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/contents',
            status=200,
            params=params,
        ).json_body
        assert len(res) == 2
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id']
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'test_html_page'
        assert content['parent_id'] == 1
        assert content['show_in_ui'] is True
        assert content['slug'] == 'test-html-page'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}  # nopep8
        assert content['workspace_id'] == 1
        assert res[0]['content_id'] != res[1]['content_id']
        assert content['modified']
        assert content['created']
        content = res[1]
        assert content['content_type'] == 'html-document'
        assert content['content_id']
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'test_page'
        assert content['parent_id'] == 1
        assert content['show_in_ui'] is True
        assert content['slug'] == 'test-page'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}  # nopep8
        assert content['workspace_id'] == 1
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_all_folder_content(self):
        """
         Check obtain workspace folder all contents
         """
        params = {
            'parent_id': 10,  # TODO - G.M - 30-05-2018 - Find a real id
            'show_archived': 1,
            'show_deleted': 1,
            'show_active': 1,
         #   'content_type': 'any'
        }
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/contents',
            status=200,
            params=params,
        ).json_body   # nopep8
        assert len(res) == 3
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 14
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}  # nopep8
        assert content['workspace_id'] == 2
        assert content['modified']
        assert content['created']
        content = res[1]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 13
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}  # nopep8
        assert content['workspace_id'] == 2
        assert content['modified']
        assert content['created']
        content = res[2]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 12
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}  # nopep8
        assert content['workspace_id'] == 2
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_only_active_folder_content(self):  # nopep8
        """
         Check obtain workspace folder active contents
         """
        params = {
            'parent_id': 10,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/contents',
            status=200,
            params=params,
        ).json_body   # nopep8
        assert len(res) == 1
        content = res[0]
        assert content['content_type']
        assert content['content_id'] == 12
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}  # nopep8
        assert content['workspace_id'] == 2
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_only_archived_folder_content(self):  # nopep8
        """
         Check obtain workspace folder archived contents
         """
        params = {
            'parent_id': 10,
            'show_archived': 1,
            'show_deleted': 0,
            'show_active': 0,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/contents',
            status=200,
            params=params,
        ).json_body   # nopep8
        assert len(res) == 1
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 13
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}  # nopep8
        assert content['workspace_id'] == 2
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_only_deleted_folder_content(self):  # nopep8
        """
         Check obtain workspace folder deleted contents
         """
        params = {
            'parent_id': 10,
            'show_archived': 0,
            'show_deleted': 1,
            'show_active': 0,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/contents',
            status=200,
            params=params,
        ).json_body   # nopep8

        assert len(res) == 1
        content = res[0]
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 14
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'comment'}  # nopep8
        assert content['workspace_id'] == 2
        assert content['modified']
        assert content['created']

    def test_api__get_workspace_content__ok_200__get_nothing_folder_content(self):  # nopep8
        """
        Check obtain workspace folder content who does not match any type
        (archived, deleted, active) result should be empty list.
        """
        params = {
            'parent_id': 10,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 0,
        }
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/contents',
            status=200,
            params=params,
        ).json_body   # nopep8
        # TODO - G.M - 30-05-2018 - Check this test
        assert res == []

    # Error case

    def test_api__get_workspace_content__err_400__unallowed_user(self):
        """
        Check obtain workspace content list with an unreachable workspace for
        user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'lawrence-not-real-email@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/3/contents', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace_content__err_401__unregistered_user(self):
        """
        Check obtain workspace content list with an unregistered user
        """
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1/contents', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] is None
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace_content__err_400__workspace_does_not_exist(self):  # nopep8
        """
        Check obtain workspace contents list with an existing user but
        an unexisting workspace
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/5/contents', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__post_content_create_generic_content__ok_200__nominal_case(self) -> None:  # nopep8
        """
        Create generic content as workspace root
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'parent_id': None,
            'label': 'GenericCreatedContent',
            'content_type': 'html-document',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=200
        )
        assert res
        assert res.json_body
        assert res.json_body['status'] == 'open'
        assert res.json_body['content_id']
        assert res.json_body['content_type'] == 'html-document'
        assert res.json_body['is_archived'] is False
        assert res.json_body['is_deleted'] is False
        assert res.json_body['workspace_id'] == 1
        assert res.json_body['slug'] == 'genericcreatedcontent'
        assert res.json_body['parent_id'] is None
        assert res.json_body['show_in_ui'] is True
        assert res.json_body['sub_content_types']
        assert res.json_body['modified']
        assert res.json_body['created']
        assert res.json_body['file_extension'] == '.document.html'
        assert res.json_body['filename'] == 'GenericCreatedContent.document.html'   # nopep8
        params_active = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        # INFO - G.M - 2018-06-165 - Verify if new content is correctly created
        active_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_active, status=200).json_body  # nopep8
        content_ids = [content['content_id'] for content in active_contents]
        assert res.json_body['content_id'] in content_ids

    def test_api__post_content_create_generic_content__err_400__filename_already_used(self) -> None:  # nopep8
        """
        Create generic content but filename is already used here
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'parent_id': None,
            'label': 'GenericCreatedContent',
            'content_type': 'html-document',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=200
        )
        assert res
        assert res.json_body
        assert res.json_body['status'] == 'open'
        assert res.json_body['content_id']
        assert res.json_body['content_type'] == 'html-document'
        assert res.json_body['is_archived'] is False
        assert res.json_body['is_deleted'] is False
        assert res.json_body['workspace_id'] == 1
        assert res.json_body['slug'] == 'genericcreatedcontent'
        assert res.json_body['parent_id'] is None
        assert res.json_body['show_in_ui'] is True
        assert res.json_body['sub_content_types']
        assert res.json_body['file_extension'] == '.document.html'
        assert res.json_body['filename'] == 'GenericCreatedContent.document.html'   # nopep8
        assert res.json_body['modified']
        assert res.json_body['created']
        params_active = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        # INFO - G.M - 2018-06-165 - Verify if new content is correctly created
        active_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_active, status=200).json_body  # nopep8
        content_ids = [content['content_id'] for content in active_contents]
        assert res.json_body['content_id'] in content_ids

        # recreate same content
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER

    def test_api__post_content_create_generic_content__ok_200__no_parent_id_param(self) -> None:  # nopep8
        """
        Create generic content without provided parent_id param
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': 'GenericCreatedContent',
            'content_type': 'html-document',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=200
        )
        assert res
        assert res.json_body
        assert res.json_body['status'] == 'open'
        assert res.json_body['content_id']
        assert res.json_body['content_type'] == 'html-document'
        assert res.json_body['is_archived'] is False
        assert res.json_body['is_deleted'] is False
        assert res.json_body['workspace_id'] == 1
        assert res.json_body['slug'] == 'genericcreatedcontent'
        assert res.json_body['parent_id'] is None
        assert res.json_body['show_in_ui'] is True
        assert res.json_body['sub_content_types']
        assert res.json_body['file_extension'] == '.document.html'
        assert res.json_body['filename'] == 'GenericCreatedContent.document.html'   # nopep8
        assert res.json_body['modified']
        assert res.json_body['created']
        params_active = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        # INFO - G.M - 2018-06-165 - Verify if new content is correctly created
        active_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_active, status=200).json_body  # nopep8
        content_ids = [content['content_id'] for content in active_contents]
        assert res.json_body['content_id'] in content_ids

    def test_api__post_content_create_generic_content__err_400__parent_id_0(self) -> None:  # nopep8
        """
        Create generic content but parent_id=0
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'parent_id': 0,
            'label': 'GenericCreatedContent',
            'content_type': content_type_list.Page.slug
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        # INFO - G.M - 2018-09-10 - handled by marshmallow schema
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8

    def test_api__post_content_create_generic_content__err_400__parent_not_found(self) -> None:  # nopep8
        """
        Create generic content but parent id is not valable
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'parent_id': 1000,
            'label': 'GenericCreatedContent',
            'content_type': content_type_list.Page.slug,
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.PARENT_NOT_FOUND  # nopep8

    def test_api__post_content_create_generic_content__ok_200__in_folder(self) -> None:  # nopep8
        """
        Create generic content in folder
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': 'GenericCreatedContent',
            'content_type': 'html-document',
            'parent_id': 10,
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=200
        )
        assert res
        assert res.json_body
        assert res.json_body['status'] == 'open'
        assert res.json_body['content_id']
        assert res.json_body['content_type'] == 'html-document'
        assert res.json_body['is_archived'] is False
        assert res.json_body['is_deleted'] is False
        assert res.json_body['workspace_id'] == 1
        assert res.json_body['slug'] == 'genericcreatedcontent'
        assert res.json_body['parent_id'] == 10
        assert res.json_body['show_in_ui'] is True
        assert res.json_body['sub_content_types']
        assert res.json_body['file_extension'] == '.document.html'
        assert res.json_body['filename'] == 'GenericCreatedContent.document.html'   # nopep8
        assert res.json_body['modified']
        assert res.json_body['created']
        params_active = {
            'parent_id': 10,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        # INFO - G.M - 2018-06-165 - Verify if new content is correctly created
        active_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_active, status=200).json_body  # nopep8
        content_ids = [content['content_id'] for content in active_contents]
        assert res.json_body['content_id'] in content_ids

    def test_api__post_content_create_generic_content__err_400__empty_label(self) -> None:  # nopep8
        """
        Create generic content but label provided is empty
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': '',
            'content_type': content_type_list.Page.slug,
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=400
        )
        # INFO - G.M - 2018-09-10 - handled by marshmallow schema
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8'

    def test_api__post_content_create_generic_content__err_400__wrong_content_type(self) -> None:  # nopep8
        """
        Create generic content but content type is uncorrect
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': 'GenericCreatedContent',
            'content_type': 'unexistent-content-type',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=400,
        )
        # INFO - G.M - 2018-09-10 - handled by marshmallow schema
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8

    def test_api__post_content_create_generic_content__err_400__unallowed_content_type(self) -> None:  # nopep8
        """
        Create generic content but content_type is not allowed in this folder
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test-folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=False,
            do_notify=False
        )
        content_api.set_allowed_content(folder, [content_type_list.Folder.slug])
        content_api.save(folder)
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # unallowed_content_type
        params = {
            'label': 'GenericCreatedContent',
            'content_type': content_type_list.Page.slug,
            'parent_id': folder.content_id
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/{workspace_id}/contents'.format(workspace_id=test_workspace.workspace_id),
            params=params,
            status=400,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.UNALLOWED_SUBCONTENT  # nopep8
        # allowed_content_type
        params = {
            'label': 'GenericCreatedContent',
            'content_type': 'folder',
            'parent_id': folder.content_id
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/{workspace_id}/contents'.format(workspace_id=test_workspace.workspace_id),
            params=params,
            status=200,
        )

    def test_api_put_move_content__ok_200__nominal_case(self):
        """
        Move content
        move Apple_Pie (content_id: 8)
        from Desserts folder(content_id: 3) to Salads subfolder (content_id: 4)
        of workspace Recipes.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'new_parent_id': '4',  # Salads
            'new_workspace_id': '2',
        }
        params_folder1 = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_folder2 = {
            'parent_id': 4,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        folder2_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder2, status=200).json_body  # nopep8
        assert [content for content in folder1_contents if content['content_id'] == 8]  # nopep8
        assert not [content for content in folder2_contents if content['content_id'] == 8]  # nopep8
        # TODO - G.M - 2018-06-163 - Check content
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/8/move',
            params=params,
            status=200
        )
        new_folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        new_folder2_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder2, status=200).json_body  # nopep8
        assert not [content for content in new_folder1_contents if content['content_id'] == 8]  # nopep8
        assert [content for content in new_folder2_contents if content['content_id'] == 8]  # nopep8
        assert res.json_body
        assert res.json_body['parent_id'] == 4
        assert res.json_body['content_id'] == 8
        assert res.json_body['workspace_id'] == 2

    def test_api_put_move_content__ok_200__to_root(self):
        """
        Move content
        move Apple_Pie (content_id: 8)
        from Desserts folder(content_id: 3) to root (content_id: 0)
        of workspace Recipes.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'new_parent_id': None,  # root
            'new_workspace_id': 2,
        }
        params_folder1 = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_folder2 = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        folder2_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder2, status=200).json_body  # nopep8
        assert [content for content in folder1_contents if content['content_id'] == 8]  # nopep8
        assert not [content for content in folder2_contents if content['content_id'] == 8]  # nopep8
        # TODO - G.M - 2018-06-163 - Check content
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/8/move',
            params=params,
            status=200
        )
        new_folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        new_folder2_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder2, status=200).json_body  # nopep8
        assert not [content for content in new_folder1_contents if content['content_id'] == 8]  # nopep8
        assert [content for content in new_folder2_contents if content['content_id'] == 8]  # nopep8
        assert res.json_body
        assert res.json_body['parent_id'] is None
        assert res.json_body['content_id'] == 8
        assert res.json_body['workspace_id'] == 2

    def test_api_put_move_content__ok_200__with_workspace_id(self):
        """
        Move content
        move Apple_Pie (content_id: 8)
        from Desserts folder(content_id: 3) to Salads subfolder (content_id: 4)
        of workspace Recipes.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'new_parent_id': '4',  # Salads
            'new_workspace_id': '2',
        }
        params_folder1 = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_folder2 = {
            'parent_id': 4,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        folder2_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder2, status=200).json_body  # nopep8
        assert [content for content in folder1_contents if content['content_id'] == 8]  # nopep8
        assert not [content for content in folder2_contents if content['content_id'] == 8]  # nopep8
        # TODO - G.M - 2018-06-163 - Check content
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/8/move',
            params=params,
            status=200
        )
        new_folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        new_folder2_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder2, status=200).json_body  # nopep8
        assert not [content for content in new_folder1_contents if content['content_id'] == 8]  # nopep8
        assert [content for content in new_folder2_contents if content['content_id'] == 8]  # nopep8
        assert res.json_body
        assert res.json_body['parent_id'] == 4
        assert res.json_body['content_id'] == 8
        assert res.json_body['workspace_id'] == 2

    def test_api_put_move_content__ok_200__to_another_workspace(self):
        """
        Move content
        move Apple_Pie (content_id: 8)
        from Desserts folder(content_id: 3) to Menus subfolder (content_id: 2)
        of workspace Business.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'new_parent_id': '2',  # Menus
            'new_workspace_id': '1',
        }
        params_folder1 = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_folder2 = {
            'parent_id': 2,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        folder2_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_folder2, status=200).json_body  # nopep8
        assert [content for content in folder1_contents if content['content_id'] == 8]  # nopep8
        assert not [content for content in folder2_contents if content['content_id'] == 8]  # nopep8
        # TODO - G.M - 2018-06-163 - Check content
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/8/move',
            params=params,
            status=200
        )
        new_folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        new_folder2_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_folder2, status=200).json_body  # nopep8
        assert not [content for content in new_folder1_contents if content['content_id'] == 8]  # nopep8
        assert [content for content in new_folder2_contents if content['content_id'] == 8]  # nopep8
        assert res.json_body
        assert res.json_body['parent_id'] == 2
        assert res.json_body['content_id'] == 8
        assert res.json_body['workspace_id'] == 1

    def test_api_put_move_content__ok_200__to_another_workspace_root(self):
        """
        Move content
        move Apple_Pie (content_id: 8)
        from Desserts folder(content_id: 3) to root (content_id: 0)
        of workspace Business.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'new_parent_id': None,  # root
            'new_workspace_id': '1',
        }
        params_folder1 = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_folder2 = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        folder2_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_folder2, status=200).json_body  # nopep8
        assert [content for content in folder1_contents if content['content_id'] == 8]  # nopep8
        assert not [content for content in folder2_contents if content['content_id'] == 8]  # nopep8
        # TODO - G.M - 2018-06-163 - Check content
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/8/move',
            params=params,
            status=200
        )
        new_folder1_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_folder1, status=200).json_body  # nopep8
        new_folder2_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_folder2, status=200).json_body  # nopep8
        assert not [content for content in new_folder1_contents if content['content_id'] == 8]  # nopep8
        assert [content for content in new_folder2_contents if content['content_id'] == 8]  # nopep8
        assert res.json_body
        assert res.json_body['parent_id'] is None
        assert res.json_body['content_id'] == 8
        assert res.json_body['workspace_id'] == 1

    def test_api_put_move_content__err_400__wrong_workspace_id(self):
        """
        Move content
        move Apple_Pie (content_id: 8)
        from Desserts folder(content_id: 3) to Salads subfolder (content_id: 4)
        of workspace Recipes.
        Workspace_id of parent_id don't match with workspace_id of workspace
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'new_parent_id': '4',  # Salads
            'new_workspace_id': '1',
        }
        params_folder1 = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_folder2 = {
            'parent_id': 4,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/8/move',
            params=params,
            status=400,
        )
        assert res.json_body['code'] == error.WORKSPACE_DO_NOT_MATCH

    def test_api_put_delete_content__ok_200__nominal_case(self):
        """
        delete content
        delete Apple_pie ( content_id: 8, parent_id: 3)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params_active = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_deleted = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 1,
            'show_active': 0,
        }
        active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        deleted_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_deleted, status=200).json_body  # nopep8
        assert [content for content in active_contents if content['content_id'] == 8]  # nopep8
        assert not [content for content in deleted_contents if content['content_id'] == 8]  # nopep8
        # TODO - G.M - 2018-06-163 - Check content
        res = self.testapp.put_json(
            # INFO - G.M - 2018-06-163 - delete Apple_Pie
            '/api/v2/workspaces/2/contents/8/trashed',
            status=204
        )
        new_active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        new_deleted_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_deleted, status=200).json_body  # nopep8
        assert not [content for content in new_active_contents if content['content_id'] == 8]  # nopep8
        assert [content for content in new_deleted_contents if content['content_id'] == 8]  # nopep8

    def test_api_put_archive_content__ok_200__nominal_case(self):
        """
        archive content
        archive Apple_pie ( content_id: 8, parent_id: 3)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params_active = {
            'parent_id': 3,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_archived = {
            'parent_id': 3,
            'show_archived': 1,
            'show_deleted': 0,
            'show_active': 0,
        }
        active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        archived_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_archived, status=200).json_body  # nopep8
        assert [content for content in active_contents if content['content_id'] == 8]  # nopep8
        assert not [content for content in archived_contents if content['content_id'] == 8]  # nopep8
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/8/archived',
            status=204
        )
        new_active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        new_archived_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_archived, status=200).json_body  # nopep8
        assert not [content for content in new_active_contents if content['content_id'] == 8]  # nopep8
        assert [content for content in new_archived_contents if content['content_id'] == 8]  # nopep8

    def test_api_put_undelete_content__ok_200__nominal_case(self):
        """
        Undelete content
        undelete Bad_Fruit_Salad ( content_id: 14, parent_id: 10)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        params_active = {
            'parent_id': 10,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_deleted = {
            'parent_id': 10,
            'show_archived': 0,
            'show_deleted': 1,
            'show_active': 0,
        }
        active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        deleted_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_deleted, status=200).json_body  # nopep8
        assert not [content for content in active_contents if content['content_id'] == 14]  # nopep8
        assert [content for content in deleted_contents if content['content_id'] == 14]  # nopep8
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/14/trashed/restore',
            status=204
        )
        new_active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        new_deleted_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_deleted, status=200).json_body  # nopep8
        assert [content for content in new_active_contents if content['content_id'] == 14]  # nopep8
        assert not [content for content in new_deleted_contents if content['content_id'] == 14]  # nopep8

    def test_api_put_unarchive_content__ok_200__nominal_case(self):
        """
        unarchive content,
        unarchive Fruit_salads ( content_id: 13, parent_id: 10)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'bob@fsf.local',
                'foobarbaz'
            )
        )
        params_active = {
            'parent_id': 10,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        params_archived = {
            'parent_id': 10,
            'show_archived': 1,
            'show_deleted': 0,
            'show_active': 0,
        }
        active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        archived_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_archived, status=200).json_body  # nopep8
        assert not [content for content in active_contents if content['content_id'] == 13]  # nopep8
        assert [content for content in archived_contents if content['content_id'] == 13]  # nopep8
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/13/archived/restore',
            status=204
        )
        new_active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        new_archived_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_archived, status=200).json_body  # nopep8
        assert [content for content in new_active_contents if content['content_id'] == 13]  # nopep8
        assert not [content for content in new_archived_contents if content['content_id'] == 13]  # nopep8
