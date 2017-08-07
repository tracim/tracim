# -*- coding: utf-8 -*-
from nose.tools import eq_

from tracim.lib.content import ContentApi
from tracim.lib.user import UserApi
from tracim.lib.userworkspace import RoleApi
from tracim.lib.workspace import WorkspaceApi
from tracim.model import Content
from tracim.model import DBSession
from tracim.model import User
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
