# -*- coding: utf-8 -*-
from depot.io.utils import FileIntent

from tracim import models
from tracim.fixtures import Fixture
from tracim.fixtures.users_and_groups import Test
from tracim.lib.core.content import ContentApi
from tracim.lib.core.userworkspace import RoleApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.models.data import ContentType
from tracim.models.data import UserRoleInWorkspace


class Content(Fixture):
    require = [Test]

    def insert(self):
        admin = self._session.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        bob = self._session.query(models.User) \
            .filter(models.User.email == 'bob@fsf.local') \
            .one()
        admin_workspace_api = WorkspaceApi(
            current_user=admin,
            session=self._session,
        )
        bob_workspace_api = WorkspaceApi(
            current_user=bob,
            session=self._session,
        )
        content_api = ContentApi(
            current_user=admin,
            session=self._session,
            config=self._config
        )
        role_api = RoleApi(
            current_user=admin,
            session=self._session,
        )

        # Workspaces
        w1 = admin_workspace_api.create_workspace('w1', save_now=True)
        w2 = bob_workspace_api.create_workspace('w2', save_now=True)
        w3 = admin_workspace_api.create_workspace('w3', save_now=True)

        # Workspaces roles
        role_api.create_one(
            user=bob,
            workspace=w1,
            role_level=UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
        )

        # Folders
        w1f1 = content_api.create(
            content_type=ContentType.Folder,
            workspace=w1,
            label='w1f1',
            do_save=True,
            do_notify=False,
        )
        w1f2 = content_api.create(
            content_type=ContentType.Folder,
            workspace=w1,
            label='w1f2',
            do_save=True,
            do_notify=False,
        )

        w2f1 = content_api.create(
            content_type=ContentType.Folder,
            workspace=w2,
            label='w2f1',
            do_save=True,
            do_notify=False,
        )
        w2f2 = content_api.create(
            content_type=ContentType.Folder,
            workspace=w2,
            label='w2f2',
            do_save=True,
            do_notify=False,
        )

        w3f1 = content_api.create(
            content_type=ContentType.Folder,
            workspace=w3,
            label='w3f3',
            do_save=True,
            do_notify=False,
        )

        # Pages, threads, ..
        w1f1p1 = content_api.create(
            content_type=ContentType.Page,
            workspace=w1,
            parent=w1f1,
            label='w1f1p1',
            do_save=True,
            do_notify=False,
        )
        w1f1t1 = content_api.create(
            content_type=ContentType.Thread,
            workspace=w1,
            parent=w1f1,
            label='w1f1t1',
            do_save=False,
            do_notify=False,
        )
        w1f1t1.description = 'w1f1t1 description'
        self._session.add(w1f1t1)
        w1f1d1_txt = content_api.create(
            content_type=ContentType.File,
            workspace=w1,
            parent=w1f1,
            label='w1f1d1',
            do_save=False,
            do_notify=False,
        )
        w1f1d1_txt.file_extension = '.txt'
        w1f1d1_txt.depot_file = FileIntent(
            b'w1f1d1 content',
            'w1f1d1.txt',
            'text/plain',
        )
        self._session.add(w1f1d1_txt)
        w1f1d2_html = content_api.create(
            content_type=ContentType.File,
            workspace=w1,
            parent=w1f1,
            label='w1f1d2',
            do_save=False,
            do_notify=False,
        )
        w1f1d2_html.file_extension = '.html'
        w1f1d2_html.depot_file = FileIntent(
            b'<p>w1f1d2 content</p>',
            'w1f1d2.html',
            'text/html',
        )
        self._session.add(w1f1d2_html)
        w1f1f1 = content_api.create(
            content_type=ContentType.Folder,
            workspace=w1,
            label='w1f1f1',
            parent=w1f1,
            do_save=True,
            do_notify=False,
        )

        w2f1p1 = content_api.create(
            content_type=ContentType.Page,
            workspace=w2,
            parent=w2f1,
            label='w2f1p1',
            do_save=True,
            do_notify=False,
        )
        self._session.flush()
