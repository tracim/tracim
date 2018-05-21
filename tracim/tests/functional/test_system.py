# coding=utf-8
from tracim.tests import FunctionalTest


class TestApplicationsEndpoint(FunctionalTest):
    def test_api__get_applications__ok_200__nominal_case(self):
        # TODO need authorization ? check permissions ?
        # self.testapp.authorization = (
        #     'Basic',
        #     (
        #         'admin@admin.admin',
        #         'admin@admin.admin'
        #     )
        # )
        res = self.testapp.get('/api/v2/system/applications', status=200)
        res = res.json_body
        application = res[0]
        assert application['label'] == "Text Documents"
        assert application['slug'] == 'contents/pagehtml'
        assert application['icon'] == 'file-text-o'
        assert application['hexcolor'] == '#3f52e3'
        assert application['is_active'] is True
        assert 'config' in application
        application = res[1]
        assert application['label'] == "Rich Markdown Files"
        assert application['slug'] == 'contents/pagemarkdownplus'
        assert application['icon'] == 'file-code'
        assert application['hexcolor'] == '#f12d2d'
        assert application['is_active'] is True
        assert 'config' in application
        application = res[2]
        assert application['label'] == "Files"
        assert application['slug'] == 'contents/files'
        assert application['icon'] == 'paperclip'
        assert application['hexcolor'] == '#FF9900'
        assert application['is_active'] is True
        assert 'config' in application
        application = res[3]
        assert application['label'] == "Threads"
        assert application['slug'] == 'contents/threads'
        assert application['icon'] == 'comments-o'
        assert application['hexcolor'] == '#ad4cf9'
        assert application['is_active'] is True
        assert 'config' in application
        application = res[4]
        assert application['label'] == "Calendar"
        assert application['slug'] == 'calendar'
        assert application['icon'] == 'calendar-alt'
        assert application['hexcolor'] == '#757575'
        assert application['is_active'] is True
        assert 'config' in application
