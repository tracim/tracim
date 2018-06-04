# -*- coding: utf-8 -*-
"""
Tests for /api/v2/workspaces subpath endpoints.
"""
from tracim.tests import FunctionalTest
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
        assert workspace['id'] == 1
        assert workspace['slug'] == 'business'
        assert workspace['label'] == 'Business'
        assert workspace['description'] == 'All importants documents'
        assert len(workspace['sidebar_entries']) == 7

        sidebar_entry = workspace['sidebar_entries'][0]
        assert sidebar_entry['slug'] == 'dashboard'
        assert sidebar_entry['label'] == 'Dashboard'
        assert sidebar_entry['route'] == '/#/workspaces/1/dashboard'  # nopep8
        assert sidebar_entry['hexcolor'] == "#252525"
        assert sidebar_entry['icon'] == ""

        sidebar_entry = workspace['sidebar_entries'][1]
        assert sidebar_entry['slug'] == 'contents/all'
        assert sidebar_entry['label'] == 'All Contents'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents"  # nopep8
        assert sidebar_entry['hexcolor'] == "#fdfdfd"
        assert sidebar_entry['icon'] == ""

        sidebar_entry = workspace['sidebar_entries'][2]
        assert sidebar_entry['slug'] == 'contents/pagehtml'
        assert sidebar_entry['label'] == 'Text Documents'
        assert sidebar_entry['route'] == '/#/workspaces/1/contents?type=pagehtml'  # nopep8
        assert sidebar_entry['hexcolor'] == "#3f52e3"
        assert sidebar_entry['icon'] == "file-text-o"

        sidebar_entry = workspace['sidebar_entries'][3]
        assert sidebar_entry['slug'] == 'contents/pagemarkdownplus'
        assert sidebar_entry['label'] == 'Rich Markdown Files'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=pagemarkdownplus"    # nopep8
        assert sidebar_entry['hexcolor'] == "#f12d2d"
        assert sidebar_entry['icon'] == "file-code"

        sidebar_entry = workspace['sidebar_entries'][4]
        assert sidebar_entry['slug'] == 'contents/files'
        assert sidebar_entry['label'] == 'Files'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=file"  # nopep8
        assert sidebar_entry['hexcolor'] == "#FF9900"
        assert sidebar_entry['icon'] == "paperclip"

        sidebar_entry = workspace['sidebar_entries'][5]
        assert sidebar_entry['slug'] == 'contents/threads'
        assert sidebar_entry['label'] == 'Threads'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=thread"  # nopep8
        assert sidebar_entry['hexcolor'] == "#ad4cf9"
        assert sidebar_entry['icon'] == "comments-o"

        sidebar_entry = workspace['sidebar_entries'][6]
        assert sidebar_entry['slug'] == 'calendar'
        assert sidebar_entry['label'] == 'Calendar'
        assert sidebar_entry['route'] == "/#/workspaces/1/calendar"  # nopep8
        assert sidebar_entry['hexcolor'] == "#757575"
        assert sidebar_entry['icon'] == "calendar-alt"

    def test_api__get_workspace__err_403__unallowed_user(self) -> None:
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
        res = self.testapp.get('/api/v2/workspaces/1', status=403)
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

    def test_api__get_workspace__err_403__workspace_does_not_exist(self) -> None:  # nopep8
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
        res = self.testapp.get('/api/v2/workspaces/5', status=403)
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
        assert user_role['role_slug'] == 'workspace_manager'
        assert user_role['user_id'] == 1
        assert user_role['workspace_id'] == 1
        assert user_role['user']['display_name'] == 'Global manager'
        # TODO - G.M - 24-05-2018 - [Avatar] Replace
        # by correct value when avatar feature will be enabled
        assert user_role['user']['avatar_url'] is None

    def test_api__get_workspace_members__err_403__unallowed_user(self):
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
        res = self.testapp.get('/api/v2/workspaces/3/members', status=403)
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

    def test_api__get_workspace_members__err_403__workspace_does_not_exist(self):  # nopep8
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
        res = self.testapp.get('/api/v2/workspaces/5/members', status=403)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()


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
        assert content['id'] == 1
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Tools'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'tools'
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1
        content = res[1]
        assert content['id'] == 2
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Menus'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'menus'
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1
        content = res[2]
        assert content['id'] == 11
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Current Menu'
        assert content['parent_id'] == 2
        assert content['show_in_ui'] is True
        assert content['slug'] == 'current-menu'
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 1

    # Root related

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
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

        content = res[2]
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 16
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 3

        content = res[3]
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 17
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
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
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 15
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
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
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 16
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
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
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 17
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
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

    def test_api__get_workspace_content__ok_200__get_all_folder_content(self):
        """
         Check obtain workspace folder all contents
         """
        params = {
            'parent_id': 10,  # TODO - G.M - 30-05-2018 - Find a real id
            'show_archived': 1,
            'show_deleted': 1,
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
        assert len(res) == 3
        content = res[0]
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 12
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 2

        content = res[1]
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 13
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
        assert content['workspace_id'] == 2

        content = res[2]
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 14
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
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
        assert content['content_type_slug']
        assert content['id'] == 12
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'New Fruit Salad'
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'] == 'new-fruit-salad'
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
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
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 13
        assert content['is_archived'] is True
        assert content['is_deleted'] is False
        assert content['label'].startswith('Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('fruit-salad')
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
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
        assert content['content_type_slug'] == 'page'
        assert content['id'] == 14
        assert content['is_archived'] is False
        assert content['is_deleted'] is True
        assert content['label'].startswith('Bad Fruit Salad')
        assert content['parent_id'] == 10
        assert content['show_in_ui'] is True
        assert content['slug'].startswith('bad-fruit-salad')
        assert content['status_slug'] == 'open'
        assert set(content['sub_content_type_slug']) == {'thread', 'page', 'folder', 'file'}  # nopep8
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

    def test_api__get_workspace_content__err_403__unallowed_user(self):
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
        res = self.testapp.get('/api/v2/workspaces/3/contents', status=403)
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

    def test_api__get_workspace_content__err_403__workspace_does_not_exist(self):  # nopep8
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
        res = self.testapp.get('/api/v2/workspaces/5/contents', status=403)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()
