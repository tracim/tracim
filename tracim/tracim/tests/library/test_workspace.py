# -*- coding: utf-8 -*-
from nose.tools import eq_

from tracim.lib.content import ContentApi
from tracim.lib.group import GroupApi
from tracim.lib.user import UserApi
from tracim.lib.userworkspace import RoleApi
from tracim.lib.workspace import WorkspaceApi
from tracim.model import Content
from tracim.model import DBSession
from tracim.model import User
from tracim.model.auth import Group
from tracim.model.data import UserRoleInWorkspace
from tracim.model.data import Workspace
from tracim.tests import BaseTestThread
from tracim.tests import TestStandard


class TestThread(BaseTestThread, TestStandard):

    def test_children(self):
        admin = DBSession.query(User).filter(User.email == 'admin@admin.admin').one()
        self._create_thread_and_test(
            workspace_name='workspace_1',
            folder_name='folder_1',
            thread_name='thread_1',
            user=admin
        )
        workspace = DBSession.query(Workspace).filter(Workspace.label == 'workspace_1').one()
        folder = ContentApi.get_canonical_query().filter(Content.label == 'folder_1').one()
        eq_([folder, ], list(workspace.get_valid_children()))

    def test_get_notifiable_roles(self):
        admin = DBSession.query(User) \
            .filter(User.email == 'admin@admin.admin').one()
        wapi = WorkspaceApi(admin)
        w = wapi.create_workspace(label='workspace w', save_now=True)
        uapi = UserApi(admin)
        u = uapi.create_user(email='u.u@u.u', save_now=True)
        eq_([], wapi.get_notifiable_roles(workspace=w))
        rapi = RoleApi(u)
        r = rapi.create_one(u, w, UserRoleInWorkspace.READER, with_notif='on')
        eq_([r, ], wapi.get_notifiable_roles(workspace=w))
        u.is_active = False
        eq_([], wapi.get_notifiable_roles(workspace=w))

    def test_unit__get_all_manageable(self):
        admin = DBSession.query(User) \
            .filter(User.email == 'admin@admin.admin').one()
        uapi = UserApi(admin)
        # Checks a case without workspaces.
        wapi = WorkspaceApi(current_user=admin)
        eq_([], wapi.get_all_manageable())
        # Checks an admin gets all workspaces.
        w4 = wapi.create_workspace(label='w4')
        w3 = wapi.create_workspace(label='w3')
        w2 = wapi.create_workspace(label='w2')
        w1 = wapi.create_workspace(label='w1')
        eq_([w1, w2, w3, w4], wapi.get_all_manageable())
        # Checks a regular user gets none workspace.
        gapi = GroupApi(None)
        u = uapi.create_user('u.s@e.r', [gapi.get_one(Group.TIM_USER)], True)
        wapi = WorkspaceApi(current_user=u)
        rapi = RoleApi(current_user=u)
        off = 'off'
        rapi.create_one(u, w4, UserRoleInWorkspace.READER, off)
        rapi.create_one(u, w3, UserRoleInWorkspace.CONTRIBUTOR, off)
        rapi.create_one(u, w2, UserRoleInWorkspace.CONTENT_MANAGER, off)
        rapi.create_one(u, w1, UserRoleInWorkspace.WORKSPACE_MANAGER, off)
        eq_([], wapi.get_all_manageable())
        # Checks a manager gets only its own workspaces.
        u.groups.append(gapi.get_one(Group.TIM_MANAGER))
        rapi.delete_one(u.user_id, w2.workspace_id)
        rapi.create_one(u, w2, UserRoleInWorkspace.WORKSPACE_MANAGER, off)
        eq_([w1, w2], wapi.get_all_manageable())
