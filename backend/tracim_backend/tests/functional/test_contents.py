# -*- coding: utf-8 -*-
from urllib.parse import quote

import transaction

from tracim_backend import models
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models import get_tm_session
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.models.revision_protection import new_revision
import io

import pytest
import transaction
from depot.io.utils import FileIntent
from PIL import Image

from tracim_backend import error
from tracim_backend import models
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.fixtures.content import Content as ContentFixtures
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models import get_tm_session
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests import FunctionalTest
from tracim_backend.tests import create_1000px_png_test_image
from tracim_backend.tests import set_html_document_slug_to_legacy


class TestFolder(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/folders/{content_id}
    endpoint
    """

    fixtures = [BaseFixture]

    def test_api__get_folder__ok_200__nominal_case(self) -> None:
        """
        Get one folder content
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test-folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'folder'
        assert content['content_id'] == folder.content_id
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
        assert content['label'] == 'test-folder'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'test-folder'
        assert content['status'] == 'open'
        assert content['workspace_id'] == test_workspace.workspace_id
        assert content['current_revision_id'] == folder.revision_id
        # TODO - G.M - 2018-06-173 - check date format
        assert content['created']
        assert content['author']
        assert content['author']['user_id'] == 1
        assert content['author']['avatar_url'] is None
        assert content['author']['public_name'] == 'Global manager'
        # TODO - G.M - 2018-06-173 - check date format
        assert content['modified']
        assert content['last_modifier']['user_id'] == 1
        assert content['last_modifier']['public_name'] == 'Global manager'
        assert content['last_modifier']['avatar_url'] is None
        assert content['raw_content'] == ''

    def test_api__get_folder__err_400__wrong_content_type(self) -> None:
        """
        Get one folder of a content content 7 is not folder
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        thread = content_api.create(
            label='thread',
            content_type_slug=content_type_list.Thread.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        transaction.commit()
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace.workspace_id,
                content_id=thread.content_id
            ),
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_TYPE_NOT_ALLOWED

    def test_api__get_folder__err_400__content_does_not_exist(self) -> None:  # nopep8
        """
        Get one folder content (content 170 does not exist in db)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        transaction.commit()
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/folders/170'.format(workspace_id=test_workspace.workspace_id),  # nopep8
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_NOT_FOUND

    def test_api__get_folder__err_400__content_not_in_workspace(self) -> None:  # nopep8
        """
        Get one folders of a content (content is in another workspace)
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        test_workspace2 = workspace_api.create_workspace(
            label='test2',
            save_now=True,
        )
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace2.workspace_id,
                content_id=folder.content_id,
            ),
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_NOT_FOUND

    def test_api__get_folder__err_400__workspace_does_not_exist(self) -> None:  # nopep8
        """
        Get one folder content (Workspace 40 does not exist)
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/40/folders/{content_id}'.format(content_id=folder.content_id),  # nopep8
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND

    def test_api__get_folder__err_400__workspace_id_is_not_int(self) -> None:  # nopep8
        """
        Get one folder content, workspace id is not int
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/coucou/folders/{content_id}'.format(content_id=folder.content_id),  # nopep8
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.WORKSPACE_INVALID_ID

    def test_api__get_folder__err_400__content_id_is_not_int(self) -> None:  # nopep8
        """
        Get one folder content, content_id is not int
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/folders/coucou'.format(workspace_id=test_workspace.workspace_id),  # nopep8
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_INVALID_ID

    def test_api__update_folder__err_400__empty_label(self) -> None:  # nopep8
        """
        Update(put) one folder content
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
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
            'sub_content_types': [content_type_list.Folder.slug]
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            params=params,
            status=400
        )
        # INFO - G.M - 2018-09-10 - Handled by marshmallow schema
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8

    def test_api__update_folder__ok_200__nominal_case(self) -> None:
        """
        Update(put) one html document of a content
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
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
            'sub_content_types': [content_type_list.Folder.slug]
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            params=params,
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'folder'
        assert content['content_id'] == folder.content_id
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
        assert content['label'] == 'My New label'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == test_workspace.workspace_id
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
        assert content['sub_content_types'] == [content_type_list.Folder.slug]

    def test_api__update_folder__err_400__not_modified(self) -> None:
        """
        Update(put) one html document of a content
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
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
            'sub_content_types': [content_type_list.Folder.slug]
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            params=params,
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'folder'
        assert content['content_id'] == folder.content_id
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
        assert content['label'] == 'My New label'
        assert content['parent_id'] is None
        assert content['show_in_ui'] is True
        assert content['slug'] == 'my-new-label'
        assert content['status'] == 'open'
        assert content['workspace_id'] == test_workspace.workspace_id
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
        assert content['sub_content_types'] == [content_type_list.Folder.slug]

        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            params=params,
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.SAME_VALUE_ERROR

    def test_api__update_folder__err_400__label_already_used(self) -> None:
        """
        Update(put) one html document of a content
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        content_api.create(
            label='already_used',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'label': 'already_used',
            'raw_content': '<p> Le nouveau contenu </p>',
            'sub_content_types': [content_type_list.Folder.slug]
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            params=params,
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER  # nopep8

    def test_api__get_folder_revisions__ok_200__nominal_case(
            self
    ) -> None:
        """
        Get one html document of a content
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test-folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        with new_revision(
           session=dbsession,
           tm=transaction.manager,
           content=folder,
        ):
            content_api.update_content(
                folder,
                new_label='test-folder-updated',
                new_content='Just a test'
            )
        content_api.save(folder)
        with new_revision(
           session=dbsession,
           tm=transaction.manager,
           content=folder,
        ):
            content_api.archive(
                folder,
            )
        content_api.save(folder)
        with new_revision(
           session=dbsession,
           tm=transaction.manager,
           content=folder,
        ):
            content_api.unarchive(
                folder,
            )
        content_api.save(folder)
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}/revisions'.format(  # nopep8
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            status=200
        )
        revisions = res.json_body
        assert len(revisions) == 4
        revision = revisions[0]
        assert revision['content_type'] == 'folder'
        assert revision['content_id'] == folder.content_id
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is False
        assert revision['label'] == 'test-folder'
        assert revision['parent_id'] is None
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'test-folder'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == test_workspace.workspace_id
        assert revision['revision_id']
        assert revision['revision_type'] == 'creation'
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
        assert revision['content_type'] == 'folder'
        assert revision['content_id'] == folder.content_id
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is False
        assert revision['label'] == 'test-folder-updated'
        assert revision['parent_id'] is None
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'test-folder-updated'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == test_workspace.workspace_id
        assert revision['revision_id']
        assert revision['revision_type'] == 'edition'
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
        assert revision['content_type'] == 'folder'
        assert revision['content_id'] == folder.content_id
        assert revision['is_archived'] is True
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is False
        assert revision['label'] != 'test-folder-updated'
        assert revision['label'].startswith('test-folder-updated')
        assert revision['parent_id'] is None
        assert revision['show_in_ui'] is True
        assert revision['slug'] != 'test-folder-updated'
        assert revision['slug'].startswith('test-folder-updated')
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == test_workspace.workspace_id
        assert revision['revision_id']
        assert revision['revision_type'] == 'archiving'
        assert revision['sub_content_types']
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 1
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Global manager'

        revision = revisions[3]
        assert revision['content_type'] == 'folder'
        assert revision['content_id'] == folder.content_id
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is True
        assert revision['label'].startswith('test-folder-updated')
        assert revision['parent_id'] is None
        assert revision['show_in_ui'] is True
        assert revision['slug'].startswith('test-folder-updated')
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == test_workspace.workspace_id
        assert revision['revision_id']
        assert revision['revision_type'] == 'unarchiving'
        assert revision['sub_content_types']
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 1
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Global manager'

    def test_api__set_folder_status__ok_200__nominal_case(self) -> None:
        """
        Get one folder content
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
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
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(  # nopep8
                # nopep8
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'folder'
        assert content['content_id'] == folder.content_id
        assert content['status'] == 'open'

        # set status
        self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}/status'.format(  # nopep8
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            params=params,
            status=204
        )

        # after
        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}'.format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'folder'
        assert content['content_id'] == folder.content_id
        assert content['status'] == 'closed-deprecated'

    def test_api__set_folder_status__err_400__wrong_status(self) -> None:
        """
        Get one folder content
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
        test_workspace = workspace_api.create_workspace(
            label='test',
            save_now=True,
        )
        folder = content_api.create(
            label='test_folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False
        )
        transaction.commit()
        res = self.testapp.put_json(
            '/api/v2/workspaces/{workspace_id}/folders/{content_id}/status'.format(  # nopep8
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
            ),
            params=params,
            status=400
        )
        # TODO - G.M - 2018-09-10 - handle by marshmallow schema
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8


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
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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
        assert content['file_extension'] == '.document.html'

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
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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
        assert content['file_extension'] == '.document.html'

    def test_api__get_html_document__ok_200__archived_content(self) -> None:
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
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/6/archived',
            status=204
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6',
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['is_archived'] is True

    def test_api__get_html_document__ok_200__deleted_content(self) -> None:
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
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/contents/6/trashed',
            status=204
        )
        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6',
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['is_deleted'] is True

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_TYPE_NOT_ALLOWED

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.WORKSPACE_INVALID_ID

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_INVALID_ID

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
        # INFO - G.M - 2018-09-10 -  Handled by marshmallow schema
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8

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
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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
        assert content['file_extension'] == '.document.html'

        res = self.testapp.get(
            '/api/v2/workspaces/2/html-documents/6',
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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
        assert content['file_extension'] == '.document.html'

    def test_api__update_html_document__err_400__not_editable(self) -> None:
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
            'status': 'closed-deprecated',
        }
        self.testapp.put_json(
            '/api/v2/workspaces/2/html-documents/6/status',
            params=params,
            status=204
        )

        params = {
            'label': 'My New label',
            'raw_content': '<p> Le nouveau contenu ! </p>',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/2/html-documents/6',
            params=params,
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__update_html_document__err_400__not_modified(self) -> None:
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
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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

        res = self.testapp.put_json(
            '/api/v2/workspaces/2/html-documents/6',
            params=params,
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.SAME_VALUE_ERROR

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
        assert revision['content_type'] == 'html-document'
        assert revision['content_id'] == 6
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is False
        assert revision['label'] == 'Tiramisu Recipes!!!'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'tiramisu-recipes'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 6
        assert revision['revision_type'] == 'creation'
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
        assert revision['content_type'] == 'html-document'
        assert revision['content_id'] == 6
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is False
        assert revision['label'] == 'Tiramisu Recipes!!!'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'tiramisu-recipes'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 7
        assert revision['revision_type'] == 'edition'
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
        assert revision['content_type'] == 'html-document'
        assert revision['content_id'] == 6
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is True
        assert revision['label'] == 'Tiramisu Recipe'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'tiramisu-recipe'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 27
        assert revision['revision_type'] == 'edition'
        assert revision['sub_content_types']
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 3
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Bob i.'
        assert revision['file_extension'] == '.document.html'

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
        assert content['content_type'] == 'html-document'
        assert content['content_id'] == 6
        assert content['status'] == 'open'

        # set status
        self.testapp.put_json(
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
        assert content['content_type'] == 'html-document'
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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8


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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.txt',
                new_mimetype='plain/text',
                new_content=b'Test file',
            )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
        assert content['is_editable'] is True
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
        assert content['mimetype'] == 'plain/text'
        assert content['size'] == len(b'Test file')
        assert content['file_extension'] == '.txt'
        assert content['filename'] == 'Test_file.txt'
        assert content['page_nb'] == 1
        assert content['has_pdf_preview'] is True
        assert content['has_jpeg_preview'] is True

    def test_api__get_file__ok_200__no_file_add(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
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
        assert content['is_editable'] is True
        assert content['label'] == 'Test file'
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
        assert content['raw_content'] == ''
        assert content['mimetype'] == ''
        assert content['file_extension'] == ''
        assert content['filename'] == 'Test file'
        assert content['size'] is None
        assert content['page_nb'] is None
        assert content['has_pdf_preview'] is False
        assert content['has_jpeg_preview'] is False

    def test_api__get_file__ok_200__binary_file(self) -> None:
        """
        Get one file of a content
        """
        dbsession = get_tm_session(self.session_factory,
                                   transaction.manager)
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
        tool_folder = content_api.get_one(1,
                                          content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.bin',
                new_mimetype='application/octet-stream',
                new_content=bytes(100),
            )
        content_api.save(test_file)
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
        assert content['is_editable'] is True
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
        assert content['raw_content'] == ''
        assert content['mimetype'] == 'application/octet-stream'
        assert content['size'] == 100
        assert content['file_extension'] == '.bin'
        assert content['filename'] == 'Test_file.bin'
        assert content['page_nb'] is None
        assert content['has_pdf_preview'] is False
        assert content['has_jpeg_preview'] is False

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_TYPE_NOT_ALLOWED

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.WORKSPACE_INVALID_ID

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_INVALID_ID

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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.txt',
                new_mimetype='plain/text',
                new_content=b'Test file',
            )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
        # INFO - G.M - 2018-09-10 - Handle by marshmallow schema
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8

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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        with dbsession.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label='Test file',
                do_save=False,
                do_notify=False,
            )
            content_api.update_file_data(
                test_file,
                'Test_file.txt',
                new_mimetype='plain/text',
                new_content=b'Test file',
            )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
        assert content['is_editable'] is True
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
        assert content['mimetype'] == 'plain/text'
        assert content['size'] == len(b'Test file')
        assert content['page_nb'] == 1
        assert content['has_pdf_preview'] is True
        assert content['has_jpeg_preview'] is True

        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'file'
        assert content['content_id'] == test_file.content_id
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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
        assert content['mimetype'] == 'plain/text'
        assert content['size'] == len(b'Test file')
        assert content['page_nb'] == 1
        assert content['has_pdf_preview'] is True
        assert content['has_jpeg_preview'] is True

    def test_api__update_file_info__err_400__content_status_closed(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        with dbsession.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label='Test file',
                do_save=False,
                do_notify=False,
            )
            content_api.update_file_data(
                test_file,
                'Test_file.txt',
                new_mimetype='plain/text',
                new_content=b'Test file',
            )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
        test_file.status = 'closed-validated'
        content_api.save(test_file)
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
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__update_file_info__err_400__content_deleted(self) -> None:
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
            config=self.app_config,
            show_deleted=True,
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        with dbsession.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label='Test file',
                do_save=False,
                do_notify=False,
            )
            content_api.update_file_data(
                test_file,
                'Test_file.txt',
                new_mimetype='plain/text',
                new_content=b'Test file',
            )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
            test_file.is_deleted = True
        content_api.save(test_file)
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
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__update_file_info__err_400__content_archived(self) -> None:
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
            config=self.app_config,
            show_deleted=True,
        )
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        with dbsession.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label='Test file',
                do_save=False,
                do_notify=False,
            )
            content_api.update_file_data(
                test_file,
                'Test_file.txt',
                new_mimetype='plain/text',
                new_content=b'Test file',
            )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_content(test_file, 'Test_file', '<p>description</p>')  # nopep8
            test_file.is_archived = True
        content_api.save(test_file)
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
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__update_file_info__err_400__not_modified(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.txt',
                new_mimetype='plain/text',
                new_content=b'Test file',
            )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
        assert content['is_editable'] is True
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
        assert content['mimetype'] == 'plain/text'
        assert content['size'] == len(b'Test file')
        assert content['page_nb'] == 1
        assert content['has_pdf_preview'] is True
        assert content['has_jpeg_preview'] is True

        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            status=200
        )
        content = res.json_body
        assert content['content_type'] == 'file'
        assert content['content_id'] == test_file.content_id
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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
        assert content['mimetype'] == 'plain/text'
        assert content['size'] == len(b'Test file')
        assert content['page_nb'] == 1
        assert content['has_pdf_preview'] is True
        assert content['has_jpeg_preview'] is True

        res = self.testapp.put_json(
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            params=params,
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.SAME_VALUE_ERROR

    def test_api__update_file_info__err_400__label_already_used(self) -> None:
        """
        Update(put) one file, failed because label already used
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='folder_used',
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
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
        test_file2 = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            filename='already_used.txt',
            do_save=False,
            do_notify=False,
        )
        test_file2.file_extension = '.txt'
        test_file2.depot_file = FileIntent(
            b'Test file',
            'already_used.txt',
            'text/plain',
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
            'label': 'folder_used',
            'raw_content': '<p> Le nouveau contenu </p>',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            params=params,
            status=200
        )
        params = {
            'label': 'already_used',
            'raw_content': '<p> Le nouveau contenu </p>',
        }
        res = self.testapp.put_json(
            '/api/v2/workspaces/1/files/{}'.format(test_file.content_id),
            params=params,
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER  # nopep8

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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.txt',
                new_mimetype='plain/text',
                new_content=b'Test file',
            )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
            '/api/v2/workspaces/1/files/{}/revisions'.format(test_file.content_id),  # nopep8
            status=200
        )
        revisions = res.json_body
        assert len(revisions) == 1
        revision = revisions[0]
        assert revision['content_type'] == 'file'
        assert revision['content_id'] == test_file.content_id
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is True
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
        assert revision['mimetype'] == 'plain/text'
        assert revision['size'] == len(b'Test file')
        assert revision['page_nb'] == 1
        assert revision['has_pdf_preview'] is True

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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
        self.testapp.put_json(
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
            'status': 'unexistant-status',
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
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8

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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
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
        filename = 'Test_file.txt'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, filename),
            status=200
        )
        assert res.body == b'Test file'
        assert res.content_type == 'text/plain'
        assert res.content_length == len(b'Test file')

    def test_api__get_file_raw__ok_200__force_download_case(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                new_content=b'Test file',
                new_filename='Test_file.txt',
                new_mimetype='text/plain',
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
        params = {
            'force_download': 1,
        }
        filename = 'Test_file.txt'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, filename),
            status=200,
            params=params
        )
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(filename, filename)  # nopep8
        assert res.body == b'Test file'
        assert res.content_type == 'text/plain'
        assert res.content_length == len(b'Test file')

    def test_api__create_file__ok__200__nominal_case(self) -> None:
        """
        create one file of a content at workspace root
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

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        image = create_1000px_png_test_image()
        res = self.testapp.post(
            '/api/v2/workspaces/{}/files'.format(business_workspace.workspace_id),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=200,
        )
        res = res.json_body
        assert res['parent_id'] is None
        assert res['content_type'] == 'file'
        assert res['is_archived'] is False
        assert res['is_deleted'] is False
        assert res['is_editable'] is True
        assert res['workspace_id'] == business_workspace.workspace_id
        assert isinstance(res['content_id'], int)
        content_id = res['content_id']
        assert res['status'] == 'open'
        assert res['label'] == 'test_image'
        assert res['slug'] == 'test-image'

        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/files/{content_id}'.format(
                workspace_id=business_workspace.workspace_id,
                content_id=content_id
            ),
            status=200,
        )

        res = res.json_body
        assert res['parent_id'] is None
        assert res['content_type'] == 'file'
        assert res['is_archived'] is False
        assert res['is_deleted'] is False
        assert res['is_editable'] is True
        assert res['workspace_id'] == business_workspace.workspace_id
        assert isinstance(res['content_id'], int)
        content_id = res['content_id']
        assert res['status'] == 'open'
        assert res['label'] == 'test_image'
        assert res['slug'] == 'test-image'
        assert res['author']['user_id'] == admin.user_id
        assert res['page_nb'] == 1
        assert res['mimetype'] == 'image/png'

    def test_api__create_file__err_400__filename_already_used(self) -> None:
        """
        create one file of a content but filename is already used here
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

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        image = create_1000px_png_test_image()
        res = self.testapp.post(
            '/api/v2/workspaces/{}/files'.format(business_workspace.workspace_id),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=200,
        )
        res = res.json_body
        assert res['parent_id'] is None
        assert res['content_type'] == 'file'
        assert res['is_archived'] is False
        assert res['is_deleted'] is False
        assert res['is_editable'] is True
        assert res['workspace_id'] == business_workspace.workspace_id
        assert isinstance(res['content_id'], int)
        content_id = res['content_id']
        assert res['status'] == 'open'
        assert res['label'] == 'test_image'
        assert res['slug'] == 'test-image'

        res = self.testapp.post(
            '/api/v2/workspaces/{}/files'.format(business_workspace.workspace_id),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER

    def test_api__create_file__ok__200__in_folder(self) -> None:
        """
        create one file of a content in a folder
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
        folder = content_api.create(
            label='test-folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=business_workspace,
            do_save=True,
            do_notify=False
        )
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'parent_id': folder.content_id,
        }
        image = create_1000px_png_test_image()
        res = self.testapp.post(
            '/api/v2/workspaces/{}/files'.format(business_workspace.workspace_id),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            params=params,
            status=200,
        )
        res = res.json_body
        assert res['parent_id'] == folder.content_id
        assert res['content_type'] == 'file'
        assert res['is_archived'] is False
        assert res['is_deleted'] is False
        assert res['is_editable'] is True
        assert res['workspace_id'] == business_workspace.workspace_id
        assert isinstance(res['content_id'], int)
        content_id = res['content_id']
        assert res['status'] == 'open'
        assert res['label'] == 'test_image'
        assert res['slug'] == 'test-image'

        res = self.testapp.get(
            '/api/v2/workspaces/{workspace_id}/files/{content_id}'.format(
                workspace_id=business_workspace.workspace_id,
                content_id=content_id
            ),
            status=200,
        )

        res = res.json_body
        assert res['parent_id'] == folder.content_id
        assert res['content_type'] == 'file'
        assert res['is_archived'] is False
        assert res['is_deleted'] is False
        assert res['is_editable'] is True
        assert res['workspace_id'] == business_workspace.workspace_id
        assert isinstance(res['content_id'], int)
        content_id = res['content_id']
        assert res['status'] == 'open'
        assert res['label'] == 'test_image'
        assert res['slug'] == 'test-image'
        assert res['author']['user_id'] == admin.user_id
        assert res['page_nb'] == 1
        assert res['mimetype'] == 'image/png'

    def test_api__create_file__err__400__unallow_subcontent(self) -> None:
        """
        create one file of a content but subcontent of type file unallowed here
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
        folder = content_api.create(
            label='test-folder',
            content_type_slug=content_type_list.Folder.slug,
            workspace=business_workspace,
            do_save=True,
            do_notify=False
        )
        with new_revision(
                session=dbsession,
                tm=transaction.manager,
                content=folder,
        ):
            content_api.set_allowed_content(folder, [])
        content_api.save(folder)
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'parent_id': folder.content_id,
        }
        image = create_1000px_png_test_image()
        res = self.testapp.post(
            '/api/v2/workspaces/{}/files'.format(business_workspace.workspace_id),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            params=params,
            status=400,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.UNALLOWED_SUBCONTENT

    def test_api__create_file__err__400__parent_not_found(self) -> None:
        """
        create one file of a content but parent_id is not valid
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

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'parent_id': 3000
        }
        image = create_1000px_png_test_image()
        res = self.testapp.post(
            '/api/v2/workspaces/{}/files'.format(business_workspace.workspace_id),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            params=params,
            status=400,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.PARENT_NOT_FOUND

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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            status=200
        )
        assert res.body == image.getvalue()
        assert res.content_type == 'image/png'
        assert res.content_length == len(image.getvalue())

    def test_api__set_file_raw__ok_200__filename_already_used(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        test_file_2 = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file2',
            do_save=False,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        content2_id = int(test_file_2.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content2_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER  # nopep8


    def test_api__set_file_raw__err_400__closed_status_file(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        test_file.status = 'closed-validated'
        content_api.save(test_file)
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_IN_NOT_EDITABLE_STATE

    @pytest.mark.xfail(
        raises=AssertionError,
        reason='Broken feature dues to pyramid behaviour'
    )
    def test_api__set_file_raw__err_400_not_modified(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            status=200
        )
        assert res.body == image.getvalue()
        assert res.content_type == 'image/png'
        assert res.content_length == len(image.getvalue())

        res = self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status='*',
        )
        assert res.status == 400
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER  # nopep8

    def test_api__get_allowed_size_dim__ok__nominal_case(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        content_id = int(test_file.content_id)
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/allowed_dims'.format(content_id),  # nopep8
            status=200,
        )
        res = res.json_body
        assert res['restricted'] is True
        assert len(res['dimensions']) == 1
        dim = res['dimensions'][0]
        assert dim['width'] == 256
        assert dim['height'] == 256

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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/'.format(content_id),
            status=200
        )
        assert res.body != image.getvalue()
        assert res.content_type == 'image/jpeg'

    def test_api__get_jpeg_preview__ok__200__force_download_case(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        params = {
            'force_download': 1,
        }
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/raw'.format(content_id),
            status=200,
            params=params
        )
        filename = 'test_image_page_1.jpg'
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(filename, filename)  # nopep8
        assert res.body != image.getvalue()
        assert res.content_type == 'image/jpeg'

    def test_api__get_jpeg_preview__err_400__UnavailablePreview(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.bin',
                new_mimetype='application/octet-stream',
                new_content=bytes(100),
            )
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
        params = {
            'force_download': 0,
        }
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/'.format(content_id),
            status=400,
            params=params
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.UNAIVALABLE_PREVIEW

    def test_api__get_sized_jpeg_preview__ok__200__nominal_case(self) -> None:
        """
        get 256x256 preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/256x256/{}'.format(content_id, image.name),  # nopep8
            status=200
        )
        assert res.body != image.getvalue()
        assert res.content_type == 'image/jpeg'
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_preview__err_400__UnavailablePreview(self) -> None:
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.bin',
                new_mimetype='application/octet-stream',
                new_content=bytes(100),
            )
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
        params = {
            'force_download': 0,
        }
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/256x256/{}'.format(content_id, 'Test_file.bin'),  # nopep8
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.UNAIVALABLE_PREVIEW

    def test_api__get_sized_jpeg_preview__ok__200__force_download_case(self) -> None:
        """
        get 256x256 preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        params = {
            'force_download': 1,
        }
        dl_filename = 'test_image_page_1_256x256.jpg'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/256x256/{}'.format(content_id, dl_filename),  # nopep8
            status=200,
            params=params,
        )
        assert res.body != image.getvalue()
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(dl_filename, dl_filename)  # nopep8
        assert res.content_type == 'image/jpeg'
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_preview__ok__200__force_download_case_no_filename(self) -> None:
        """
        get 256x256 preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        params = {
            'force_download': 1,
        }
        dl_filename = 'test_image_page_1_256x256.jpg'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/256x256/'.format(content_id),  # nopep8
            status=200,
            params=params,
        )
        assert res.body != image.getvalue()
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(dl_filename, dl_filename)  # nopep8
        assert res.content_type == 'image/jpeg'
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_preview__ok__200__force_download_case_filename_is_raw(self) -> None:
        """
        get 256x256 preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        params = {
            'force_download': 1,
        }
        dl_filename = 'test_image_page_1_256x256.jpg'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/256x256/raw'.format(content_id),  # nopep8
            status=200,
            params=params,
        )
        assert res.body != image.getvalue()
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(dl_filename, dl_filename)  # nopep8
        assert res.content_type == 'image/jpeg'
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_preview__err__400__SizeNotAllowed(self) -> None:  # nopep8
        """
        get 256x256 preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        filename = 'test_image_512x512.jpg'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/jpg/512x512/{}'.format(content_id, filename),  # nopep8
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.PREVIEW_DIM_NOT_ALLOWED

    def test_api__get_sized_jpeg_revision_preview__ok__200__nominal_case(self) -> None:  # nopep8
        """
        get 256x256 revision preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        filename = "test_file.txt"
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                filename=filename
            ),
            status=200
        )
        assert res.content_type == 'text/plain'
        filename = "test_image_256x256.jpg"
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/jpg/256x256/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                filename=filename,
            ),
            status=200
        )
        assert res.body != image.getvalue()
        assert res.content_type == 'image/jpeg'
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_revision_preview__ok__200__force_download_case(self) -> None:  # nopep8
        """
        get 256x256 revision preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                filename=image.name
            ),
            status=200
        )
        assert res.content_type == 'text/plain'
        params = {
            'force_download': 1,
        }
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/jpg/256x256/'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
            ),
            status=200,
            params=params,
        )
        filename = 'Test file_r{}_page_1_256x256.jpg'.format(revision_id)
        urlencoded_filename = quote(filename)
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(filename, urlencoded_filename)  # nopep8
        assert res.body != image.getvalue()
        assert res.content_type == 'image/jpeg'
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_full_pdf_preview__ok__200__nominal_case(self) -> None:
        """
        get full pdf preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, test_file.file_name),
            upload_files=[
                ('files', test_file.file_name, test_file.depot_file.file.read())
            ],
            status=204,
        )
        filename = 'test_image.pdf'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/full/{}'.format(content_id, filename),  # nopep8
            status=200
        )
        assert res.content_type == 'application/pdf'

    def test_api__get_full_pdf_preview__ok__200__force_download_case(self) -> None:
        """
        get full pdf preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        filename = 'Test_file.txt'
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, filename),
            upload_files=[
                ('files', test_file.file_name, test_file.depot_file.file.read())
            ],
            status=204,
        )
        params = {
            'force_download': 1,
        }
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/full/{}'.format(content_id, filename),  # nopep8
            status=200,
            params=params
        )
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(filename, filename)  # nopep8
        assert res.content_type == 'application/pdf'

        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/full/{}'.format(content_id, 'Test_file.pdf'),  # nopep8
            status=200,
            params=params
        )
        filename = "Test_file.pdf"
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(filename, filename)  # nopep8
        assert res.content_type == 'application/pdf'

    def test_api__get_full_pdf_preview__err__400__png_UnavailablePreviewType(self) -> None:  # nopep8
        """
       get full pdf preview of a png image -> error UnavailablePreviewType
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=True,
            do_notify=False,
        )
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/full/{}'.format(content_id, image.name),  # nopep8
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.UNAVAILABLE_PREVIEW_TYPE

    def test_api__get_full_pdf_preview__err__400__png_UnavailablePreview(self) -> None:  # nopep8
        """
       get full pdf preview of a png image -> error UnavailablePreviewType
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.bin',
                new_mimetype='application/octet-stream',
                new_content=bytes(100),
            )
        dbsession.flush()
        content_id = test_file.content_id
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        filename = 'Test_file.bin'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/full/{}'.format(content_id, filename),  # nopep8
            status=400
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.UNAIVALABLE_PREVIEW

    def test_api__get_pdf_preview__ok__200__nominal_case(self) -> None:
        """
        get full pdf preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, test_file.file_name),
            upload_files=[
                ('files', test_file.file_name, test_file.depot_file.file.read())
            ],
            status=204,
        )
        params = {'page': 1}
        filename = 'test_file.pdf'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/{}'.format(content_id, filename),
            status=200,
            params=params,
        )
        assert res.content_type == 'application/pdf'

    def test_api__get_pdf_preview_err__400__UnavailablePreview(self) -> None:
        """
        get full pdf preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test file',
            do_save=False,
            do_notify=False,
        )
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=test_file,
        ):
            content_api.update_file_data(
                test_file,
                'Test_file.bin',
                new_mimetype='application/octet-stream',
                new_content=bytes(100),
            )
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
        params = {'page': 1}
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/'.format(content_id),
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.UNAIVALABLE_PREVIEW

    def test_api__get_pdf_preview__ok__200__force_download_case(self) -> None:
        """
        get full pdf preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        filename = 'test_file.txt'
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, filename),
            upload_files=[
                ('files', test_file.file_name, test_file.depot_file.file.read())
            ],
            status=204,
        )
        filename = 'Test_file_page_1.pdf'
        params = {'page': 1, 'force_download': 1}
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/{}'.format(content_id, filename),
            status=200,
            params=params,
        )
        assert res.content_type == 'application/pdf'
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(filename, filename)  # nopep8

    def test_api__get_pdf_preview__ok__err__400_page_of_preview_not_found(self) -> None:  # nopep8
        """
        get full pdf preview of a txt file
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/'.format(content_id),
            upload_files=[
                ('files', test_file.file_name, test_file.depot_file.file.read())
            ],
            status=204,
        )
        params = {'page': 2}
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{}/preview/pdf/'.format(content_id),
            status=400,
            params=params,
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.PAGE_OF_PREVIEW_NOT_FOUND

    def test_api__get_pdf_revision_preview__ok__200__nominal_case(self) -> None:
        """
        get pdf revision preview of content
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        filename = image.name
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                filename=filename,
            ),
            status=200
        )
        assert res.content_type == 'text/plain'
        params = {'page': 1}
        filename = 'test_image__page_1.pdf'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/pdf/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                params=params,
                filename=filename,
            ),
            status=200
        )
        assert res.content_type == 'application/pdf'

    def test_api__get_full_pdf_revision_preview__ok__200__nominal_case(self) -> None:
        """
        get pdf revision preview of content
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
            ),
            status=200
        )
        assert res.content_type == 'text/plain'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/pdf/full/'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
            ),
            status=200
        )
        assert res.content_type == 'application/pdf'

    def test_api__get_full_pdf_revision_preview__ok__200__force_download_case(self) -> None:
        """
        get pdf revision preview of content
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                filename=image.name
            ),
            status=200
        )
        assert res.content_type == 'text/plain'
        params = {'force_download': 1}
        filename = 'Test_file.pdf'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/pdf/full/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                filename='Test_file.pdf'
            ),
            status=200,
            params=params,
        )

        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(filename, filename)  # nopep8
        assert res.content_type == 'application/pdf'

    def test_api__get_pdf_revision_preview__ok__200__force_download_case(self) -> None:
        """
        get pdf revision preview of content
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
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
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
        dbsession.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        self.testapp.put(
            '/api/v2/workspaces/1/files/{}/raw/{}'.format(content_id, image.name),
            upload_files=[
                ('files', image.name, image.getvalue())
            ],
            status=204,
        )
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                filename=image.name
            ),
            status=200
        )
        assert res.content_type == 'text/plain'
        params = {'page': 1, 'force_download': 1}
        filename = 'test_image_page_1.pdf'
        res = self.testapp.get(
            '/api/v2/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/pdf/{filename}'.format(  # nopep8
                content_id=content_id,
                revision_id=revision_id,
                filename=filename
            ),
            status=200,
            params=params,
        )
        assert res.headers['Content-Disposition'] == 'attachment; filename="{}"; filename*=UTF-8\'\'{};'.format(filename, filename)  # nopep8
        assert res.content_type == 'application/pdf'


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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_TYPE_NOT_ALLOWED

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
        assert content['is_editable'] is True
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
        assert content['file_extension'] == '.thread.html'
        assert content['filename'] == 'Best Cakes?.thread.html'

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.WORKSPACE_NOT_FOUND

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.WORKSPACE_INVALID_ID

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
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.CONTENT_INVALID_ID

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
        assert content['is_editable'] is True
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
        assert content['file_extension'] == '.thread.html'
        assert content['filename'] == 'My New label.thread.html'

        res = self.testapp.get(
            '/api/v2/workspaces/2/threads/7',
            status=200
        )   # nopep8
        content = res.json_body
        assert content['content_type'] == 'thread'
        assert content['content_id'] == 7
        assert content['is_archived'] is False
        assert content['is_deleted'] is False
        assert content['is_editable'] is True
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
        assert content['file_extension'] == '.thread.html'
        assert content['filename'] == 'My New label.thread.html'

    def test_api__update_thread__err_400__not_modified(self) -> None:
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
        assert content['is_editable'] is True
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
        assert content['is_editable'] is True
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

        res = self.testapp.put_json(
            '/api/v2/workspaces/2/threads/7',
            params=params,
            status=400
        )
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.SAME_VALUE_ERROR

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
        # TODO - G.M - 2018-09-10 - Handle by marshmallow schema
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR   # nopep8

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
        assert revision['is_editable'] is False
        assert revision['label'] == 'Best Cake'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'best-cake'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 8
        assert revision['sub_content_types']
        assert revision['revision_type'] == 'creation'
        assert revision['comment_ids'] == [18, 19, 20]
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 1
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Global manager'
        assert revision['file_extension'] == '.thread.html'
        assert revision['filename'] == 'Best Cake.thread.html'
        revision = revisions[1]
        assert revision['content_type'] == 'thread'
        assert revision['content_id'] == 7
        assert revision['is_archived'] is False
        assert revision['is_deleted'] is False
        assert revision['is_editable'] is True
        assert revision['label'] == 'Best Cakes?'
        assert revision['parent_id'] == 3
        assert revision['show_in_ui'] is True
        assert revision['slug'] == 'best-cakes'
        assert revision['status'] == 'open'
        assert revision['workspace_id'] == 2
        assert revision['revision_id'] == 26
        assert revision['revision_type'] == 'edition'
        assert revision['sub_content_types']
        assert revision['comment_ids'] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision['created']
        assert revision['author']
        assert revision['author']['user_id'] == 3
        assert revision['author']['avatar_url'] is None
        assert revision['author']['public_name'] == 'Bob i.'
        assert revision['file_extension'] == '.thread.html'
        assert revision['filename'] == 'Best Cakes?.thread.html'

    def test_api__get_thread_revisions__ok_200__most_revision_type(self) -> None:
        """
        get threads revisions
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
        business_workspace = workspace_api.get_one(1)
        content_api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config
        )
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_thread = content_api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label='Test Thread',
            do_save=True,
            do_notify=False,
        )
        with new_revision(
           session=dbsession,
           tm=transaction.manager,
           content=test_thread,
        ):
            content_api.update_content(
                test_thread,
                new_label='test_thread_updated',
                new_content='Just a test'
            )
        content_api.save(test_thread)
        with new_revision(
           session=dbsession,
           tm=transaction.manager,
           content=test_thread,
        ):
            content_api.archive(test_thread)
        content_api.save(test_thread)

        with new_revision(
           session=dbsession,
           tm=transaction.manager,
           content=test_thread,
        ):
            content_api.unarchive(test_thread)
        content_api.save(test_thread)

        with new_revision(
           session=dbsession,
           tm=transaction.manager,
           content=test_thread,
        ):
            content_api.delete(test_thread)
        content_api.save(test_thread)

        with new_revision(
           session=dbsession,
           tm=transaction.manager,
           content=test_thread,
        ):
            content_api.undelete(test_thread)
        content_api.save(test_thread)
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
            '/api/v2/workspaces/1/threads/{}/revisions'.format(test_thread.content_id),  # nopep8
            status=200
        )
        revisions = res.json_body
        assert len(revisions) == 6
        for revision in revisions:
            assert revision['content_type'] == 'thread'
            assert revision['workspace_id'] == 1
            assert revision['content_id'] == test_thread.content_id
        revision = revisions[0]
        assert revision['revision_type'] == 'creation'
        assert revision['is_editable'] is False
        revision = revisions[1]
        assert revision['revision_type'] == 'edition'
        assert revision['is_editable'] is False
        revision = revisions[2]
        assert revision['revision_type'] == 'archiving'
        assert revision['is_editable'] is False
        revision = revisions[3]
        assert revision['revision_type'] == 'unarchiving'
        assert revision['is_editable'] is False
        revision = revisions[4]
        assert revision['revision_type'] == 'deletion'
        assert revision['is_editable'] is False
        revision = revisions[5]
        assert revision['revision_type'] == 'undeletion'
        assert revision['is_editable'] is True

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
        assert content['is_editable'] is True
        # set status
        self.testapp.put_json(
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
        assert content['is_editable'] is False

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
        # INFO - G.M - 2018-09-10 - Handle by marshmallow schema
        assert res.json_body
        assert 'code' in res.json_body
        assert res.json_body['code'] == error.GENERIC_SCHEMA_VALIDATION_ERROR  # nopep8
