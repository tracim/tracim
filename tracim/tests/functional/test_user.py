# coding=utf-8
from tracim.tests import FunctionalTest


class TestUserWorkspaceEndpoint(FunctionalTest):
    def test_api__get_user_workspaces__ok_200__nominal_case(self):
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.post_json('/api/v2/users/1/workspaces', status=200)
        workspace = res[0]
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

    def test_api__get_user_workspaces__err_403__unallowed_user(self):
        self.testapp.authorization = (
            'Basic',
            (
                'lawrence-not-real-email@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.post_json('/api/v2/users/1/workspaces', status=403)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_user_workspaces__err_401__unregistered_user(self):
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.post_json('/api/v2/users/1/workspaces', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__get_user_workspaces__err_404__user_does_not_exist(self):
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.post_json('/api/v2/users/5/workspaces', status=404)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()
