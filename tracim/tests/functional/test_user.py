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

    @pytest.mark.xfail(reason='List of item in path bug need to be fixed')
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

        content_id_str = '[{0},{1},{2},{3}]'.format(
            selected_contents_id[0],
            selected_contents_id[1],
            selected_contents_id[2],
            selected_contents_id[3],
        )
        params = {
            'contents_ids': content_id_str
        }
        res = self.testapp.get(
            '/api/v2/users/1/workspaces/{}/contents/read_status'.format(workspace.workspace_id),  # nopep8
            status=200,
            params=params
        )
        res = res.json_body
        assert len(res) == 4
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
