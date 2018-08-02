# coding=utf-8
from tracim_backend.tests import FunctionalTest
from tracim_backend.models.applications import applications

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
        assert len(res) == len(applications)
        for counter, application in enumerate(applications):
            assert res[counter]['label'] == application.label
            assert res[counter]['slug'] == application.slug
            assert res[counter]['fa_icon'] == application.fa_icon
            assert res[counter]['hexcolor'] == application.hexcolor
            assert res[counter]['is_active'] == application.is_active
            assert res[counter]['config'] == application.config

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

        content_type = res[1]
        assert content_type['slug'] == 'thread'
        assert content_type['fa_icon'] == 'comments-o'
        assert content_type['hexcolor'] == '#ad4cf9'
        assert content_type['label'] == 'Thread'
        assert content_type['creation_label'] == 'Discuss about a topic'
        assert 'available_statuses' in content_type
        assert len(content_type['available_statuses']) == 4

        content_type = res[2]
        assert content_type['slug'] == 'file'
        assert content_type['fa_icon'] == 'paperclip'
        assert content_type['hexcolor'] == '#FF9900'
        assert content_type['label'] == 'File'
        assert content_type['creation_label'] == 'Upload a file'
        assert 'available_statuses' in content_type
        assert len(content_type['available_statuses']) == 4

        content_type = res[3]
        assert content_type['slug'] == 'markdownpage'
        assert content_type['fa_icon'] == 'file-code-o'
        assert content_type['hexcolor'] == '#f12d2d'
        assert content_type['label'] == 'Rich Markdown File'
        assert content_type['creation_label'] == 'Create a Markdown document'
        assert 'available_statuses' in content_type
        assert len(content_type['available_statuses']) == 4

        content_type = res[4]
        assert content_type['slug'] == 'html-document'
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
