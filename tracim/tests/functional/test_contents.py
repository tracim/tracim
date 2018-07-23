# -*- coding: utf-8 -*-
import io

import pytest
import transaction
from PIL import Image
from depot.io.utils import FileIntent

from tracim import models
from tracim.lib.core.content import ContentApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.models.data import ContentType
from tracim.models import get_tm_session
from tracim.models.revision_protection import new_revision
from tracim.tests import FunctionalTest, create_test_image
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


class TestFiles(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/files/{content_id}
    endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_file__ok_200__nominal_case(self) -> None:
        """
        Get one file of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
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
        content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'file'
        assert content['content_id'] == test_file.content_id
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'Test_file'
        assert content['parent_id'] == 1
        assert content['show_in_ui'] is True
        assert content['slug'] == 'test-file'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 1
        assert content['current_revision_id']
        # TODO - G.M - 2018-06-173 - check date format
        assert content['created']
        assert content['author']
        assert content['author']['user_id'] == 1
        assert content['author']['avatar_url'] is None
        assert content['author']['public_name'] == 'Global manager'
        # TODO - G.M - 2018-06-173 - check date format
        assert content['modified']
        assert content['last_modifier'] == content['author']
        assert content['raw_content'] == '<p>description</p>'  # nopep8

    def test_api__get_files__err_400__wrong_content_type(self) -> None:
        """
        Get one file of a content content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/files/6',
            status=400
        )

    def test_api__get_file__err_400__content_does_not_exist(self) -> None:  # nopep8
        """
        Get one file (content 170 does not exist in db
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/170',
            status=400
        )

    def test_api__get_file__err_400__content_not_in_workspace(self) -> None:  # nopep8
        """
        Get one file (content 9 is in workspace 2)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/9',
            status=400
        )

    def test_api__get_file__err_400__workspace_does_not_exist(self) -> None:  # nopep8
        """
        Get one file (Workspace 40 does not exist)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/40/files/9',
            status=400
        )

    def test_api__get_file__err_400__workspace_id_is_not_int(self) -> None:  # nopep8
        """
        Get one file, workspace id is not int
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/coucou/files/9',
            status=400
        )

    def test_api__get_file__err_400__content_id_is_not_int(self) -> None:  # nopep8
        """
        Get one file, content_id is not int
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/files/coucou',
            status=400
        )

    def test_api__update_file_info_err_400__empty_label(self) -> None:  # nopep8
        """
        Update(put) one file
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
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
        content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
        dbsession.flush()
        transaction.commit()

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
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            params=params,
            status=400
        )

    def test_api__update_file_info__ok_200__nominal_case(self) -> None:
        """
        Update(put) one file
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
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
        content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
        dbsession.flush()
        transaction.commit()

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
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            params=params,
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'file'
        assert content['content_id'] == test_file.content_id
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'My New label'
        assert content['parent_id'] == 1
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 1
        assert content['current_revision_id']
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
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'file'
        assert content['content_id'] == test_file.content_id
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['label'] == 'My New label'
        assert content['parent_id'] == 1
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == 1
        assert content['current_revision_id']
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

    def test_api__get_file_revisions__ok_200__nominal_case(
            self
    ) -> None:
        """
        Get file revisions
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
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
        content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/revisions'.format(test_file.content_id),
            status=200
        )
        revisions = res.json_body
        assert len(revisions) == 1
        revision = revisions[0]
        assert revision['content_type'] == 'file'
        assert revision['content_id'] == test_file.content_id
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['label'] == 'Test_file'
        assert revision['parent_id'] == 1
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'test-file'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 1
        assert revision['revision_id']
        assert revision['sub_content_types']
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 1
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Global manager'

    def test_api__set_file_status__ok_200__nominal_case(self) -> None:
        """
        set file status
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
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
        content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
        dbsession.flush()
        transaction.commit()

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
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'file'
        assert content['content_id'] == test_file.content_id
        assert content['status'] == 'open'

        # set status
        res = self.testapp.put_json(
            '/api/v2/workspaces/1/files/{}/status'.format(test_file.content_id),
            params=params,
            status=204
        )

        # after
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'file'
        assert content['content_id'] == test_file.content_id
        assert content['status'] == 'closed-deprecated'

    def test_api__set_file_status__err_400__wrong_status(self) -> None:
        """
        set file status
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
            '/api/v2/workspaces/2/files/6/status',
            params=params,
            status=400
        )

    def test_api__get_file_raw__ok_200__nominal_case(self) -> None:
        """
        Get one file of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
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
        content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/raw'.format(content_id),
            status=200
        )
        assert res.body == b'Test file'
        assert res.content_type == 'text/plain'
        assert res.content_length == len(b'Test file')

    def test_api__set_file_raw__ok_200__nominal_case(self) -> None:
        """
        Set one file of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
        test_file = content_api.create(
            content_type=ContentType.File,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw'.format(content_id),
            upload_files=[
                ('files',image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/raw'.format(content_id),
            status=200
        )
        assert res.body == image.getvalue()
        assert res.content_type == 'image/png'
        assert res.content_length == len(image.getvalue())

    def test_api__get_jpeg_preview__ok__200__nominal_case(self) -> None:
        """
        Set one file of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
        test_file = content_api.create(
            content_type=ContentType.File,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw'.format(content_id),
            upload_files=[
                ('files',image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg'.format(content_id),
            status=200
        )
        assert res.body != image.getvalue()
        assert res.content_type == 'image/jpeg'

    def test_api__get_sized_jpeg_preview__ok__200__nominal_case(self) -> None:
        """
        Set one file of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
        test_file = content_api.create(
            content_type=ContentType.File,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw'.format(content_id),
            upload_files=[
                ('files',image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/256x256'.format(content_id), # nopep8
            status=200
        )
        assert res.body != image.getvalue()
        assert res.content_type == 'image/jpeg'
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_full_pdf_preview__ok__200__nominal_case(self) -> None:
        """
        Set one file of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
        test_file = content_api.create(
            content_type=ContentType.File,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        with new_revision(
                session=dbsession,
                tm=transaction.manager,
                content=test_file,
        ):
            test_file.file_extension = '.txt'
            test_file.depot_file = FileIntent(
                b'Test file',
                'Test_file.txt',
                'text/plain',
            )
            content_api.update_content(test_file, 'Test_file', '<p>description</p>')
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw'.format(content_id),
            upload_files=[
                ('files', test_file.file_name, test_file.depot_file.file.read())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/full'.format(content_id), # nopep8
            status=200
        )
        assert res.content_type == 'application/pdf'

    def test_api__get_full_pdf_preview__err__400__png_UnavailablePreviewType(self) -> None:
        """
        Set one file of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=ContentType.Any)
        test_file = content_api.create(
            content_type=ContentType.File,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw'.format(content_id),
            upload_files=[
                ('files',image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/full'.format(content_id), # nopep8
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
