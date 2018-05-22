# coding=utf-8
from tracim.tests import FunctionalTest
from tracim.fixtures.content import Content as ContentFixtures
from tracim.fixtures.users_and_groups import Base as BaseFixture


class TestUserWorkspaceEndpoint(FunctionalTest):

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_user_workspaces__ok_200__nominal_case(self):
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces', status=200)
        res = res.json_body
        workspace = res[0]
        assert workspace['id'] == 1
        assert workspace['label'] == 'w1'
        assert len(workspace['sidebar_entries']) == 7  # TODO change this

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

    def test_api__get_user_workspaces__err_403__unallowed_user(self):
        self.testapp.authorization = (
            'Basic',
            (
                'lawrence-not-real-email@fsf.local',
                'foobarbaz'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces', status=403)
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
        res = self.testapp.get('/api/v2/users/1/workspaces', status=401)
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
        res = self.testapp.get('/api/v2/users/5/workspaces', status=404)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()
