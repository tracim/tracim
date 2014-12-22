# -*- coding: utf-8 -*-

from nose.tools import eq_
from nose.tools import ok_
from nose.tools import raises

from sqlalchemy.orm.exc import NoResultFound

import transaction

from tracim.config.app_cfg import CFG
from tracim.lib.notifications import DummyNotifier
from tracim.lib.notifications import EST
from tracim.lib.notifications import NotifierFactory
from tracim.lib.notifications import RealNotifier
from tracim.model.auth import User
from tracim.model.data import Content

from tracim.tests import TestStandard


class TestDummyNotifier(TestStandard):

    def test_dummy_notifier__notify_content_update(self):
        c = Content()
        notifier = DummyNotifier()
        notifier.notify_content_update(c)
        # INFO - D.A. - 2014-12-09 - Old notification_content_update raised an exception

    def test_notifier_factory_method(self):
        u = User()

        cfg = CFG.get_instance()
        cfg.EMAIL_NOTIFICATION_ACTIVATED = True
        notifier = NotifierFactory.create(u)
        eq_(RealNotifier, notifier.__class__)

        cfg.EMAIL_NOTIFICATION_ACTIVATED = False
        notifier = NotifierFactory.create(u)
        eq_(DummyNotifier, notifier.__class__)

    def test_email_subject_tag_list(self):
        tags = EST.all()

        eq_(4,len(tags))
        ok_('{website_title}' in tags)
        ok_('{workspace_label}' in tags)
        ok_('{content_label}' in tags)
        ok_('{content_status_label}' in tags)
