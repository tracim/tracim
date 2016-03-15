# -*- coding: utf-8 -*-
import transaction
from nose.tools import eq_

from tracim.model import DBSession, User
from tracim.tests import BaseTestThread, TestStandard


class TestThread(BaseTestThread, TestStandard):

    def test_create_thread(self, key='1'):
        admin = DBSession.query(User).filter(User.email == 'admin@admin.admin').one()
        return self._create_thread_and_test(
            workspace_name='workspace_%s' % key,
            folder_name='folder_%s' % key,
            thread_name='thread_%s' % key,
            user=admin
        )
