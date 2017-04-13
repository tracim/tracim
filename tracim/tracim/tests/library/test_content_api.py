# -*- coding: utf-8 -*-
import datetime

from nose.tools import eq_, ok_
from nose.tools import raises

import transaction

from tracim.lib.content import compare_content_for_sorting_by_type_and_name
from tracim.lib.content import ContentApi
from tracim.lib.group import GroupApi
from tracim.lib.user import UserApi
from tracim.lib.workspace import RoleApi
from tracim.lib.workspace import WorkspaceApi
from tracim.model import DBSession, new_revision, User

from tracim.model.auth import Group

from tracim.model.data import ActionDescription, ContentRevisionRO, Workspace
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import UserRoleInWorkspace
from tracim.fixtures.users_and_groups import Test as TestFixture
from tracim.tests import TestStandard
from tracim.tests import BaseTest


class TestContentApi(BaseTest, TestStandard):

    def test_compare_content_for_sorting_by_type(self):
        c1 = Content()
        c1.label = ''
        c1.type = 'file'

        c2 = Content()
        c2.label = ''
        c2.type = 'folder'

        c11 = c1

        eq_(1, compare_content_for_sorting_by_type_and_name(c1, c2))
        eq_(-1, compare_content_for_sorting_by_type_and_name(c2, c1))
        eq_(0, compare_content_for_sorting_by_type_and_name(c1, c11))

    def test_compare_content_for_sorting_by_label(self):
        c1 = Content()
        c1.label = 'bbb'
        c1.type = 'file'

        c2 = Content()
        c2.label = 'aaa'
        c2.type = 'file'

        c11 = c1

        eq_(1, compare_content_for_sorting_by_type_and_name(c1, c2))
        eq_(-1, compare_content_for_sorting_by_type_and_name(c2, c1))
        eq_(0, compare_content_for_sorting_by_type_and_name(c1, c11))

    def test_sort_by_label_or_filename(self):
        c1 = Content()
        c1.label = 'ABCD'
        c1.type = 'file'

        c2 = Content()
        c2.label = ''
        c2.type = 'file'
        c2.file_name = 'AABC'

        c3 = Content()
        c3.label = 'BCDE'
        c3.type = 'file'

        items = [c1, c2, c3]
        sorteds = ContentApi.sort_content(items)

        eq_(sorteds[0], c2)
        eq_(sorteds[1], c1)
        eq_(sorteds[2], c3)

    def test_sort_by_content_type(self):
        c1 = Content()
        c1.label = 'AAAA'
        c1.type = 'file'

        c2 = Content()
        c2.label = 'BBBB'
        c2.type = 'folder'

        items = [c1, c2]
        sorteds = ContentApi.sort_content(items)

        eq_(sorteds[0], c2,
            'value is {} instead of {}'.format(sorteds[0].content_id,
                                               c2.content_id))
        eq_(sorteds[1], c1,
            'value is {} instead of {}'.format(sorteds[1].content_id,
                                               c1.content_id))

    def test_delete(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)
        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)

        api = ContentApi(user)
        item = api.create(ContentType.Folder, workspace, None,
                          'not_deleted', True)
        item2 = api.create(ContentType.Folder, workspace, None,
                           'to_delete', True)
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace = WorkspaceApi(user).get_one(wid)
        api = ContentApi(user)
        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

        items = api.get_all(None, ContentType.Any, workspace)
        with new_revision(items[0]):
            api.delete(items[0])
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace = WorkspaceApi(user).get_one(wid)
        api = ContentApi(user)
        items = api.get_all(None, ContentType.Any, workspace)
        eq_(1, len(items))
        transaction.commit()

        # Test that the item is still available if "show deleted" is activated
        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace = WorkspaceApi(user).get_one(wid)
        api = ContentApi(user, show_deleted=True)
        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))


    def test_archive(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)
        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)

        api = ContentApi(user)
        item = api.create(ContentType.Folder, workspace, None,
                          'not_archived', True)
        item2 = api.create(ContentType.Folder, workspace, None,
                           'to_archive', True)
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace = WorkspaceApi(user).get_one(wid)
        api = ContentApi(user)

        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

        items = api.get_all(None, ContentType.Any, workspace)
        with new_revision(items[0]):
            api.archive(items[0])
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace = WorkspaceApi(user).get_one(wid)
        api = ContentApi(user)

        items = api.get_all(None, ContentType.Any, workspace)
        eq_(1, len(items))
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace = WorkspaceApi(user).get_one(wid)
        api = ContentApi(user)

        # Test that the item is still available if "show deleted" is activated
        api = ContentApi(None, show_archived=True)
        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

    def test_get_all_with_filter(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)
        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)

        api = ContentApi(user)
        item = api.create(ContentType.Folder, workspace, None,
                          'thefolder', True)
        item2 = api.create(ContentType.File, workspace, None, 'thefile', True)
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace = WorkspaceApi(user).get_one(wid)
        api = ContentApi(user)

        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

        items2 = api.get_all(None, ContentType.File, workspace)
        eq_(1, len(items2))
        eq_('thefile', items2[0].label)

        items3 = api.get_all(None, ContentType.Folder, workspace)
        eq_(1, len(items3))
        eq_('thefolder', items3[0].label)

    def test_get_all_with_parent_id(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)
        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)

        api = ContentApi(user)
        item = api.create(
            ContentType.Folder,
            workspace,
            None,
            'parent',
            do_save=True,
        )
        item2 = api.create(
            ContentType.File,
            workspace,
            item,
            'file1',
            do_save=True,
        )
        item3 = api.create(
            ContentType.File,
            workspace,
            None,
            'file2',
            do_save=True,
        )
        parent_id = item.content_id
        child_id = item2.content_id
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace = WorkspaceApi(user).get_one(wid)
        api = ContentApi(user)

        items = api.get_all(None, ContentType.Any, workspace)
        eq_(3, len(items))

        items2 = api.get_all(parent_id, ContentType.File, workspace)
        eq_(1, len(items2))
        eq_(child_id, items2[0].content_id)

    @raises(ValueError)
    def test_set_status_unknown_status(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)

        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)
        api = ContentApi(user)
        c = api.create(ContentType.Folder, workspace, None, 'parent', True)
        with new_revision(c):
            api.set_status(c, 'unknown-status')

    def test_set_status_ok(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)

        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)
        api = ContentApi(user)
        c = api.create(ContentType.Folder, workspace, None, 'parent', True)
        with new_revision(c):
            for new_status in ['open', 'closed-validated', 'closed-unvalidated',
                               'closed-deprecated']:
                api.set_status(c, new_status)

                eq_(new_status, c.status)
                eq_(ActionDescription.STATUS_UPDATE, c.revision_type)

    def test_create_comment_ok(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)

        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)

        api = ContentApi(user)
        p = api.create(ContentType.Page, workspace, None, 'this_is_a_page')
        c = api.create_comment(workspace, p, 'this is the comment', True)

        eq_(Content, c.__class__)
        eq_(p.content_id, c.parent_id)
        eq_(user, c.owner)
        eq_(workspace, c.workspace)
        eq_(ContentType.Comment, c.type)
        eq_('this is the comment', c.description)
        eq_('', c.label)
        eq_(ActionDescription.COMMENT, c.revision_type)


    def test_mark_read__workspace(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]
        user_a = uapi.create_user(email='this.is@user',
                                  groups=groups, save_now=True)
        user_b = uapi.create_user(email='this.is@another.user',
                                  groups=groups, save_now=True)

        wapi = WorkspaceApi(user_a)
        workspace1 = wapi.create_workspace(
            'test workspace n°1',
            save_now=True)
        workspace2 = wapi.create_workspace(
            'test workspace n°2',
            save_now=True)

        role_api1 = RoleApi(user_a)
        role_api1.create_one(user_b, workspace1, UserRoleInWorkspace.READER,
                            False)

        role_api2 = RoleApi(user_a)
        role_api2.create_one(user_b, workspace2, UserRoleInWorkspace.READER,
                             False)

        cont_api_a = ContentApi(user_a)
        cont_api_b = ContentApi(user_b)


        # Creates page_1 & page_2 in workspace 1
        #     and page_3 & page_4 in workspace 2
        page_1 = cont_api_a.create(ContentType.Page, workspace1, None,
                                   'this is a page', do_save=True)
        page_2 = cont_api_a.create(ContentType.Page, workspace1, None,
                                   'this is page1', do_save=True)
        page_3 = cont_api_a.create(ContentType.Thread, workspace2, None,
                                   'this is page2', do_save=True)
        page_4 = cont_api_a.create(ContentType.File, workspace2, None,
                                   'this is page3', do_save=True)

        for rev in page_1.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_2.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        # Set as read the workspace n°1
        cont_api_b.mark_read__workspace(workspace=workspace1)

        for rev in page_1.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_2.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        # Set as read the workspace n°2
        cont_api_b.mark_read__workspace(workspace=workspace2)

        for rev in page_1.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_2.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b in rev.read_by.keys(), True)

    def test_mark_read(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]
        user_a = uapi.create_user(email='this.is@user',
                                 groups=groups, save_now=True)
        user_b = uapi.create_user(email='this.is@another.user',
                                 groups=groups, save_now=True)

        wapi = WorkspaceApi(user_a)
        workspace = wapi.create_workspace(
            'test workspace',
            save_now=True)

        role_api = RoleApi(user_a)
        role_api.create_one(user_b, workspace, UserRoleInWorkspace.READER, False)
        cont_api_a = ContentApi(user_a)
        cont_api_b = ContentApi(user_b)

        page_1 = cont_api_a.create(ContentType.Page, workspace, None,
                                   'this is a page', do_save=True)

        for rev in page_1.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        cont_api_b.mark_read(page_1)

        for rev in page_1.revisions:
            eq_(user_b in rev.read_by.keys(), True)


    def test_mark_read__all(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]
        user_a = uapi.create_user(email='this.is@user',
                                 groups=groups, save_now=True)
        user_b = uapi.create_user(email='this.is@another.user',
                                 groups=groups, save_now=True)

        wapi = WorkspaceApi(user_a)
        workspace = wapi.create_workspace(
            'test workspace',
            save_now=True)

        role_api = RoleApi(user_a)
        role_api.create_one(user_b, workspace, UserRoleInWorkspace.READER, False)
        cont_api_a = ContentApi(user_a)
        cont_api_b = ContentApi(user_b)

        page_2 = cont_api_a.create(ContentType.Page, workspace, None, 'this is page1', do_save=True)
        page_3 = cont_api_a.create(ContentType.Thread, workspace, None, 'this is page2', do_save=True)
        page_4 = cont_api_a.create(ContentType.File, workspace, None, 'this is page3', do_save=True)

        for rev in page_2.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        DBSession.refresh(page_2)
        DBSession.refresh(page_3)
        DBSession.refresh(page_4)

        cont_api_b.mark_read__all()

        for rev in page_2.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b in rev.read_by.keys(), True)





    def test_update(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)

        workspace = WorkspaceApi(user1).create_workspace('test workspace',
                                                        save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_user()
        user2.email = 'this.is@another.user'
        uapi.save(user2)

        RoleApi(user1).create_one(user2, workspace,
                                  UserRoleInWorkspace.CONTENT_MANAGER,
                                  with_notif=False,
                                  flush=True)

        # Test starts here

        api = ContentApi(user1)
        p = api.create(ContentType.Page, workspace, None,
                       'this_is_a_page', True)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = WorkspaceApi(user1).get_one(wid)
        api = ContentApi(user1)

        content = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = UserApi(None).get_one(u2id)
        api2 = ContentApi(u2)
        content2 = api2.get_one(pcid, ContentType.Any, workspace)
        with new_revision(content2):
            api2.update_content(content2, 'this is an updated page', 'new content')
        api2.save(content2)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = WorkspaceApi(user1).get_one(wid)
        api = ContentApi(user1)

        updated = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u2id, updated.owner_id,
            'the owner id should be {} (found {})'.format(u2id,
                                                          updated.owner_id))
        eq_('this is an updated page', updated.label)
        eq_('new content', updated.description)
        eq_(ActionDescription.EDITION, updated.revision_type)

    def test_update_file_data(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)

        workspace = WorkspaceApi(user1).create_workspace('test workspace',
                                                        save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_user()
        user2.email = 'this.is@another.user'
        uapi.save(user2)

        RoleApi(user1).create_one(user2, workspace,
                                  UserRoleInWorkspace.CONTENT_MANAGER,
                                  with_notif=True,
                                  flush=True)

        # Test starts here

        api = ContentApi(user1)
        p = api.create(ContentType.File, workspace, None,
                       'this_is_a_page', True)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        api.save(p)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = WorkspaceApi(user1).get_one(wid)
        api = ContentApi(user1)

        content = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = UserApi(None).get_one(u2id)
        api2 = ContentApi(u2)
        content2 = api2.get_one(pcid, ContentType.Any, workspace)
        with new_revision(content2):
            api2.update_file_data(content2, 'index.html', 'text/html',
                                  b'<html>hello world</html>')
        api2.save(content2)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = WorkspaceApi(user1).get_one(wid)

        updated = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u2id, updated.owner_id,
            'the owner id should be {} (found {})'.format(u2id,
                                                          updated.owner_id))
        eq_('this_is_a_page.html', updated.file_name)
        eq_('text/html', updated.file_mimetype)
        eq_(b'<html>hello world</html>', updated.file_content)
        eq_(ActionDescription.REVISION, updated.revision_type)

    def test_archive_unarchive(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)
        u1id = user1.user_id

        workspace = WorkspaceApi(user1).create_workspace('test workspace',
                                                        save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_user()
        user2.email = 'this.is@another.user'
        uapi.save(user2)

        RoleApi(user1).create_one(user2, workspace,
                                  UserRoleInWorkspace.CONTENT_MANAGER,
                                  with_notif=True,
                                  flush=True)

        # show archived is used at the top end of the test
        api = ContentApi(user1, show_archived=True)
        p = api.create(ContentType.File, workspace, None,
                       'this_is_a_page', True)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        ####

        # refresh after commit
        user1 = UserApi(None).get_one(u1id)
        workspace = WorkspaceApi(user1).get_one(wid)

        content = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = UserApi(None).get_one(u2id)
        api2 = ContentApi(u2, show_archived=True)
        content2 = api2.get_one(pcid, ContentType.Any, workspace)
        with new_revision(content2):
            api2.archive(content2)
        api2.save(content2)
        transaction.commit()

        # refresh after commit
        user1 = UserApi(None).get_one(u1id)
        workspace = WorkspaceApi(user1).get_one(wid)
        u2 = UserApi(None).get_one(u2id)
        api = ContentApi(user1, show_archived=True)
        api2 = ContentApi(u2, show_archived=True)

        updated = api2.get_one(pcid, ContentType.Any, workspace)
        eq_(u2id, updated.owner_id,
            'the owner id should be {} (found {})'.format(u2id,
                                                          updated.owner_id))
        eq_(True, updated.is_archived)
        eq_(ActionDescription.ARCHIVING, updated.revision_type)

        ####

        updated2 = api.get_one(pcid, ContentType.Any, workspace)
        with new_revision(updated):
            api.unarchive(updated)
        api.save(updated2)
        eq_(False, updated2.is_archived)
        eq_(ActionDescription.UNARCHIVING, updated2.revision_type)
        eq_(u1id, updated2.owner_id)

    def test_delete_undelete(self):
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)
        u1id = user1.user_id

        workspace = WorkspaceApi(user1).create_workspace('test workspace',
                                                        save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_user()
        user2.email = 'this.is@another.user'
        uapi.save(user2)

        RoleApi(user1).create_one(user2, workspace,
                                  UserRoleInWorkspace.CONTENT_MANAGER,
                                  with_notif=True,
                                  flush=True)

        # show archived is used at the top end of the test
        api = ContentApi(user1, show_deleted=True)
        p = api.create(ContentType.File, workspace, None,
                       'this_is_a_page', True)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        ####
        user1 = UserApi(None).get_one(u1id)
        workspace = WorkspaceApi(user1).get_one(wid)

        content = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = UserApi(None).get_one(u2id)
        api2 = ContentApi(u2, show_deleted=True)
        content2 = api2.get_one(pcid, ContentType.Any, workspace)
        with new_revision(content2):
            api2.delete(content2)
        api2.save(content2)
        transaction.commit()

        ####

        user1 = UserApi(None).get_one(u1id)
        workspace = WorkspaceApi(user1).get_one(wid)
        # show archived is used at the top end of the test
        api = ContentApi(user1, show_deleted=True)
        u2 = UserApi(None).get_one(u2id)
        api2 = ContentApi(u2, show_deleted=True)

        updated = api2.get_one(pcid, ContentType.Any, workspace)
        eq_(u2id, updated.owner_id,
            'the owner id should be {} (found {})'.format(u2id,
                                                          updated.owner_id))
        eq_(True, updated.is_deleted)
        eq_(ActionDescription.DELETION, updated.revision_type)

        ####

        updated2 = api.get_one(pcid, ContentType.Any, workspace)
        with new_revision(updated2):
            api.undelete(updated2)
        api.save(updated2)
        eq_(False, updated2.is_deleted)
        eq_(ActionDescription.UNDELETION, updated2.revision_type)
        eq_(u1id, updated2.owner_id)

    def test_search_in_label(self):
        # HACK - D.A. - 2015-03-09
        # This test is based on a bug which does NOT return results found
        # at root of a workspace (eg a folder)
        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)

        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)

        api = ContentApi(user)
        a = api.create(ContentType.Folder, workspace, None,
                       'this is randomized folder', True)
        p = api.create(ContentType.Page, workspace, a,
                       'this is randomized label content', True)

        with new_revision(p):
            p.description = 'This is some amazing test'

        api.save(p)
        original_id = p.content_id

        res = api.search(['randomized'])
        eq_(1, len(res.all()))
        item = res.all()[0]
        eq_(original_id, item.content_id)

    def test_search_in_description(self):
        # HACK - D.A. - 2015-03-09
        # This test is based on a bug which does NOT return results found
        # at root of a workspace (eg a folder)

        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)

        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)

        api = ContentApi(user)
        a = api.create(ContentType.Folder, workspace, None,
                       'this is randomized folder', True)
        p = api.create(ContentType.Page, workspace, a,
                       'this is dummy label content', True)

        with new_revision(p):
            p.description = 'This is some amazing test'

        api.save(p)
        original_id = p.content_id

        res = api.search(['dummy'])
        eq_(1, len(res.all()))
        item = res.all()[0]
        eq_(original_id, item.content_id)

    def test_search_in_label_or_description(self):
        # HACK - D.A. - 2015-03-09
        # This test is based on a bug which does NOT return results found
        # at root of a workspace (eg a folder)

        uapi = UserApi(None)
        groups = [GroupApi(None).get_one(Group.TIM_USER),
                  GroupApi(None).get_one(Group.TIM_MANAGER),
                  GroupApi(None).get_one(Group.TIM_ADMIN)]

        user = uapi.create_user(email='this.is@user',
                                groups=groups, save_now=True)

        workspace = WorkspaceApi(user).create_workspace('test workspace',
                                                        save_now=True)


        api = ContentApi(user)

        a = api.create(ContentType.Folder, workspace, None,
                       'this is randomized folder', True)
        p1 = api.create(ContentType.Page, workspace, a,
                        'this is dummy label content', True)
        p2 = api.create(ContentType.Page, workspace, a, 'Hey ! Jon !', True)

        with new_revision(p1):
            p1.description = 'This is some amazing test'

        with new_revision(p2):
            p2.description = 'What\'s up ?'

        api.save(p1)
        api.save(p2)

        id1 = p1.content_id
        id2 = p2.content_id

        eq_(1, DBSession.query(Workspace).filter(Workspace.label == 'test workspace').count())
        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'this is randomized folder').count())
        eq_(2, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'this is dummy label content').count())
        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.description == 'This is some amazing test').count())
        eq_(2, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'Hey ! Jon !').count())
        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.description == 'What\'s up ?').count())

        res = api.search(['dummy', 'jon'])
        eq_(2, len(res.all()))

        eq_(True, id1 in [o.content_id for o in res.all()])
        eq_(True, id2 in [o.content_id for o in res.all()])

    def test_unit__search_exclude_content_under_deleted_or_archived_parents__ok(self):
        admin = DBSession.query(User).filter(User.email == 'admin@admin.admin').one()
        workspace = self._create_workspace_and_test('workspace_1', admin)
        folder_1 = self._create_content_and_test('folder_1', workspace=workspace, type=ContentType.Folder)
        folder_2 = self._create_content_and_test('folder_2', workspace=workspace, type=ContentType.Folder)
        page_1 = self._create_content_and_test('foo', workspace=workspace, type=ContentType.Page, parent=folder_1)
        page_2 = self._create_content_and_test('bar', workspace=workspace, type=ContentType.Page, parent=folder_2)

        api = ContentApi(admin)

        foo_result = api.search(['foo']).all()
        eq_(1, len(foo_result))
        ok_(page_1 in foo_result)

        bar_result = api.search(['bar']).all()
        eq_(1, len(bar_result))
        ok_(page_2 in bar_result)

        with new_revision(folder_1):
            api.delete(folder_1)
        with new_revision(folder_2):
            api.archive(folder_2)

        # Actually ContentApi.search don't filter it
        foo_result = api.search(['foo']).all()
        eq_(1, len(foo_result))
        ok_(page_1 in foo_result)

        bar_result = api.search(['bar']).all()
        eq_(1, len(bar_result))
        ok_(page_2 in bar_result)

        # ContentApi offer exclude_unavailable method to do it
        foo_result = api.search(['foo']).all()
        api.exclude_unavailable(foo_result)
        eq_(0, len(foo_result))

        bar_result = api.search(['bar']).all()
        api.exclude_unavailable(bar_result)
        eq_(0, len(bar_result))


class TestContentApiSecurity(TestStandard):
    fixtures = [TestFixture, ]

    def test_unit__cant_get_non_access_content__ok__nominal_case(self):
        admin = DBSession.query(User)\
            .filter(User.email == 'admin@admin.admin').one()
        bob = DBSession.query(User)\
            .filter(User.email == 'bob@fsf.local').one()

        bob_workspace = WorkspaceApi(bob).create_workspace(
            'bob_workspace',
            save_now=True,
        )
        admin_workspace = WorkspaceApi(admin).create_workspace(
            'admin_workspace',
            save_now=True,
        )

        bob_page = ContentApi(bob).create(
            content_type=ContentType.Page,
            workspace=bob_workspace,
            label='bob_page',
            do_save=True,
        )

        admin_page = ContentApi(bob).create(
            content_type=ContentType.Page,
            workspace=admin_workspace,
            label='admin_page',
            do_save=True,
        )

        bob_viewable = ContentApi(bob).get_all()
        eq_(1, len(bob_viewable), 'Bob should view only one content')
        eq_(
            'bob_page',
            bob_viewable[0].label,
            'Bob should not view "{0}" content'.format(
                bob_viewable[0].label,
            )
        )
