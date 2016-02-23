# -*- coding: utf-8 -*-
import transaction
from nose.tools import eq_

from tracim.lib.content import ContentApi
from tracim.model import DBSession, Content
from tracim.model.data import Workspace
from tracim.tests import BaseTestThread, TestStandard


class TestThread(BaseTestThread, TestStandard):

    def test_children(self):
        self._create_thread(
            workspace_name='workspace_1',
            folder_name='folder_1',
            thread_name='thread_1',
        )
        workspace = DBSession.query(Workspace).filter(Workspace.label == 'workspace_1').one()
        folder = ContentApi.get_base_query().filter(Content.label == 'folder_1').one()
        eq_([folder, ], list(workspace.get_valid_children()))
