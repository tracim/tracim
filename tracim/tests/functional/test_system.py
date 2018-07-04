# coding=utf-8
from tracim.tests import FunctionalTest

"""
Tests for /api/v2/system subpath endpoints.
"""

class TestApplicationEndpoint(FunctionalTest):
    """
    Tests for /api/v2/system/applications
    """

    def test_api__get_applications__ok_200__nominal_case(self):
        """
        Get applications list with a registered user.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/system/applications', status=200)
        res = res.json_body
        application = res[0]
        assert application['label'] == "Text Documents"
        assert application['slug'] == 'contents/html-documents'
        assert application['fa_icon'] == 'file-text-o'
        assert application['hexcolor'] == '#3f52e3'
        assert application['is_active'] is True
        assert 'config' in application
        application = res[1]
        assert application['label'] == "Markdown Plus Documents"
        assert application['slug'] == 'contents/markdownpluspage'
        assert application['fa_icon'] == 'file-code-o'
        assert application['hexcolor'] == '#f12d2d'
        assert application['is_active'] is True
        assert 'config' in application
        application = res[2]
        assert application['label'] == "Files"
        assert application['slug'] == 'contents/files'
        assert application['fa_icon'] == 'paperclip'
        assert application['hexcolor'] == '#FF9900'
        assert application['is_active'] is True
        assert 'config' in application
        application = res[3]
        assert application['label'] == "Threads"
        assert application['slug'] == 'contents/threads'
        assert application['fa_icon'] == 'comments-o'
        assert application['hexcolor'] == '#ad4cf9'
        assert application['is_active'] is True
        assert 'config' in application
        application = res[4]
        assert application['label'] == "Calendar"
        assert application['slug'] == 'calendar'
        assert application['fa_icon'] == 'calendar'
        assert application['hexcolor'] == '#757575'
        assert application['is_active'] is True
        assert 'config' in application

    def test_api__get_applications__err_401__unregistered_user(self):
        """
        Get applications list with an unregistered user (bad auth)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/system/applications', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()


class TestContentsTypesEndpoint(FunctionalTest):
    """
    Tests for /api/v2/system/content_types
    """

    def test_api__get_content_types__ok_200__nominal_case(self):
        """
        Get system content_types list with a registered user.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/system/content_types', status=200)
        res = res.json_body

        content_type = res[0]
        assert content_type['slug'] == 'thread'
        assert content_type['fa_icon'] == 'comments-o'
        assert content_type['hexcolor'] == '#ad4cf9'
        assert content_type['label'] == 'Thread'
        assert content_type['creation_label'] == 'Discuss about a topic'
        assert 'available_statuses' in content_type
        assert len(content_type['available_statuses']) == 4

        content_type = res[1]
        assert content_type['slug'] == 'file'
        assert content_type['fa_icon'] == 'paperclip'
        assert content_type['hexcolor'] == '#FF9900'
        assert content_type['label'] == 'File'
        assert content_type['creation_label'] == 'Upload a file'
        assert 'available_statuses' in content_type
        assert len(content_type['available_statuses']) == 4

        content_type = res[2]
        assert content_type['slug'] == 'markdownpage'
        assert content_type['fa_icon'] == 'file-code-o'
        assert content_type['hexcolor'] == '#f12d2d'
        assert content_type['label'] == 'Rich Markdown File'
        assert content_type['creation_label'] == 'Create a Markdown document'
        assert 'available_statuses' in content_type
        assert len(content_type['available_statuses']) == 4

        content_type = res[3]
        assert content_type['slug'] == 'html-documents'
        assert content_type['fa_icon'] == 'file-text-o'
        assert content_type['hexcolor'] == '#3f52e3'
        assert content_type['label'] == 'Text Document'
        assert content_type['creation_label'] == 'Write a document'
        assert 'available_statuses' in content_type
        assert len(content_type['available_statuses']) == 4
        # TODO - G.M - 31-05-2018 - Check Folder type
        # TODO - G.M - 29-05-2018 - Better check for available_statuses

    def test_api__get_content_types__err_401__unregistered_user(self):
        """
        Get system content_types list with an unregistered user (bad auth)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/system/content_types', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()
