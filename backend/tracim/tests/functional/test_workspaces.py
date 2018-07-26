# -*- coding: utf-8 -*-
"""
Tests for /api/v2/workspaces subpath endpoints.
"""

import transaction
from depot.io.utils import FileIntent

from tracim import models
from tracim.lib.core.content import ContentApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.models import get_tm_session
from tracim.models.data import ContentType
from tracim.tests import FunctionalTest
from tracim.tests import set_html_document_slug_to_legacy
from tracim.fixtures.content import Content as ContentFixtures
from tracim.fixtures.users_and_groups import Base as BaseFixture


class TestWorkspaceEndpoint(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id} endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_workspace__ok_200__nominal_case(self) -> None:
        """
        Check obtain workspace reachable for user.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/1', status=200)
        workspace = res.json_body
        assert workspace['workspace_id'] == 1
        assert workspace['slug'] == 'business'
        assert workspace['label'] == 'Business'
        assert workspace['description'] == 'All importants documents'
        assert len(workspace['sidebar_entries']) == 7

        sidebar_entry = workspace['sidebar_entries'][0]
        assert sidebar_entry['slug'] == 'dashboard'
        assert sidebar_entry['label'] == 'Dashboard'
        assert sidebar_entry['route'] == '/#/workspaces/1/dashboard'  # nopep8
        assert sidebar_entry['hexcolor'] == "#252525"
        assert sidebar_entry['fa_icon'] == "signal"

        sidebar_entry = workspace['sidebar_entries'][1]
        assert sidebar_entry['slug'] == 'contents/all'
        assert sidebar_entry['label'] == 'All Contents'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents"  # nopep8
        assert sidebar_entry['hexcolor'] == "#fdfdfd"
        assert sidebar_entry['fa_icon'] == "th"

        sidebar_entry = workspace['sidebar_entries'][2]
        assert sidebar_entry['slug'] == 'contents/html-documents'
        assert sidebar_entry['label'] == 'Text Documents'
        assert sidebar_entry['route'] == '/#/workspaces/1/contents?type=html-documents'  # nopep8
        assert sidebar_entry['hexcolor'] == "#3f52e3"
        assert sidebar_entry['fa_icon'] == "file-text-o"

        sidebar_entry = workspace['sidebar_entries'][3]
        assert sidebar_entry['slug'] == 'contents/markdownpluspage'
        assert sidebar_entry['label'] == 'Markdown Plus Documents'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=markdownpluspage"    # nopep8
        assert sidebar_entry['hexcolor'] == "#f12d2d"
        assert sidebar_entry['fa_icon'] == "file-code-o"

        sidebar_entry = workspace['sidebar_entries'][4]
        assert sidebar_entry['slug'] == 'contents/files'
        assert sidebar_entry['label'] == 'Files'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=file"  # nopep8
        assert sidebar_entry['hexcolor'] == "#FF9900"
        assert sidebar_entry['fa_icon'] == "paperclip"

        sidebar_entry = workspace['sidebar_entries'][5]
        assert sidebar_entry['slug'] == 'contents/threads'
        assert sidebar_entry['label'] == 'Threads'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=thread"  # nopep8
        assert sidebar_entry['hexcolor'] == "#ad4cf9"
        assert sidebar_entry['fa_icon'] == "comments-o"

        sidebar_entry = workspace['sidebar_entries'][6]
        assert sidebar_entry['slug'] == 'calendar'
        assert sidebar_entry['label'] == 'Calendar'
        assert sidebar_entry['route'] == "/#/workspaces/1/calendar"  # nopep8
        assert sidebar_entry['hexcolor'] == "#757575"
        assert sidebar_entry['fa_icon'] == "calendar"

    def test_api__update_workspace__ok_200__nominal_case(self) -> None:
        """
        Test update workspace
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
        assert len(workspace['sidebar_entries']) == 7

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
        assert len(workspace['sidebar_entries']) == 7

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
        assert len(workspace['sidebar_entries']) == 7

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
        # TODO - G.M - 24-05-2018 - [Avatar] Replace
        # by correct value when avatar feature will be enabled
        assert user_role['user']['avatar_url'] is None

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
            'user_email_or_public_name': None,
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
            'user_email_or_public_name': 'lawrence-not-real-email@fsf.local',
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
            'user_email_or_public_name': 'Lawrence L.',
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

    def test_api__create_workspace_member_role__err_400__nothing(self):
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
            'user_email_or_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=400,
            params=params,
        )

    def test_api__create_workspace_member_role__err_400__wrong_user_id(self):
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
            'user_email_or_public_name': None,
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=400,
            params=params,
        )

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
            'user_email_or_public_name': 'nothing@nothing.nothing',
            'role': 'content-manager',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/members',
            status=200,
            params=params,
        )
        user_role_found = res.json_body
        assert user_role_found['role'] == 'content-manager'
        assert user_role_found['user_id']
        user_id = user_role_found['user_id']
        assert user_role_found['workspace_id'] == 1
        assert user_role_found['newly_created'] is True
        assert user_role_found['email_sent'] is False

        res = self.testapp.get('/api/v2/workspaces/1/members',
                               status=200).json_body  # nopep8
        assert len(res) == 2
        user_role = res[0]
        assert user_role['role'] == 'workspace-manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1
        user_role = res[1]
        assert user_role_found['role'] == user_role['role']
        assert user_role_found['user_id'] == user_role['user_id']
        assert user_role_found['workspace_id'] == user_role['workspace_id']

    def test_api__update_workspace_member_role__ok_200__nominal_case(self):
        """
        Update worskpace member role
        """
        # before
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
        # update workspace role
        params = {
            'role': 'content-manager',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/1/members/1',
            status=200,
            params=params,
        )
        user_role = res.json_body
        assert user_role['role'] == 'content-manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1
        # after
        res = self.testapp.get('/api/v2/workspaces/1/members', status=200).json_body   # nopep8
        assert len(res) == 1
        user_role = res[0]
        assert user_role['role'] == 'content-manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1


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
        assert content['content_id'] == 1
        assert content['content_type'] == 'folder'
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Tools'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'tools'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
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
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1
        content = res[2]
        assert content['content_id'] == 11
        assert content['content_type'] == 'html-documents'
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Current Menu'
        assert content['parent_id'] == 2
        assert content['show_in_ui'] is True
        assert content['slug'] == 'current-menu'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1

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
            'content_type': 'html-documents',
        }
        res = self.testapp.get('/api/v2/workspaces/1/contents', status=200, params=params).json_body   # nopep8
        assert len(res) == 1
        content = res[0]
        assert content
        assert content['content_id'] == 11
        assert content['content_type'] == 'html-documents'
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Current Menu'
        assert content['parent_id'] == 2
        assert content['show_in_ui'] is True
        assert content['slug'] == 'current-menu'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1

    # Root related
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
        content = res[1]
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

        content = res[2]
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 16
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

        content = res[3]
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 17
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

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
        content = res[1]
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

        content = res[2]
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 16
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

        content = res[3]
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 17
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

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
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

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
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 16
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

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
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 17
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

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
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
        test_thread = content_api.create(
            content_type=ContentType.Thread,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test Thread',
            do_save=False,
            do_notify=False,
        )
        test_thread.description = 'Thread description'
        dbsession.add(test_thread)
        test_file = content_api.create(
            content_type=ContentType.File,
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
            content_type=ContentType.Page,
            workspace=business_workspace,
            label='test_page',
            do_save=False,
            do_notify=False,
        )
        test_page_legacy.type = ContentType.PageLegacy
        content_api.update_content(test_page_legacy, 'test_page', '<p>PAGE</p>')
        test_html_document = content_api.create(
            content_type=ContentType.Page,
            workspace=business_workspace,
            label='test_html_page',
            do_save=False,
            do_notify=False,
        )
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
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1

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
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
        test_thread = content_api.create(
            content_type=ContentType.Thread,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test Thread',
            do_save=False,
            do_notify=False,
        )
        test_thread.description = 'Thread description'
        dbsession.add(test_thread)
        test_file = content_api.create(
            content_type=ContentType.File,
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
            content_type=ContentType.Page,
            workspace=business_workspace,
            parent=tool_folder,
            label='test_page',
            do_save=False,
            do_notify=False,
        )
        test_page_legacy.type = ContentType.PageLegacy
        content_api.update_content(test_page_legacy, 'test_page', '<p>PAGE</p>')
        test_html_document = content_api.create(
            content_type=ContentType.Page,
            workspace=business_workspace,
            parent=tool_folder,
            label='test_html_page',
            do_save=False,
            do_notify=False,
        )
        content_api.update_content(test_html_document, 'test_html_page', '<p>HTML_DOCUMENT</p>')  # nopep8
        dbsession.flush()
        transaction.commit()
        # test-itself
        params = {
            'parent_id': 1,
            'show_archived': 1,
            'show_deleted': 1,
            'show_active': 1,
            'content_type': 'html-documents',
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
        assert content['content_type'] == 'html-documents'
        assert content['content_id']
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'test_page'
        assert content['parent_id'] == 1
        assert content['show_in_ui'] is True
        assert content['slug'] == 'test-page'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1
        content = res[1]
        assert content['content_type'] == 'html-documents'
        assert content['content_id']
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'test_html_page'
        assert content['parent_id'] == 1
        assert content['show_in_ui'] is True
        assert content['slug'] == 'test-html-page'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1
        assert res[0]['content_id'] != res[1]['content_id']

    def test_api__get_workspace_content__ok_200__get_all_folder_content(self):
        """
         Check obtain workspace folder all contents
         """
        params = {
            'parent_id': 10,  # TODO - G.M - 30-05-2018 - Find a real id
            'show_archived': 1,
            'show_deleted': 1,
            'show_active': 1,
            'content_type': 'any'
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
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 12
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 2

        content = res[1]
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 13
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 2

        content = res[2]
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 14
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 2

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
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 2

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
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 13
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 2

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
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 14
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status'] == 'open'
        assert set(content['sub_content_types']) == {'thread', 'html-documents', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 2

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
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__post_content_create_generic_content__ok_200__nominal_case(self) -> None:  # nopep8
        """
        Create generic content
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
            'content_type': 'markdownpage',
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
        assert res.json_body['content_type'] == 'markdownpage'
        assert res.json_body['is_archived'] is False
        assert res.json_body['is_deleted'] is False
        assert res.json_body['workspace_id'] == 1
        assert res.json_body['slug'] == 'genericcreatedcontent'
        assert res.json_body['parent_id'] is None
        assert res.json_body['show_in_ui'] is True
        assert res.json_body['sub_content_types']
        params_active = {
            'parent_id': 0,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        # INFO - G.M - 2018-06-165 - Verify if new content is correctly created
        active_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_active, status=200).json_body  # nopep8
        assert res.json_body in active_contents

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
            'content_type': 'markdownpage',
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
        assert res.json_body['content_type'] == 'markdownpage'
        assert res.json_body['is_archived'] is False
        assert res.json_body['is_deleted'] is False
        assert res.json_body['workspace_id'] == 1
        assert res.json_body['slug'] == 'genericcreatedcontent'
        assert res.json_body['parent_id'] == 10
        assert res.json_body['show_in_ui'] is True
        assert res.json_body['sub_content_types']
        params_active = {
            'parent_id': 10,
            'show_archived': 0,
            'show_deleted': 0,
            'show_active': 1,
        }
        # INFO - G.M - 2018-06-165 - Verify if new content is correctly created
        active_contents = self.testapp.get('/api/v2/workspaces/1/contents', params=params_active, status=200).json_body  # nopep8
        assert res.json_body in active_contents

    def test_api__post_content_create_generic_content__err_400__empty_label(self) -> None:  # nopep8
        """
        Create generic content
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
            'content_type': 'markdownpage',
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/1/contents',
            params=params,
            status=400
        )

    def test_api__post_content_create_generic_content__err_400__wrong_content_type(self) -> None:  # nopep8
        """
        Create generic content
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
            '/api/v2/workspaces/2/contents/8/delete',
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
            '/api/v2/workspaces/2/contents/8/archive',
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
            '/api/v2/workspaces/2/contents/14/undelete',
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
            '/api/v2/workspaces/2/contents/13/unarchive',
            status=204
        )
        new_active_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_active, status=200).json_body  # nopep8
        new_archived_contents = self.testapp.get('/api/v2/workspaces/2/contents', params=params_archived, status=200).json_body  # nopep8
        assert [content for content in new_active_contents if content['content_id'] == 13]  # nopep8
        assert not [content for content in new_archived_contents if content['content_id'] == 13]  # nopep8
