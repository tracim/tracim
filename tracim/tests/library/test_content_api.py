# -*- coding: utf-8 -*-

import transaction
import pytest

from tracim.config import CFG
from tracim.lib.core.content import compare_content_for_sorting_by_type_and_name
from tracim.lib.core.content import ContentApi
# TODO - G.M - 28-03-2018 - [GroupApi] Re-enable GroupApi
from tracim.lib.core.group import GroupApi
from tracim.lib.core.user import UserApi
from tracim.exceptions import SameValueError
# TODO - G.M - 28-03-2018 - [RoleApi] Re-enable RoleApi
from tracim.lib.core.workspace import RoleApi
# TODO - G.M - 28-03-2018 - [WorkspaceApi] Re-enable WorkspaceApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.models.revision_protection import new_revision
from tracim.models.auth import User
from tracim.models.auth import Group

from tracim.models.data import ActionDescription
from tracim.models.data import ContentRevisionRO
from tracim.models.data import Workspace
from tracim.models.data import Content
from tracim.models.data import ContentType
from tracim.models.data import UserRoleInWorkspace
from tracim.fixtures.users_and_groups import Test as FixtureTest
from tracim.tests import DefaultTest
from tracim.tests import eq_


class TestContentApi(DefaultTest):

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
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(current_user=None,session=self.session)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)
        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace('test workspace', save_now=True)
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        item = api.create(ContentType.Folder, workspace, None,
                          'not_deleted', True)
        item2 = api.create(ContentType.Folder, workspace, None,
                           'to_delete', True)
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

        items = api.get_all(None, ContentType.Any, workspace)
        with new_revision(
                session=self.session,
                tm=transaction.manager,
                content=items[0]
        ):
            api.delete(items[0])
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(
            current_user=user, 
            session=self.session,
            config=self.app_config,
        )
        items = api.get_all(None, ContentType.Any, workspace)
        eq_(1, len(items))
        transaction.commit()

        # Test that the item is still available if "show deleted" is activated
        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
            show_deleted=True,
        )
        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

    def test_archive(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(current_user=None, session=self.session)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        workspace = workspace_api.create_workspace(
            'test workspace',
            save_now=True
        )
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        item = api.create(ContentType.Folder, workspace, None,
                          'not_archived', True)
        item2 = api.create(ContentType.Folder, workspace, None,
                           'to_archive', True)
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()
        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        api = ContentApi(
            session=self.session,
            current_user=user,
            config=self.app_config,
        )

        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

        items = api.get_all(None, ContentType.Any, workspace)
        with new_revision(
                session=self.session,
                tm=transaction.manager,
                content=items[0],
        ):
            api.archive(items[0])
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(
            current_user=user, 
            session=self.session,
            config=self.app_config,
        )

        items = api.get_all(None, ContentType.Any, workspace)
        eq_(1, len(items))
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )

        # Test that the item is still available if "show deleted" is activated
        api = ContentApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
            show_archived=True,
        )
        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

    def test_get_all_with_filter(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(current_user=None, session=self.session)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True
        )
        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True
        )

        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        item = api.create(ContentType.Folder, workspace, None,
                          'thefolder', True)
        item2 = api.create(ContentType.File, workspace, None, 'thefile', True)
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(
            current_user=user, 
            session=self.session,
            config=self.app_config,
        )

        items = api.get_all(None, ContentType.Any, workspace)
        eq_(2, len(items))

        items2 = api.get_all(None, ContentType.File, workspace)
        eq_(1, len(items2))
        eq_('thefile', items2[0].label)

        items3 = api.get_all(None, ContentType.Folder, workspace)
        eq_(1, len(items3))
        eq_('thefolder', items3[0].label)

    def test_get_all_with_parent_id(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(current_user=None, session=self.session)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)
        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace('test workspace', save_now=True)
        api = ContentApi(
            current_user=user, 
            session=self.session,
            config=self.app_config,
        )
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
        workspace_api = WorkspaceApi(current_user=user, session=self.session)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )

        items = api.get_all(None, ContentType.Any, workspace)
        eq_(3, len(items))

        items2 = api.get_all(parent_id, ContentType.File, workspace)
        eq_(1, len(items2))
        eq_(child_id, items2[0].content_id)

    def test_set_status_unknown_status(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)

        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        api = ContentApi(
            current_user=user, 
            session=self.session,
            config=self.app_config,
        )
        c = api.create(ContentType.Folder, workspace, None, 'parent', True)
        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=c,
        ):
            with pytest.raises(ValueError):
                api.set_status(c, 'unknown-status')

    def test_set_status_ok(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)

        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        c = api.create(ContentType.Folder, workspace, None, 'parent', True)
        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=c,
        ):
            for new_status in ['open', 'closed-validated', 'closed-unvalidated',
                               'closed-deprecated']:
                api.set_status(c, new_status)

                eq_(new_status, c.status)
                eq_(ActionDescription.STATUS_UPDATE, c.revision_type)

    def test_create_comment_ok(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)

        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True
        )

        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
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

    def test_unit_copy_file_different_label_different_parent_ok(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(
            email='user1@user',
            groups=groups,
            save_now=True
        )
        user2 = uapi.create_minimal_user(
            email='user2@user',
            groups=groups,
            save_now=True
        )
        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        RoleApi(current_user=user, session=self.session).create_one(
            user2,
            workspace,
            UserRoleInWorkspace.WORKSPACE_MANAGER,
            with_notif=False
        )
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        foldera = api.create(
            ContentType.Folder,
            workspace,
            None,
            'folder a',
            True
        )
        with self.session.no_autoflush:
            text_file = api.create(
                content_type=ContentType.File,
                workspace=workspace,
                parent=foldera,
                label='test_file',
                do_save=False,
            )
            api.update_file_data(
                text_file,
                'test_file',
                'text/plain',
                b'test_content'
            )

        api.save(text_file, ActionDescription.CREATION)
        api2 = ContentApi(
            current_user=user2,
            session=self.session,
            config=self.app_config,
        )
        workspace2 = WorkspaceApi(
            current_user=user2,
            session=self.session,
        ).create_workspace(
            'test workspace2',
            save_now=True
        )
        folderb = api2.create(
            ContentType.Folder,
            workspace2,
            None,
            'folder b',
            True
        )

        api2.copy(
            item=text_file,
            new_parent=folderb,
            new_label='test_file_copy'
        )

        transaction.commit()
        text_file_copy = api2.get_one_by_label_and_parent(
            'test_file_copy',
            folderb,
        )

        assert text_file != text_file_copy
        assert text_file_copy.content_id != text_file.content_id
        assert text_file_copy.workspace_id == workspace2.workspace_id
        assert text_file_copy.depot_file.file.read() == text_file.depot_file.file.read()   # nopep8
        assert text_file_copy.depot_file.path != text_file.depot_file.path
        assert text_file_copy.label == 'test_file_copy'
        assert text_file_copy.type == text_file.type
        assert text_file_copy.parent.content_id == folderb.content_id
        assert text_file_copy.owner.user_id == user.user_id
        assert text_file_copy.description == text_file.description
        assert text_file_copy.file_extension == text_file.file_extension
        assert text_file_copy.file_mimetype == text_file.file_mimetype
        assert text_file_copy.revision_type == ActionDescription.COPY
        assert len(text_file_copy.revisions) == len(text_file.revisions) + 1

    def test_unit_copy_file__same_label_different_parent_ok(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(
            email='user1@user',
            groups=groups,
            save_now=True
        )
        user2 = uapi.create_minimal_user(
            email='user2@user',
            groups=groups,
            save_now=True
        )
        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        RoleApi(current_user=user, session=self.session).create_one(
            user2,
            workspace,
            UserRoleInWorkspace.WORKSPACE_MANAGER,
            with_notif=False
        )
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        foldera = api.create(
            ContentType.Folder,
            workspace,
            None,
            'folder a',
            True
        )
        with self.session.no_autoflush:
            text_file = api.create(
                content_type=ContentType.File,
                workspace=workspace,
                parent=foldera,
                label='test_file',
                do_save=False,
            )
            api.update_file_data(
                text_file,
                'test_file',
                'text/plain',
                b'test_content'
            )

        api.save(text_file, ActionDescription.CREATION)
        api2 = ContentApi(
            current_user=user2,
            session=self.session,
            config=self.app_config,
        )
        workspace2 = WorkspaceApi(
            current_user=user2,
            session=self.session
        ).create_workspace(
            'test workspace2',
            save_now=True
        )
        folderb = api2.create(
            ContentType.Folder,
            workspace2,
            None,
            'folder b',
            True
        )
        api2.copy(
            item=text_file,
            new_parent=folderb,
        )

        transaction.commit()
        text_file_copy = api2.get_one_by_label_and_parent(
            'test_file',
            folderb,
        )

        assert text_file != text_file_copy
        assert text_file_copy.content_id != text_file.content_id
        assert text_file_copy.workspace_id == workspace2.workspace_id
        assert text_file_copy.depot_file.file.read() == text_file.depot_file.file.read()  # nopep8
        assert text_file_copy.depot_file.path != text_file.depot_file.path
        assert text_file_copy.label == text_file.label
        assert text_file_copy.type == text_file.type
        assert text_file_copy.parent.content_id == folderb.content_id
        assert text_file_copy.owner.user_id == user.user_id
        assert text_file_copy.description == text_file.description
        assert text_file_copy.file_extension == text_file.file_extension
        assert text_file_copy.file_mimetype == text_file.file_mimetype
        assert text_file_copy.revision_type == ActionDescription.COPY
        assert len(text_file_copy.revisions) == len(text_file.revisions) + 1

    def test_unit_copy_file_different_label_same_parent_ok(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(
            email='user1@user',
            groups=groups,
            save_now=True,
        )
        user2 = uapi.create_minimal_user(
            email='user2@user',
            groups=groups,
            save_now=True
        )
        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True
        )
        RoleApi(current_user=user, session=self.session).create_one(
            user2, workspace,
            UserRoleInWorkspace.WORKSPACE_MANAGER,
            with_notif=False
        )
        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        foldera = api.create(
            ContentType.Folder,
            workspace,
            None,
            'folder a',
            True
        )
        with self.session.no_autoflush:
            text_file = api.create(
                content_type=ContentType.File,
                workspace=workspace,
                parent=foldera,
                label='test_file',
                do_save=False,
            )
            api.update_file_data(
                text_file,
                'test_file',
                'text/plain',
                b'test_content'
            )

        api.save(
            text_file,
            ActionDescription.CREATION
        )
        api2 = ContentApi(
            current_user=user2,
            session=self.session,
            config=self.app_config,
        )

        api2.copy(
            item=text_file,
            new_label='test_file_copy'
        )

        transaction.commit()
        text_file_copy = api2.get_one_by_label_and_parent(
            'test_file_copy',
            foldera,
        )

        assert text_file != text_file_copy
        assert text_file_copy.content_id != text_file.content_id
        assert text_file_copy.workspace_id == workspace.workspace_id
        assert text_file_copy.depot_file.file.read() == text_file.depot_file.file.read()  # nopep8
        assert text_file_copy.depot_file.path != text_file.depot_file.path
        assert text_file_copy.label == 'test_file_copy'
        assert text_file_copy.type == text_file.type
        assert text_file_copy.parent.content_id == foldera.content_id
        assert text_file_copy.owner.user_id == user.user_id
        assert text_file_copy.description == text_file.description
        assert text_file_copy.file_extension == text_file.file_extension
        assert text_file_copy.file_mimetype == text_file.file_mimetype
        assert text_file_copy.revision_type == ActionDescription.COPY
        assert len(text_file_copy.revisions) == len(text_file.revisions) + 1

    def test_mark_read__workspace(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user_a = uapi.create_minimal_user(email='this.is@user',
                                          groups=groups, save_now=True)
        user_b = uapi.create_minimal_user(email='this.is@another.user',
                                          groups=groups, save_now=True)

        wapi = WorkspaceApi(
            current_user=user_a,
            session=self.session,
        )
        workspace1 = wapi.create_workspace(
            'test workspace n°1',
            save_now=True)
        workspace2 = wapi.create_workspace(
            'test workspace n°2',
            save_now=True)

        role_api1 = RoleApi(
            current_user=user_a,
            session=self.session,
        )
        role_api1.create_one(
            user_b,
            workspace1,
            UserRoleInWorkspace.READER,
            False
        )

        role_api2 = RoleApi(
            current_user=user_b,
            session=self.session,
        )
        role_api2.create_one(user_b, workspace2, UserRoleInWorkspace.READER,
                             False)

        cont_api_a = ContentApi(
            current_user=user_a,
            session=self.session,
            config=self.app_config,
        )
        cont_api_b = ContentApi(
            current_user=user_b,
            session=self.session,
            config=self.app_config,
        )

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
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user_a = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True
        )
        user_b = uapi.create_minimal_user(
            email='this.is@another.user',
            groups=groups,
            save_now=True
        )

        wapi = WorkspaceApi(current_user=user_a, session=self.session)
        workspace_api = WorkspaceApi(
            current_user=user_a,
            session=self.session
        )
        workspace = wapi.create_workspace(
            'test workspace',
            save_now=True)

        role_api = RoleApi(
            current_user=user_a,
            session=self.session,
        )
        role_api.create_one(
            user_b,
            workspace,
            UserRoleInWorkspace.READER,
            False
        )
        cont_api_a = ContentApi(
            current_user=user_a,
            session=self.session,
            config=self.app_config,
        )
        cont_api_b = ContentApi(
            current_user=user_b,
            session=self.session,
            config=self.app_config,
        )

        page_1 = cont_api_a.create(ContentType.Page, workspace, None,
                                   'this is a page', do_save=True)

        for rev in page_1.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        cont_api_b.mark_read(page_1)

        for rev in page_1.revisions:
            eq_(user_b in rev.read_by.keys(), True)

    def test_mark_read__all(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(current_user=None, session=self.session)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user_a = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True
        )
        user_b = uapi.create_minimal_user(
            email='this.is@another.user',
            groups=groups,
            save_now=True
        )

        wapi = WorkspaceApi(
            current_user=user_a,
            session=self.session,
        )
        workspace = wapi.create_workspace(
            'test workspace',
            save_now=True)

        role_api = RoleApi(
            current_user=user_a,
            session=self.session,
        )
        role_api.create_one(
            user_b,
            workspace,
            UserRoleInWorkspace.READER,
            False
        )
        cont_api_a = ContentApi(
            current_user=user_a,
            session=self.session,
            config=self.app_config,
        )
        cont_api_b = ContentApi(
            current_user=user_b,
            session=self.session,
            config=self.app_config,
        )

        page_2 = cont_api_a.create(
            ContentType.Page,
            workspace,
            None,
            'this is page1',
            do_save=True
        )
        page_3 = cont_api_a.create(
            ContentType.Thread,
            workspace,
            None,
            'this is page2',
            do_save=True
        )
        page_4 = cont_api_a.create(
            ContentType.File,
            workspace,
            None,
            'this is page3',
            do_save=True
        )

        for rev in page_2.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        self.session.refresh(page_2)
        self.session.refresh(page_3)
        self.session.refresh(page_4)

        cont_api_b.mark_read__all()

        for rev in page_2.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b in rev.read_by.keys(), True)

    def test_update(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(current_user=None, session=self.session)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True
        )

        workspace_api = WorkspaceApi(current_user=user1, session=self.session)
        workspace = workspace_api.create_workspace(
            'test workspace',
            save_now=True
        )
        
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user('this.is@another.user')
        uapi.save(user2)

        RoleApi(
            current_user=user1,
            session=self.session
        ).create_one(
            user2,
            workspace,
            UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
            flush=True
        )

        # Test starts here

        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
        )

        p = api.create(ContentType.Page, workspace, None,
                       'this_is_a_page', True)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = WorkspaceApi(
            current_user=user1,
            session=self.session
        ).get_one(wid)
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
        )

        content = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        ).get_one(u2id)
        api2 = ContentApi(
            current_user=u2,
            session=self.session,
            config=self.app_config,
        )
        content2 = api2.get_one(pcid, ContentType.Any, workspace)
        with new_revision(
           session=self.session,
           tm=transaction.manager,
           content=content2,
        ):
            api2.update_content(
                content2,
                'this is an updated page',
                'new content'
            )
        api2.save(content2)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = WorkspaceApi(
            current_user=user1,
            session=self.session,
        ).get_one(wid)
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
        )

        updated = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u2id, updated.owner_id,
            'the owner id should be {} (found {})'.format(u2id,
                                                          updated.owner_id))
        eq_('this is an updated page', updated.label)
        eq_('new content', updated.description)
        eq_(ActionDescription.EDITION, updated.revision_type)

    def test_update_no_change(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True,
        )

        workspace = WorkspaceApi(
            current_user=user1,
            session=self.session,
        ).create_workspace(
            'test workspace',
            save_now=True
        )

        user2 = uapi.create_minimal_user('this.is@another.user')
        uapi.save(user2)

        RoleApi(
            current_user=user1,
            session=self.session
        ).create_one(
            user2,
            workspace,
            UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
            flush=True
        )
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
        )
        with self.session.no_autoflush:
            page = api.create(
                content_type=ContentType.Page,
                workspace=workspace,
                label="same_content",
                do_save=False
            )
            page.description = "Same_content_here"
        api.save(page, ActionDescription.CREATION, do_notify=True)
        transaction.commit()

        api2 = ContentApi(
            current_user=user2,
            session=self.session,
            config=self.app_config,
        )
        content2 = api2.get_one(page.content_id, ContentType.Any, workspace)
        with new_revision(
           session=self.session,
           tm=transaction.manager,
           content=content2,
        ):
            with pytest.raises(SameValueError):
                api2.update_content(
                    item=content2,
                    new_label='same_content',
                    new_content='Same_content_here'
                )
        api2.save(content2)
        transaction.commit()

    def test_update_file_data(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True
        )

        workspace_api = WorkspaceApi(current_user=user1, session=self.session)
        workspace = workspace_api.create_workspace(
            'test workspace',
            save_now=True
        )
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user('this.is@another.user')
        uapi.save(user2)

        RoleApi(
            current_user=user1,
            session=self.session,
        ).create_one(
            user2,
            workspace,
            UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=True,
            flush=True
        )

        # Test starts here
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
        )
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
        workspace_api2 = WorkspaceApi(current_user=user1, session=self.session)
        workspace = workspace_api2.get_one(wid)
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
        )

        content = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        ).get_one(u2id)
        api2 = ContentApi(
            current_user=u2,
            session=self.session,
            config=self.app_config,
        )
        content2 = api2.get_one(pcid, ContentType.Any, workspace)
        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=content2,
        ):
            api2.update_file_data(
                content2,
                'index.html',
                'text/html',
                b'<html>hello world</html>'
            )
        api2.save(content2)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = WorkspaceApi(
            current_user=user1,
            session=self.session,
        ).get_one(wid)

        updated = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u2id, updated.owner_id,
            'the owner id should be {} (found {})'.format(u2id,
                                                          updated.owner_id))
        eq_('this_is_a_page.html', updated.file_name)
        eq_('text/html', updated.file_mimetype)
        eq_(b'<html>hello world</html>', updated.depot_file.file.read())
        eq_(ActionDescription.REVISION, updated.revision_type)

    def test_update_no_change(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session,
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True,
        )

        workspace_api = WorkspaceApi(current_user=user1, session=self.session)
        workspace = workspace_api.create_workspace(
            'test workspace',
            save_now=True
        )

        user2 = uapi.create_minimal_user('this.is@another.user')
        uapi.save(user2)

        RoleApi(
            current_user=user1,
            session=self.session,
        ).create_one(
            user2,
            workspace,
            UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
            flush=True
        )
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
        )
        with self.session.no_autoflush:
            page = api.create(
                content_type=ContentType.Page,
                workspace=workspace,
                label="same_content",
                do_save=False
            )
            api.update_file_data(
                page,
                'index.html',
                'text/html',
                b'<html>Same Content Here</html>'
            )
        api.save(page, ActionDescription.CREATION, do_notify=True)
        transaction.commit()

        api2 = ContentApi(
            current_user=user2,
            session=self.session,
            config=self.app_config,
        )
        content2 = api2.get_one(page.content_id, ContentType.Any, workspace)
        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=content2,
        ):
            with pytest.raises(SameValueError):
                api2.update_file_data(
                    page,
                    'index.html',
                    'text/html',
                    b'<html>Same Content Here</html>'
                )
        api2.save(content2)
        transaction.commit()

    def test_archive_unarchive(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(current_user=None, session=self.session)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True
        )
        u1id = user1.user_id

        workspace_api = WorkspaceApi(current_user=user1, session=self.session)
        workspace = workspace_api.create_workspace(
            'test workspace',
            save_now=True
        )
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user('this.is@another.user')
        uapi.save(user2)

        RoleApi(
            current_user=user1,
            session=self.session
        ).create_one(
            user2,
            workspace,
            UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=True,
            flush=True
        )

        # show archived is used at the top end of the test
        api = ContentApi(
            current_user=user1,
            session=self.session,
            show_archived=True,
            config=self.app_config,
        )
        p = api.create(ContentType.File, workspace, None,
                       'this_is_a_page', True)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        ####

        # refresh after commit
        user1 = UserApi(
            current_user=None,
            config=self.app_config,
            session=self.session
        ).get_one(u1id)
        workspace = WorkspaceApi(
            current_user=user1,
            session=self.session
        ).get_one(wid)

        content = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2api = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        u2 = u2api.get_one(u2id)
        api2 = ContentApi(
            current_user=u2,
            session=self.session,
            config=self.app_config,
            show_archived=True,
        )
        content2 = api2.get_one(pcid, ContentType.Any, workspace)
        with new_revision(
                session=self.session,
                tm=transaction.manager,
                content=content2,
        ):
            api2.archive(content2)
        api2.save(content2)
        transaction.commit()

        # refresh after commit
        user1 = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        ).get_one(u1id)
        workspace = WorkspaceApi(
            current_user=user1,
            session=self.session,
        ).get_one(wid)
        u2 = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        ).get_one(u2id)
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
            show_archived=True,
        )
        api2 = ContentApi(
            current_user=u2,
            session=self.session,
            config=self.app_config,
            show_archived=True,
        )

        updated = api2.get_one(pcid, ContentType.Any, workspace)
        eq_(u2id, updated.owner_id,
            'the owner id should be {} (found {})'.format(u2id,
                                                          updated.owner_id))
        eq_(True, updated.is_archived)
        eq_(ActionDescription.ARCHIVING, updated.revision_type)

        ####

        updated2 = api.get_one(pcid, ContentType.Any, workspace)
        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=updated,

        ):
            api.unarchive(updated)
        api.save(updated2)
        eq_(False, updated2.is_archived)
        eq_(ActionDescription.UNARCHIVING, updated2.revision_type)
        eq_(u1id, updated2.owner_id)

    def test_delete_undelete(self):
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user1 = uapi.create_minimal_user(
            email='this.is@user',
            groups=groups,
            save_now=True
        )
        u1id = user1.user_id

        workspace_api = WorkspaceApi(current_user=user1, session=self.session)
        workspace = workspace_api.create_workspace(
            'test workspace',
            save_now=True
        )
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user('this.is@another.user')
        uapi.save(user2)

        RoleApi(
            current_user=user1,
            session=self.session
        ).create_one(
            user2,
            workspace,
            UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=True,
            flush=True
        )

        # show archived is used at the top end of the test
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
            show_deleted=True,
        )
        p = api.create(ContentType.File, workspace, None,
                       'this_is_a_page', True)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        ####
        user1 = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        ).get_one(u1id)
        workspace = WorkspaceApi(
            current_user=user1,
            session=self.session,
        ).get_one(wid)

        content = api.get_one(pcid, ContentType.Any, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        ).get_one(u2id)
        api2 = ContentApi(
            current_user=u2,
            session=self.session,
            config=self.app_config,
            show_deleted=True,
        )
        content2 = api2.get_one(pcid, ContentType.Any, workspace)
        with new_revision(
                session=self.session,
                tm=transaction.manager,
                content=content2,
        ):
            api2.delete(content2)
        api2.save(content2)
        transaction.commit()

        ####

        user1 = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        ).get_one(u1id)
        workspace = WorkspaceApi(
            current_user=user1,
            session=self.session,
        ).get_one(wid)
        # show archived is used at the top end of the test
        api = ContentApi(
            current_user=user1,
            session=self.session,
            config=self.app_config,
            show_deleted=True,
        )
        u2 = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        ).get_one(u2id)
        api2 = ContentApi(
            current_user=u2,
            session=self.session,
            config=self.app_config,
            show_deleted=True
        )

        updated = api2.get_one(pcid, ContentType.Any, workspace)
        eq_(u2id, updated.owner_id,
            'the owner id should be {} (found {})'.format(u2id,
                                                          updated.owner_id))
        eq_(True, updated.is_deleted)
        eq_(ActionDescription.DELETION, updated.revision_type)

        ####

        updated2 = api.get_one(pcid, ContentType.Any, workspace)
        with new_revision(
            tm=transaction.manager,
            session=self.session,
            content=updated2,
        ):
            api.undelete(updated2)
        api.save(updated2)
        eq_(False, updated2.is_deleted)
        eq_(ActionDescription.UNDELETION, updated2.revision_type)
        eq_(u1id, updated2.owner_id)

    def test_search_in_label(self):
        # HACK - D.A. - 2015-03-09
        # This test is based on a bug which does NOT return results found
        # at root of a workspace (eg a folder)
        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session,
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)

        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True
        )

        api = ContentApi(
            current_user=user, 
            session=self.session,
            config=self.app_config,

        )
        a = api.create(ContentType.Folder, workspace, None,
                       'this is randomized folder', True)
        p = api.create(ContentType.Page, workspace, a,
                       'this is randomized label content', True)

        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=p,
        ):
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

        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(
            current_user=None,
            session=self.session,
        )
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)

        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace(
            'test workspace',
            save_now=True,
        )

        api = ContentApi(
            current_user=user, 
            session=self.session,
            config=self.app_config,
        )
        a = api.create(ContentType.Folder, workspace, None,
                       'this is randomized folder', True)
        p = api.create(ContentType.Page, workspace, a,
                       'this is dummy label content', True)

        with new_revision(
            tm=transaction.manager,
            session=self.session,
            content=p,
        ):
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

        uapi = UserApi(
            session=self.session,
            config=self.app_config,
            current_user=None,
        )
        group_api = GroupApi(current_user=None, session=self.session)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]

        user = uapi.create_minimal_user(email='this.is@user',
                                        groups=groups, save_now=True)

        workspace = WorkspaceApi(
            current_user=user,
            session=self.session
        ).create_workspace('test workspace', save_now=True)

        api = ContentApi(
            current_user=user, 
            session=self.session,
            config=self.app_config,
        )
        a = api.create(ContentType.Folder, workspace, None,
                       'this is randomized folder', True)
        p1 = api.create(ContentType.Page, workspace, a,
                        'this is dummy label content', True)
        p2 = api.create(ContentType.Page, workspace, a, 'Hey ! Jon !', True)

        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=p1,
        ):
            p1.description = 'This is some amazing test'

        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=p2,
        ):
            p2.description = 'What\'s up ?'

        api.save(p1)
        api.save(p2)

        id1 = p1.content_id
        id2 = p2.content_id

        eq_(1, self.session.query(Workspace).filter(Workspace.label == 'test workspace').count())
        eq_(1, self.session.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'this is randomized folder').count())
        eq_(2, self.session.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'this is dummy label content').count())
        eq_(1, self.session.query(ContentRevisionRO).filter(ContentRevisionRO.description == 'This is some amazing test').count())
        eq_(2, self.session.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'Hey ! Jon !').count())
        eq_(1, self.session.query(ContentRevisionRO).filter(ContentRevisionRO.description == 'What\'s up ?').count())

        res = api.search(['dummy', 'jon'])
        eq_(2, len(res.all()))

        eq_(True, id1 in [o.content_id for o in res.all()])
        eq_(True, id2 in [o.content_id for o in res.all()])

    def test_unit__search_exclude_content_under_deleted_or_archived_parents__ok(self):  # nopep8
        admin = self.session.query(User)\
            .filter(User.email == 'admin@admin.admin').one()
        workspace = self._create_workspace_and_test(
            'workspace_1',
            admin
        )
        folder_1 = self._create_content_and_test(
            'folder_1',
            workspace=workspace,
            type=ContentType.Folder
        )
        folder_2 = self._create_content_and_test(
            'folder_2',
            workspace=workspace,
            type=ContentType.Folder
        )
        page_1 = self._create_content_and_test(
            'foo', workspace=workspace,
            type=ContentType.Page,
            parent=folder_1
        )
        page_2 = self._create_content_and_test(
            'bar',
            workspace=workspace,
            type=ContentType.Page,
            parent=folder_2
        )

        api = ContentApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )

        foo_result = api.search(['foo']).all()
        eq_(1, len(foo_result))
        assert page_1 in foo_result

        bar_result = api.search(['bar']).all()
        eq_(1, len(bar_result))
        assert page_2 in bar_result

        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=folder_1,
        ):
            api.delete(folder_1)
        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=folder_2,
        ):
            api.archive(folder_2)

        # Actually ContentApi.search don't filter it
        foo_result = api.search(['foo']).all()
        eq_(1, len(foo_result))
        assert page_1 in foo_result

        bar_result = api.search(['bar']).all()
        eq_(1, len(bar_result))
        assert page_2 in bar_result

        # ContentApi offer exclude_unavailable method to do it
        foo_result = api.search(['foo']).all()
        api.exclude_unavailable(foo_result)
        eq_(0, len(foo_result))

        bar_result = api.search(['bar']).all()
        api.exclude_unavailable(bar_result)
        eq_(0, len(bar_result))


class TestContentApiSecurity(DefaultTest):
    fixtures = [FixtureTest, ]

    def test_unit__cant_get_non_access_content__ok__nominal_case(self):
        admin = self.session.query(User)\
            .filter(User.email == 'admin@admin.admin').one()
        bob = self.session.query(User)\
            .filter(User.email == 'bob@fsf.local').one()

        bob_workspace = WorkspaceApi(
            current_user=bob,
            session=self.session,
        ).create_workspace(
            'bob_workspace',
            save_now=True,
        )
        admin_workspace = WorkspaceApi(
            current_user=admin,
            session=self.session,
        ).create_workspace(
            'admin_workspace',
            save_now=True,
        )

        bob_page = ContentApi(
            current_user=bob,
            session=self.session,
            config=self.app_config,
        ).create(
            content_type=ContentType.Page,
            workspace=bob_workspace,
            label='bob_page',
            do_save=True,
        )

        admin_page = ContentApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        ).create(
            content_type=ContentType.Page,
            workspace=admin_workspace,
            label='admin_page',
            do_save=True,
        )

        bob_viewable = ContentApi(
            current_user=bob,
            session=self.session,
            config=self.app_config,
        ).get_all()
        eq_(1, len(bob_viewable), 'Bob should view only one content')
        eq_(
            'bob_page',
            bob_viewable[0].label,
            'Bob should not view "{0}" content'.format(
                bob_viewable[0].label,
            )
        )
