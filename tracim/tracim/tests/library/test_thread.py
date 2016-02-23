# -*- coding: utf-8 -*-
import transaction
from nose.tools import eq_

from tracim.tests import BaseTestThread, TestStandard


class TestThread(BaseTestThread, TestStandard):

    def test_create_thread(self, key='1'):
        return self._create_thread(
            workspace_name='workspace_%s' % key,
            folder_name='folder_%s' % key,
            thread_name='thread_%s' % key,
        )
