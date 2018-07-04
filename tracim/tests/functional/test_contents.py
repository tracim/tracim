# -*- coding: utf-8 -*-
from tracim.tests import FunctionalTest
from tracim.tests import set_html_document_slug_to_legacy
from tracim.fixtures.content import Content as ContentFixtures
from tracim.fixtures.users_and_groups import Base as BaseFixture


class TestHtmlDocuments(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/html-documents/{content_id}
    endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_html_document__ok_200__legacy_slug(self) -> None:
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
        set_html_document_slug_to_legacy(self.session_factory)
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6',
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Tiramisu Recipe'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'tiramisu-recipe'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 27
        # TODO - G.M - 2018-06-173 - check date format
        assert content['created']
        assert content['author']
        assert content['author']['user_id'] == 1
        assert content['author']['avatar_url'] is None
        assert content['author']['public_name'] == 'Global manager'
        # TODO - G.M - 2018-06-173 - check date format
        assert content['modified']
        assert content['last_modifier'] != content['author']
        assert content['last_modifier']['user_id'] == 3
        assert content['last_modifier']['public_name'] == 'Bob i.'
        assert content['last_modifier']['avatar_url'] is None
        assert content['raw_content'] == '<p>To cook a great Tiramisu, you need many ingredients.</p>'  # nopep8

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
        )
        content = res.json_body
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Tiramisu Recipe'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'tiramisu-recipe'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 27
        # TODO - G.M - 2018-06-173 - check date format
        assert content['created']
        assert content['author']
        assert content['author']['user_id'] == 1
        assert content['author']['avatar_url'] is None
        assert content['author']['public_name'] == 'Global manager'
        # TODO - G.M - 2018-06-173 - check date format
        assert content['modified']
        assert content['last_modifier'] != content['author']
        assert content['last_modifier']['user_id'] == 3
        assert content['last_modifier']['public_name'] == 'Bob i.'
        assert content['last_modifier']['avatar_url'] is None
        assert content['raw_content'] == '<p>To cook a great Tiramisu, you need many ingredients.</p>'  # nopep8

    def test_api__get_html_document__err_400__wrong_content_type(self) -> None:
        """
        Get one html document of a content content 7 is not html_document
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
        )

    def test_api__get_html_document__err_400__content_does_not_exist(self) -> None:  # nopep8
        """
        Get one html document of a content (content 170 does not exist in db
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/170',
            status=400
        )

    def test_api__get_html_document__err_400__content_not_in_workspace(self) -> None:  # nopep8
        """
        Get one html document of a content (content 6 is in workspace 2)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/html-documents/6',
            status=400
        )

    def test_api__get_html_document__err_400__workspace_does_not_exist(self) -> None:  # nopep8
        """
        Get one html document of a content (Workspace 40 does not exist)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/40/html-documents/6',
            status=400
        )

    def test_api__get_html_document__err_400__workspace_id_is_not_int(self) -> None:  # nopep8
        """
        Get one html document of a content, workspace id is not int
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/coucou/html-documents/6',
            status=400
        )

    def test_api__get_html_document__err_400__content_id_is_not_int(self) -> None:  # nopep8
        """
        Get one html document of a content, content_id is not int
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/coucou',
            status=400
        )

    def test_api__update_html_document__err_400__empty_label(self) -> None:  # nopep8
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
            'label': '',
            'raw_content': '<p> Le nouveau contenu </p>',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/html-documents/6',
            params=params,
            status=400
        )

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
            'label': 'My New label',
            'raw_content': '<p> Le nouveau contenu </p>',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/html-documents/6',
            params=params,
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'My New label'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 28
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
        )
        content = res.json_body
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'My New label'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 28
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

    def test_api__get_html_document_revisions__ok_200__nominal_case(
            self
    ) -> None:
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
        assert len(revisions) == 3
        revision = revisions[0]
        assert revision['content_type'] == 'html-documents'
        assert revision['content_id'] == 6
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['label'] == 'Tiramisu Recipes!!!'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'tiramisu-recipes'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 6
        assert revision['sub_content_types']
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 1
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Global manager'
        revision = revisions[1]
        assert revision['content_type'] == 'html-documents'
        assert revision['content_id'] == 6
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['label'] == 'Tiramisu Recipes!!!'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'tiramisu-recipes'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 7
        assert revision['sub_content_types']
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 1
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Global manager'
        revision = revisions[2]
        assert revision['content_type'] == 'html-documents'
        assert revision['content_id'] == 6
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['label'] == 'Tiramisu Recipe'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'tiramisu-recipe'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 27
        assert revision['sub_content_types']
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 3
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Bob i.'

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
        )
        content = res.json_body
        assert content['content_type'] == 'html-documents'
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
        )
        content = res.json_body
        assert content['content_type'] == 'html-documents'
        assert content['content_id'] == 6
        assert content['status'] == 'closed-deprecated'

    def test_api__set_html_document_status__err_400__wrong_status(self) -> None:
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
            'status': 'unexistant-status',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/html-documents/6/status',
            params=params,
            status=400
        )


class TestThreads(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/threads/{content_id}
    endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_thread__err_400__wrong_content_type(self) -> None:
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
            '/api/v2/workspaces/2/threads/6',
            status=400
        )

    def test_api__get_thread__ok_200__nominal_case(self) -> None:
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
            '/api/v2/workspaces/2/threads/7',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'thread'
        assert content['content_id'] == 7
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Best Cakes?'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'best-cakes'
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
        assert content['last_modifier'] != content['author']
        assert content['last_modifier']['user_id'] == 3
        assert content['last_modifier']['public_name'] == 'Bob i.'
        assert content['last_modifier']['avatar_url'] is None
        assert content['raw_content'] == 'What is the best cake?'  # nopep8

    def test_api__get_thread__err_400__content_does_not_exist(self) -> None:
        """
        Get one thread (content 170 does not exist)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/threads/170',
            status=400
        )

    def test_api__get_thread__err_400__content_not_in_workspace(self) -> None:
        """
        Get one thread(content 7 is in workspace 2)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/threads/7',
            status=400
        )

    def test_api__get_thread__err_400__workspace_does_not_exist(self) -> None:  # nopep8
        """
        Get one thread (Workspace 40 does not exist)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/40/threads/7',
            status=400
        )

    def test_api__get_thread__err_400__workspace_id_is_not_int(self) -> None:  # nopep8
        """
        Get one thread, workspace id is not int
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/coucou/threads/7',
            status=400
        )

    def test_api__get_thread__err_400_content_id_is_not_int(self) -> None:  # nopep8
        """
        Get one thread, content id is not int
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/threads/coucou',
            status=400
        )

    def test_api__update_thread__ok_200__nominal_case(self) -> None:
        """
        Update(put) thread
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': 'My New label',
            'raw_content': '<p> Le nouveau contenu </p>',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/threads/7',
            params=params,
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'thread'
        assert content['content_id'] == 7
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'My New label'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 28
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
            '/api/v2/workspaces/2/threads/7',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'thread'
        assert content['content_id'] == 7
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'My New label'
        assert content['parent_id'] == 3
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 2
        assert content['current_revision_id'] == 28
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

    def test_api__update_thread__err_400__empty_label(self) -> None:
        """
        Update(put) thread
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
            'raw_content': '<p> Le nouveau contenu </p>',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/threads/7',
            params=params,
            status=400
        )

    def test_api__get_thread_revisions__ok_200__nominal_case(
            self
    ) -> None:
        """
        Get threads revisions
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/threads/7/revisions',
            status=200
        )
        revisions = res.json_body
        assert len(revisions) == 2
        revision = revisions[0]
        assert revision['content_type'] == 'thread'
        assert revision['content_id'] == 7
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['label'] == 'Best Cake'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'best-cake'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 8
        assert revision['sub_content_types']
        assert revision['comment_ids'] == [18, 19, 20]
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 1
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Global manager'
        revision = revisions[1]
        assert revision['content_type'] == 'thread'
        assert revision['content_id'] == 7
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['label'] == 'Best Cakes?'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'best-cakes'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 26
        assert revision['sub_content_types']
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 3
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Bob i.'

    def test_api__set_thread_status__ok_200__nominal_case(self) -> None:
        """
        Set thread status
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
            '/api/v2/workspaces/2/threads/7',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'thread'
        assert content['content_id'] == 7
        assert content['status'] == 'open'

        # set status
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/threads/7/status',
            params=params,
            status=204
        )

        # after
        res = self.testapp.get(
            '/api/v2/workspaces/2/threads/7',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'thread'
        assert content['content_id'] == 7
        assert content['status'] == 'closed-deprecated'

    def test_api__set_thread_status__ok_400__wrong_status(self) -> None:
        """
        Set thread status
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'status': 'unexistant-status',
        }

        res = self.testapp.put_json(
            '/api/v2/workspaces/2/threads/7/status',
            params=params,
            status=400
        )
