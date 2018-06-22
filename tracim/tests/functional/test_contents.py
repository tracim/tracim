# -*- coding: utf-8 -*-
from tracim.tests import FunctionalTest
from tracim.fixtures.content import Content as ContentFixtures
from tracim.fixtures.users_and_groups import Base as BaseFixture


class TestHtmlDocuments(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/html-documents/{content_id}
    endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_html_document__err_400__wrong_content_type(self) -> None:
        """
        Get one html document of a content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/7',
            status=400
        )   # nopep8

    def test_api__get_html_document__ok_200__nominal_case(self) -> None:
        """
        Get one html document of a content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'page'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Tiramisu Recipe'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'tiramisu-recipe'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 7
        # TODO - G.M - 2018-06-173 - check date format
        assert content['created']
        assert content['author']
        assert content['author']['user_id'] == 1
        assert content['author']['avatar_url'] is None
        assert content['author']['public_name'] == 'Global manager'
        # TODO - G.M - 2018-06-173 - check date format
        assert content['modified']
        assert content['last_modifier'] == content['author']
        assert content['raw_content'] == '<p>To cook a great Tiramisu, you need many ingredients.</p>'  # nopep8

    def test_api__update_html_document__ok_200__nominal_case(self) -> None:
        """
        Update(put) one html document of a content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label' : 'My New label',
            'raw_content': '<p> Le nouveau contenu </p>',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/html-documents/6',
            params=params,
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'page'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'My New label'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 26
        # TODO - G.M - 2018-06-173 - check date format
        assert content['created']
        assert content['author']
        assert content['author']['user_id'] == 1
        assert content['author']['avatar_url'] is None
        assert content['author']['public_name'] == 'Global manager'
        # TODO - G.M - 2018-06-173 - check date format
        assert content['modified']
        assert content['last_modifier'] == content['author']
        assert content['raw_content'] == '<p> Le nouveau contenu </p>'

        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'page'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'My New label'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 26
        # TODO - G.M - 2018-06-173 - check date format
        assert content['created']
        assert content['author']
        assert content['author']['user_id'] == 1
        assert content['author']['avatar_url'] is None
        assert content['author']['public_name'] == 'Global manager'
        # TODO - G.M - 2018-06-173 - check date format
        assert content['modified']
        assert content['last_modifier'] == content['author']
        assert content['raw_content'] == '<p> Le nouveau contenu </p>'

    def test_api__get_html_document_revisions__ok_200__nominal_case(self) -> None:
        """
        Get one html document of a content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6/revisions',
            status=200
        )
        revisions = res.json_body
        assert len(revisions) == 2
        revision = revisions[0]
        assert revision['content_type'] == 'page'
        assert revision['content_id'] == 6
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['label'] == 'Tiramisu Recipe'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'tiramisu-recipe'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 6
        assert revision['sub_content_types']
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision['comments_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 1
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Global manager'

    def test_api__set_html_document_status__ok_200__nominal_case(self) -> None:
        """
        Get one html document of a content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'status': 'closed-deprecated',
        }

        # before
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'page'
        assert content['content_id'] == 6
        assert content['status'] == 'open'

        # set status
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/html-documents/6/status',
            params=params,
            status=204
        )

        # after
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'page'
        assert content['content_id'] == 6
        assert content['status'] == 'closed-deprecated'