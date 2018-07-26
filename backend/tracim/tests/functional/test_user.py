# -*- coding: utf-8 -*-
"""
Tests for /api/v2/users subpath endpoints.
"""
from time import sleep
import pytest
import transaction

from tracim import models
from tracim.lib.core.content import ContentApi
from tracim.lib.core.user import UserApi
from tracim.lib.core.group import GroupApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.models import get_tm_session
from tracim.models.contents import ContentTypeLegacy as ContentType
from tracim.models.revision_protection import new_revision
from tracim.tests import FunctionalTest
from tracim.fixtures.content import Content as ContentFixtures
from tracim.fixtures.users_and_groups import Base as BaseFixture


class TestUserRecentlyActiveContentEndpoint(FunctionalTest):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/contents/recently_active # nopep8
    """
    fixtures = [BaseFixture]

    def test_api__get_recently_active_content__ok__200__nominal_case(self):

        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        workspace2 = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace2',
            save_now=True
        )

        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder_workspace2 = api.create(ContentType.Folder, workspace2, None, 'Hepla', '', True)  # nopep8
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        secondly_created = api.create(ContentType.Page, workspace, main_folder, 'another creation_order_test', '', True)  # nopep8
        # update order test
        firstly_created_but_recently_updated = api.create(ContentType.Page, workspace, main_folder, 'update_order_test', '', True)  # nopep8
        secondly_created_but_not_updated = api.create(ContentType.Page, workspace, main_folder, 'another update_order_test', '', True)  # nopep8
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=firstly_created_but_recently_updated,
        ):
            firstly_created_but_recently_updated.description = 'Just an update'
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(ContentType.Page, workspace, main_folder, 'this is randomized label content', '', True)  # nopep8
        secondly_created_but_not_commented = api.create(ContentType.Page, workspace, main_folder, 'this is another randomized label content', '', True)  # nopep8
        comments = api.create_comment(workspace, firstly_created_but_recently_commented, 'juste a super comment', True)  # nopep8
        content_workspace_2 = api.create(ContentType.Page, workspace2,main_folder_workspace2, 'content_workspace_2', '',True)  # nopep8
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/recently_active'.format(workspace.workspace_id), status=200) # nopep8
        res = res.json_body
        assert len(res) == 7
        for elem in res:
            assert isinstance(elem['content_id'], int)
            assert isinstance(elem['content_type'], str)
            assert elem['content_type'] != 'comments'
            assert isinstance(elem['is_archived'], bool)
            assert isinstance(elem['is_deleted'], bool)
            assert isinstance(elem['label'], str)
            assert isinstance(elem['parent_id'], int) or elem['parent_id'] is None
            assert isinstance(elem['show_in_ui'], bool)
            assert isinstance(elem['slug'], str)
            assert isinstance(elem['status'], str)
            assert isinstance(elem['sub_content_types'], list)
            for sub_content_type in elem['sub_content_types']:
                assert isinstance(sub_content_type, str)
            assert isinstance(elem['workspace_id'], int)
        # comment is newest than page2
        assert res[0]['content_id'] == firstly_created_but_recently_commented.content_id
        assert res[1]['content_id'] == secondly_created_but_not_commented.content_id
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[2]['content_id'] == firstly_created_but_recently_updated.content_id
        assert res[3]['content_id'] == secondly_created_but_not_updated.content_id
        # creation order is inverted here as last created is last active
        assert res[4]['content_id'] == secondly_created.content_id
        assert res[5]['content_id'] == firstly_created.content_id
        # folder subcontent modification does not change folder order
        assert res[6]['content_id'] == main_folder.content_id

    @pytest.mark.skip('Test should be fixed')
    def test_api__get_recently_active_content__ok__200__limit_2_multiple(self):
        # TODO - G.M - 2018-07-20 - Better fix for this test, do not use sleep()
        # anymore to fix datetime lack of precision.

        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        workspace2 = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace2',
            save_now=True
        )

        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder_workspace2 = api.create(ContentType.Folder, workspace2, None, 'Hepla', '', True)  # nopep8
        sleep(1)
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        sleep(1)
        secondly_created = api.create(ContentType.Page, workspace, main_folder, 'another creation_order_test', '', True)  # nopep8
        # update order test
        firstly_created_but_recently_updated = api.create(ContentType.Page, workspace, main_folder, 'update_order_test', '', True)  # nopep8
        sleep(1)
        secondly_created_but_not_updated = api.create(ContentType.Page, workspace, main_folder, 'another update_order_test', '', True)  # nopep8
        sleep(1)
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=firstly_created_but_recently_updated,
        ):
            firstly_created_but_recently_updated.description = 'Just an update'
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(ContentType.Page, workspace, main_folder, 'this is randomized label content', '', True)  # nopep8
        sleep(1)
        secondly_created_but_not_commented = api.create(ContentType.Page, workspace, main_folder, 'this is another randomized label content', '', True)  # nopep8
        sleep(1)
        comments = api.create_comment(workspace, firstly_created_but_recently_commented, 'juste a super comment', True)  # nopep8
        sleep(1)
        content_workspace_2 = api.create(ContentType.Page, workspace2,main_folder_workspace2, 'content_workspace_2', '',True)  # nopep8
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
            'limit': 2,
        }
        res = self.testapp.get(
            '/api/v2/users/1/workspaces/{}/contents/recently_active'.format(workspace.workspace_id),  # nopep8
            status=200,
            params=params
        ) # nopep8
        res = res.json_body
        assert len(res) == 2
        for elem in res:
            assert isinstance(elem['content_id'], int)
            assert isinstance(elem['content_type'], str)
            assert elem['content_type'] != 'comments'
            assert isinstance(elem['is_archived'], bool)
            assert isinstance(elem['is_deleted'], bool)
            assert isinstance(elem['label'], str)
            assert isinstance(elem['parent_id'], int) or elem['parent_id'] is None
            assert isinstance(elem['show_in_ui'], bool)
            assert isinstance(elem['slug'], str)
            assert isinstance(elem['status'], str)
            assert isinstance(elem['sub_content_types'], list)
            for sub_content_type in elem['sub_content_types']:
                assert isinstance(sub_content_type, str)
            assert isinstance(elem['workspace_id'], int)
        # comment is newest than page2
        assert res[0]['content_id'] == firstly_created_but_recently_commented.content_id
        assert res[1]['content_id'] == secondly_created_but_not_commented.content_id

        params = {
            'limit': 2,
            'before_datetime': secondly_created_but_not_commented.get_last_activity_date().strftime('%Y-%m-%dT%H:%M:%SZ'),  # nopep8
        }
        res = self.testapp.get(
            '/api/v2/users/1/workspaces/{}/contents/recently_active'.format(workspace.workspace_id),  # nopep8
            status=200,
            params=params
        )
        res = res.json_body
        assert len(res) == 2
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[0]['content_id'] == firstly_created_but_recently_updated.content_id
        assert res[1]['content_id'] == secondly_created_but_not_updated.content_id


class TestUserReadStatusEndpoint(FunctionalTest):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status # nopep8
    """
    def test_api__get_read_status__ok__200__all(self):

        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        workspace2 = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace2',
            save_now=True
        )

        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder_workspace2 = api.create(ContentType.Folder, workspace2, None, 'Hepla', '', True)  # nopep8
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        secondly_created = api.create(ContentType.Page, workspace, main_folder, 'another creation_order_test', '', True)  # nopep8
        # update order test
        firstly_created_but_recently_updated = api.create(ContentType.Page, workspace, main_folder, 'update_order_test', '', True)  # nopep8
        secondly_created_but_not_updated = api.create(ContentType.Page, workspace, main_folder, 'another update_order_test', '', True)  # nopep8
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=firstly_created_but_recently_updated,
        ):
            firstly_created_but_recently_updated.description = 'Just an update'
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(ContentType.Page, workspace, main_folder, 'this is randomized label content', '', True)  # nopep8
        secondly_created_but_not_commented = api.create(ContentType.Page, workspace, main_folder, 'this is another randomized label content', '', True)  # nopep8
        comments = api.create_comment(workspace, firstly_created_but_recently_commented, 'juste a super comment', True)  # nopep8
        content_workspace_2 = api.create(ContentType.Page, workspace2,main_folder_workspace2, 'content_workspace_2', '',True)  # nopep8
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200) # nopep8
        res = res.json_body
        assert len(res) == 7
        for elem in res:
            assert isinstance(elem['content_id'], int)
            assert isinstance(elem['read_by_user'], bool)
        # comment is newest than page2
        assert res[0]['content_id'] == firstly_created_but_recently_commented.content_id
        assert res[1]['content_id'] == secondly_created_but_not_commented.content_id
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[2]['content_id'] == firstly_created_but_recently_updated.content_id
        assert res[3]['content_id'] == secondly_created_but_not_updated.content_id
        # creation order is inverted here as last created is last active
        assert res[4]['content_id'] == secondly_created.content_id
        assert res[5]['content_id'] == firstly_created.content_id
        # folder subcontent modification does not change folder order
        assert res[6]['content_id'] == main_folder.content_id

    def test_api__get_read_status__ok__200__nominal_case(self):

        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        workspace2 = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace2',
            save_now=True
        )

        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder_workspace2 = api.create(ContentType.Folder, workspace2, None, 'Hepla', '', True)  # nopep8
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        secondly_created = api.create(ContentType.Page, workspace, main_folder, 'another creation_order_test', '', True)  # nopep8
        # update order test
        firstly_created_but_recently_updated = api.create(ContentType.Page, workspace, main_folder, 'update_order_test', '', True)  # nopep8
        secondly_created_but_not_updated = api.create(ContentType.Page, workspace, main_folder, 'another update_order_test', '', True)  # nopep8
        with new_revision(
            session=dbsession,
            tm=transaction.manager,
            content=firstly_created_but_recently_updated,
        ):
            firstly_created_but_recently_updated.description = 'Just an update'
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(ContentType.Page, workspace, main_folder, 'this is randomized label content', '', True)  # nopep8
        secondly_created_but_not_commented = api.create(ContentType.Page, workspace, main_folder, 'this is another randomized label content', '', True)  # nopep8
        comments = api.create_comment(workspace, firstly_created_but_recently_commented, 'juste a super comment', True)  # nopep8
        content_workspace_2 = api.create(ContentType.Page, workspace2,main_folder_workspace2, 'content_workspace_2', '',True)  # nopep8
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        selected_contents_id = [
            firstly_created_but_recently_commented.content_id,
            firstly_created_but_recently_updated.content_id,
            firstly_created.content_id,
            main_folder.content_id,
        ]
        url = '/api/v2/users/1/workspaces/{workspace_id}/contents/read_status?contents_ids={cid1}&contents_ids={cid2}&contents_ids={cid3}&contents_ids={cid4}'.format(  # nopep8
              workspace_id=workspace.workspace_id,
              cid1=selected_contents_id[0],
              cid2=selected_contents_id[1],
              cid3=selected_contents_id[2],
              cid4=selected_contents_id[3],
        )
        res = self.testapp.get(
            url=url,
            status=200,
        )
        res = res.json_body
        assert len(res) == 4
        for elem in res:
            assert isinstance(elem['content_id'], int)
            assert isinstance(elem['read_by_user'], bool)
        # comment is newest than page2
        assert res[0]['content_id'] == firstly_created_but_recently_commented.content_id
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[1]['content_id'] == firstly_created_but_recently_updated.content_id
        # creation order is inverted here as last created is last active
        assert res[2]['content_id'] == firstly_created.content_id
        # folder subcontent modification does not change folder order
        assert res[3]['content_id'] == main_folder.content_id


class TestUserSetContentAsRead(FunctionalTest):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read  # nopep8
    """
    def test_api_set_content_as_read__ok__200__nominal_case(self):
        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        api.mark_unread(firstly_created)
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200) # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is False
        self.testapp.put(
            '/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read'.format(  # nopep8
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin.user_id,
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200)  # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is True

    def test_api_set_content_as_read__ok__200__with_comments(self):
        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        comments = api.create_comment(workspace, firstly_created, 'juste a super comment', True)  # nopep8
        api.mark_unread(firstly_created)
        api.mark_unread(comments)
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200) # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is False
        self.testapp.put(
            '/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read'.format(  # nopep8
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin.user_id,
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200)  # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is True

        # comment is also set as read
        assert comments.has_new_information_for(admin) is False


class TestUserSetContentAsUnread(FunctionalTest):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread  # nopep8
    """
    def test_api_set_content_as_unread__ok__200__nominal_case(self):
        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        api.mark_read(firstly_created)
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200) # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is True
        self.testapp.put(
            '/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread'.format(  # nopep8
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin.user_id,
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200)  # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is False

    def test_api_set_content_as_unread__ok__200__with_comments(self):
        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        comments = api.create_comment(workspace, firstly_created, 'juste a super comment', True)  # nopep8
        api.mark_read(firstly_created)
        api.mark_read(comments)
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200) # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is True
        self.testapp.put(
            '/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread'.format(  # nopep8
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin.user_id,
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200)  # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is False

        assert comments.has_new_information_for(admin) is True


class TestUserSetWorkspaceAsRead(FunctionalTest):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/read
    """
    def test_api_set_content_as_read__ok__200__nominal_case(self):
        # init DB
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config

        )
        workspace = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        api = ContentApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        main_folder = api.create(ContentType.Folder, workspace, None, 'this is randomized folder', '', True)  # nopep8
        # creation order test
        firstly_created = api.create(ContentType.Page, workspace, main_folder, 'creation_order_test', '', True)  # nopep8
        api.mark_unread(main_folder)
        api.mark_unread(firstly_created)
        dbsession.flush()
        transaction.commit()

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200) # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is False
        assert res.json_body[1]['content_id'] == main_folder.content_id
        assert res.json_body[1]['read_by_user'] is False
        self.testapp.put(
            '/api/v2/users/{user_id}/workspaces/{workspace_id}/read'.format(  # nopep8
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin.user_id,
            )
        )
        res = self.testapp.get('/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id), status=200)  # nopep8
        assert res.json_body[0]['content_id'] == firstly_created.content_id
        assert res.json_body[0]['read_by_user'] is True
        assert res.json_body[1]['content_id'] == main_folder.content_id
        assert res.json_body[1]['read_by_user'] is True


class TestUserWorkspaceEndpoint(FunctionalTest):
    """
    Tests for /api/v2/users/{user_id}/workspaces
    """
    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_user_workspaces__ok_200__nominal_case(self):
        """
        Check obtain all workspaces reachables for user with user auth.
        """
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
        assert workspace['workspace_id'] == 1
        assert workspace['label'] == 'Business'
        assert workspace['slug'] == 'business'
        assert len(workspace['sidebar_entries']) == 7

        sidebar_entry = workspace['sidebar_entries'][0]
        assert sidebar_entry['slug'] == 'dashboard'
        assert sidebar_entry['label'] == 'Dashboard'
        assert sidebar_entry['route'] == '/#/workspaces/1/dashboard'  # nopep8
        assert sidebar_entry['hexcolor'] == "#252525"
        assert sidebar_entry['fa_icon'] == "signal"

        sidebar_entry = workspace['sidebar_entries'][1]
        assert sidebar_entry['slug'] == 'contents/all'
        assert sidebar_entry['label'] == 'All Contents'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents"  # nopep8
        assert sidebar_entry['hexcolor'] == "#fdfdfd"
        assert sidebar_entry['fa_icon'] == "th"

        sidebar_entry = workspace['sidebar_entries'][2]
        assert sidebar_entry['slug'] == 'contents/html-documents'
        assert sidebar_entry['label'] == 'Text Documents'
        assert sidebar_entry['route'] == '/#/workspaces/1/contents?type=html-documents'  # nopep8
        assert sidebar_entry['hexcolor'] == "#3f52e3"
        assert sidebar_entry['fa_icon'] == "file-text-o"

        sidebar_entry = workspace['sidebar_entries'][3]
        assert sidebar_entry['slug'] == 'contents/markdownpluspage'
        assert sidebar_entry['label'] == 'Markdown Plus Documents'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=markdownpluspage"    # nopep8
        assert sidebar_entry['hexcolor'] == "#f12d2d"
        assert sidebar_entry['fa_icon'] == "file-code-o"

        sidebar_entry = workspace['sidebar_entries'][4]
        assert sidebar_entry['slug'] == 'contents/files'
        assert sidebar_entry['label'] == 'Files'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=file"  # nopep8
        assert sidebar_entry['hexcolor'] == "#FF9900"
        assert sidebar_entry['fa_icon'] == "paperclip"

        sidebar_entry = workspace['sidebar_entries'][5]
        assert sidebar_entry['slug'] == 'contents/threads'
        assert sidebar_entry['label'] == 'Threads'
        assert sidebar_entry['route'] == "/#/workspaces/1/contents?type=thread"  # nopep8
        assert sidebar_entry['hexcolor'] == "#ad4cf9"
        assert sidebar_entry['fa_icon'] == "comments-o"

        sidebar_entry = workspace['sidebar_entries'][6]
        assert sidebar_entry['slug'] == 'calendar'
        assert sidebar_entry['label'] == 'Calendar'
        assert sidebar_entry['route'] == "/#/workspaces/1/calendar"  # nopep8
        assert sidebar_entry['hexcolor'] == "#757575"
        assert sidebar_entry['fa_icon'] == "calendar"

    def test_api__get_user_workspaces__err_403__unallowed_user(self):
        """
        Check obtain all workspaces reachables for one user
        with another non-admin user auth.
        """
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
        """
        Check obtain all workspaces reachables for one user
        without correct user auth (user unregistered).
        """
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

    def test_api__get_user_workspaces__err_400__user_does_not_exist(self):
        """
        Check obtain all workspaces reachables for one user who does
        not exist
        with a correct user auth.
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/users/5/workspaces', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()


class TestUserEndpoint(FunctionalTest):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/v2/users/{user_id}
    """
    fixtures = [BaseFixture]

    def test_api__get_user__ok_200__admin(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['created']
        assert res['is_active'] is True
        assert res['profile'] == 'users'
        assert res['email'] == 'test@test.test'
        assert res['public_name'] == 'bob'
        assert res['timezone'] == 'Europe/Paris'

    def test_api__get_user__ok_200__user_itself(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'pass'
            )
        )
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['created']
        assert res['is_active'] is True
        assert res['profile'] == 'users'
        assert res['email'] == 'test@test.test'
        assert res['public_name'] == 'bob'
        assert res['timezone'] == 'Europe/Paris'

    def test_api__get_user__err_403__other_normal_user(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email='test2@test2.test2',
            password='pass',
            name='bob2',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test2@test2.test2',
                'pass'
            )
        )
        self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=403
        )


class TestSetEmailEndpoint(FunctionalTest):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/email
    """
    fixtures = [BaseFixture]

    def test_api__set_user_email__ok_200__admin(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['email'] == 'test@test.test'

        # Set password
        params = {
            'email': 'mysuperemail@email.fr',
            'loggedin_user_password': 'admin@admin.admin',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/email'.format(user_id),
            params=params,
            status=200,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['email'] == 'mysuperemail@email.fr'

    def test_api__set_user_email__err_403__admin_wrong_password(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['email'] == 'test@test.test'

        # Set password
        params = {
            'email': 'mysuperemail@email.fr',
            'loggedin_user_password': 'badpassword',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/email'.format(user_id),
            params=params,
            status=403,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['email'] == 'test@test.test'

    def test_api__set_user_email__err_400__admin_string_is_not_email(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['email'] == 'test@test.test'

        # Set password
        params = {
            'email': 'thatisnotandemail',
            'loggedin_user_password': 'admin@admin.admin',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/email'.format(user_id),
            params=params,
            status=400,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['email'] == 'test@test.test'

    def test_api__set_user_email__ok_200__user_itself(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'pass'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['email'] == 'test@test.test'

        # Set password
        params = {
            'email': 'mysuperemail@email.fr',
            'loggedin_user_password': 'pass',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/email'.format(user_id),
            params=params,
            status=200,
        )
        self.testapp.authorization = (
            'Basic',
            (
                'mysuperemail@email.fr',
                'pass'
            )
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['email'] == 'mysuperemail@email.fr'

    def test_api__set_user_email__err_403__other_normal_user(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email='test2@test2.test2',
            password='pass',
            name='bob2',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'pass'
            )
        )
        # Set password
        params = {
            'email': 'mysuperemail@email.fr',
            'loggedin_user_password': 'test2@test2.test2',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/email'.format(user_id),
            params=params,
            status=403,
        )


class TestSetPasswordEndpoint(FunctionalTest):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/password
    """
    fixtures = [BaseFixture]

    def test_api__set_user_password__ok_200__admin(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        user = uapi.get_one(user_id)
        assert user.validate_password('pass')
        assert not user.validate_password('mynewpassword')
        # Set password
        params = {
            'new_password': 'mynewpassword',
            'new_password2': 'mynewpassword',
            'loggedin_user_password': 'admin@admin.admin',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/password'.format(user_id),
            params=params,
            status=204,
        )
        # Check After
        user = uapi.get_one(user_id)
        assert not user.validate_password('pass')
        assert user.validate_password('mynewpassword')

    def test_api__set_user_password__err_403__admin_wrong_password(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        user = uapi.get_one(user_id)
        assert user.validate_password('pass')
        assert not user.validate_password('mynewpassword')
        # Set password
        params = {
            'new_password': 'mynewpassword',
            'new_password2': 'mynewpassword',
            'loggedin_user_password': 'wrongpassword',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/password'.format(user_id),
            params=params,
            status=403,
        )
        # Check After
        user = uapi.get_one(user_id)
        assert user.validate_password('pass')
        assert not user.validate_password('mynewpassword')

    def test_api__set_user_password__err_400__admin_passwords_do_not_match(self):  # nopep8
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        user = uapi.get_one(user_id)
        assert user.validate_password('pass')
        assert not user.validate_password('mynewpassword')
        assert not user.validate_password('mynewpassword2')
        # Set password
        params = {
            'new_password': 'mynewpassword',
            'new_password2': 'mynewpassword2',
            'loggedin_user_password': 'admin@admin.admin',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/password'.format(user_id),
            params=params,
            status=400,
        )
        # Check After
        user = uapi.get_one(user_id)
        assert user.validate_password('pass')
        assert not user.validate_password('mynewpassword')
        assert not user.validate_password('mynewpassword2')

    def test_api__set_user_password__ok_200__user_itself(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'pass'
            )
        )
        # check before
        user = uapi.get_one(user_id)
        assert user.validate_password('pass')
        assert not user.validate_password('mynewpassword')
        # Set password
        params = {
            'new_password': 'mynewpassword',
            'new_password2': 'mynewpassword',
            'loggedin_user_password': 'pass',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/password'.format(user_id),
            params=params,
            status=204,
        )
        # Check After
        user = uapi.get_one(user_id)
        assert not user.validate_password('pass')
        assert user.validate_password('mynewpassword')

    def test_api__set_user_email__err_403__other_normal_user(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email='test2@test2.test2',
            password='pass',
            name='bob2',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'pass'
            )
        )
        # Set password
        params = {
            'email': 'mysuperemail@email.fr',
            'loggedin_user_password': 'test2@test2.test2',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/email'.format(user_id),
            params=params,
            status=403,
        )


class TestSetUserInfoEndpoint(FunctionalTest):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}
    """
    fixtures = [BaseFixture]

    def test_api__set_user_info__ok_200__admin(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['public_name'] == 'bob'
        assert res['timezone'] == 'Europe/Paris'
        # Set params
        params = {
            'public_name': 'updated',
            'timezone': 'Europe/London',
        }
        self.testapp.put_json(
            '/api/v2/users/{}'.format(user_id),
            params=params,
            status=200,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['public_name'] == 'updated'
        assert res['timezone'] == 'Europe/London'

    def test_api__set_user_info__ok_200__user_itself(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'pass',
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['public_name'] == 'bob'
        assert res['timezone'] == 'Europe/Paris'
        # Set params
        params = {
            'public_name': 'updated',
            'timezone': 'Europe/London',
        }
        self.testapp.put_json(
            '/api/v2/users/{}'.format(user_id),
            params=params,
            status=200,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['public_name'] == 'updated'
        assert res['timezone'] == 'Europe/London'

    def test_api__set_user_email__err_403__other_normal_user(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email='test2@test2.test2',
            password='pass',
            name='test',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test2@test2.test2',
                'pass',
            )
        )
        # Set params
        params = {
            'public_name': 'updated',
            'timezone': 'Europe/London',
        }
        self.testapp.put_json(
            '/api/v2/users/{}'.format(user_id),
            params=params,
            status=403,
        )


class TestSetUserProfilEndpoint(FunctionalTest):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/profile
    """
    fixtures = [BaseFixture]

    def test_api__set_user_info__ok_200__admin(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['profile'] == 'users'
        # Set params
        params = {
            'profile': 'administrators',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/profile'.format(user_id),
            params=params,
            status=204,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['profile'] == 'administrators'

    def test_api__set_user_info__err_403__user_itself(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'pass',
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['profile'] == 'users'
        # Set params
        params = {
            'profile': 'administrators',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/profile'.format(user_id),
            params=params,
            status=403,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['profile'] == 'users'

    def test_api__set_user_email__err_403__other_normal_user(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email='test2@test2.test2',
            password='pass',
            name='test',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test2@test2.test2',
                'pass',
            )
        )
        # Set params
        params = {
            'profile': 'administrators',
        }
        self.testapp.put_json(
            '/api/v2/users/{}/profile'.format(user_id),
            params=params,
            status=403,
        )


class TestSetUserEnableDisableEndpoints(FunctionalTest):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/enable
    and PUT /api/v2/users/{user_id}/disable
    """
    fixtures = [BaseFixture]

    def test_api_enable_user__ok_200__admin(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.disable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['is_active'] is False
        self.testapp.put_json(
            '/api/v2/users/{}/enable'.format(user_id),
            status=204,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['is_active'] is True

    def test_api_disable_user__ok_200__admin(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.enable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['is_active'] is True
        self.testapp.put_json(
            '/api/v2/users/{}/disable'.format(user_id),
            status=204,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['is_active'] is False

    def test_api_enable_user__err_403__other_account(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email='test2@test2.test2',
            password='pass',
            name='test2',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.disable(test_user, do_save=True)
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test2@test2.test2',
                'pass'
            )
        )
        self.testapp.put_json(
            '/api/v2/users/{}/enable'.format(user_id),
            status=403,
        )

    def test_api_disable_user__err_403__other_account(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email='test2@test2.test2',
            password='pass',
            name='test2',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.enable(test_user, do_save=True)
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test2@test2.test2',
                'pass'
            )
        )
        self.testapp.put_json(
            '/api/v2/users/{}/disable'.format(user_id),
            status=403,
        )

    def test_api_disable_user__ok_200__user_itself(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        test_user = uapi.create_user(
            email='test@test.test',
            password='pass',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        uapi.enable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'pass'
            )
        )
        # check before
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['is_active'] is True
        self.testapp.put_json(
            '/api/v2/users/{}/disable'.format(user_id),
            status=403,
        )
        # Check After
        res = self.testapp.get(
            '/api/v2/users/{}'.format(user_id),
            status=200
        )
        res = res.json_body
        assert res['user_id'] == user_id
        assert res['is_active'] is True
