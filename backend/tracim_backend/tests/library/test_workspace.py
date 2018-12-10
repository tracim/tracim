# -*- coding: utf-8 -*-

from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.data import Content
from tracim_backend.models.auth import User
from tracim_backend.models.auth import Group
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
#from tracim.tests import BaseTestThread
from tracim_backend.tests import DefaultTest
from tracim_backend.tests import eq_

class TestThread(DefaultTest):

    def test_children(self):
        admin = self.session.query(User).filter(
            User.email == 'admin@admin.admin'
        ).one()
        self._create_thread_and_test(
            workspace_name='workspace_1',
            folder_name='folder_1',
            thread_name='thread_1',
            user=admin
        )
        workspace = self.session.query(Workspace).filter(
            Workspace.label == 'workspace_1'
        ).one()
        content_api = ContentApi(
            session=self.session,
            current_user=admin,
            config=self.app_config,
        )
        folder = content_api.get_canonical_query().filter(
            Content.label == 'folder_1'
        ).one()
        eq_([folder, ], list(workspace.get_valid_children()))

    def test_get_notifiable_roles(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin').one()
        wapi = WorkspaceApi(
            session=self.session,
            config=self.app_config,
            current_user=admin,
        )
        w = wapi.create_workspace(label='workspace w', save_now=True)
        uapi = UserApi(
            session=self.session,
            current_user=admin,
            config=self.app_config
        )
        u = uapi.create_minimal_user(email='u.u@u.u', save_now=True)
        eq_([], wapi.get_notifiable_roles(workspace=w))
        rapi = RoleApi(
            session=self.session,
            current_user=admin,
            config=self.app_config,
        )
        r = rapi.create_one(u, w, UserRoleInWorkspace.READER, with_notif=True)
        eq_([r, ], wapi.get_notifiable_roles(workspace=w))
        u.is_active = False
        eq_([], wapi.get_notifiable_roles(workspace=w))

    def test_unit__get_all_manageable(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin').one()
        uapi = UserApi(
            session=self.session,
            current_user=admin,
            config=self.app_config,
        )
        # Checks a case without workspaces.
        wapi = WorkspaceApi(
            session=self.session,
            current_user=admin,
            config=self.app_config,
        )
        eq_([], wapi.get_all_manageable())
        # Checks an admin gets all workspaces.
        w4 = wapi.create_workspace(label='w4')
        w3 = wapi.create_workspace(label='w3')
        w2 = wapi.create_workspace(label='w2')
        w1 = wapi.create_workspace(label='w1')
        eq_([w1, w2, w3, w4], wapi.get_all_manageable())
        # Checks a regular user gets none workspace.
        gapi = GroupApi(
            session=self.session,
            current_user=None,
            config=self.app_config,
        )
        u = uapi.create_minimal_user('u.s@e.r', [gapi.get_one(Group.TIM_USER)], True)
        wapi = WorkspaceApi(
            session=self.session,
            current_user=u,
            config=self.app_config,
        )
        rapi = RoleApi(
            session=self.session,
            current_user=None,
            config=self.app_config,
        )
        rapi.create_one(u, w4, UserRoleInWorkspace.READER, False)
        rapi.create_one(u, w3, UserRoleInWorkspace.CONTRIBUTOR, False)
        rapi.create_one(u, w2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(u, w1, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        eq_([], wapi.get_all_manageable())
        # Checks a manager gets only its own workspaces.
        u.groups.append(gapi.get_one(Group.TIM_MANAGER))
        rapi.delete_one(u.user_id, w2.workspace_id)
        rapi.create_one(u, w2, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        eq_([w1, w2], wapi.get_all_manageable())
