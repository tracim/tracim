# coding=utf-8

from tracim.tests import FunctionalTest


class TestWorkspaceEndpoint(FunctionalTest):

    def test_api__get_workspace__ok_200__nominal_case(self):
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        workspace = self.testapp.post_json('/api/v2/workspaces/1', status=200)
        assert workspace['id'] == 1
        assert workspace['slug'] == 'w1'
        assert workspace['label'] == 'w1'
        assert workspace['description'] == 'Just another description'
        assert len(workspace['sidebar_entries']) == 3  # TODO change this

        sidebar_entry = workspace['sidebar_entries'][0]
        assert sidebar_entry['slug'] == 'markdown-pages'
        assert sidebar_entry['label'] == 'Document Markdown'
        assert sidebar_entry['route'] == "/#/workspace/{workspace_id}/contents/?type=mardown-page"  # nopep8
        assert sidebar_entry['hexcolor'] == "#F0F9DC"
        assert sidebar_entry['icon'] == "file-text-o"
        # TODO To this for the other

    def test_api__get_workspace__err_403__unallowed_user(self):
        self.testapp.authorization = (
            'Basic',
            (
                'lawrence-not-real-email@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.post_json('/api/v2/workspaces/1', status=403)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace__err_401__unregistered_user(self):
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.post_json('/api/v2/workspaces/1', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace__err_404__workspace_does_not_exist(self):
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.post_json('/api/v2/workspaces/5', status=404)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()


class TestWorkspaceMembersEndpoint(FunctionalTest):

    def test_api__get_workspace_members__ok_200__nominal_case(self):
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.post_json('/api/v2/workspaces/1/members', status=200)
        assert len(res) == 2
        user_role = res[0]
        assert user_role['role'] == 'administrator'
        assert user_role['user_id'] == '1'
        assert user_role['workspace_id'] == '1'
        assert user_role['user']['label'] == 'Global manager'
        assert user_role['user']['avatar_url'] == ''  # TODO

        assert res['role'] == 1
        assert res['slug'] == 'w1'
        assert res['label'] == 'w1'
        assert res['description'] == 'Just another description'
        assert len(res['sidebar_entries']) == 3  # TODO change this

        sidebar_entry = res['sidebar_entries'][0]
        assert sidebar_entry['slug'] == 'markdown-pages'
        assert sidebar_entry['label'] == 'Document Markdown'
        assert sidebar_entry['route'] == "/#/workspace/{workspace_id}/contents/?type=mardown-page"  # nopep8
        assert sidebar_entry['hexcolor'] == "#F0F9DC"
        assert sidebar_entry['icon'] == "file-text-o"
        # TODO Do this for the other

    def test_api__get_workspace_members__err_400__unallowed_user(self):
        self.testapp.authorization = (
            'Basic',
            (
                'lawrence-not-real-email@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.post_json('/api/v2/workspaces/1/members', status=403)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace_members__err_401__unregistered_user(self):
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.post_json('/api/v2/workspaces/1/members', status=403)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_workspace_members__err_404__workspace_does_not_exist(self):
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.post_json('/api/v2/workspaces/5/members', status=404)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()
