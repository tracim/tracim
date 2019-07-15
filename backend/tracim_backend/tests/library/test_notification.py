# -*- coding: utf-8 -*-

from tracim_backend.lib.core.notifications import DummyNotifier
from tracim_backend.lib.core.notifications import NotifierFactory
from tracim_backend.lib.mail_notifier.notifier import EmailNotifier
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


class TestDummyNotifier(object):
    def test_dummy_notifier__notify_content_update(self, app_config, session):
        c = Content()
        notifier = DummyNotifier(app_config, session)
        notifier.notify_content_update(c)
        # INFO - D.A. - 2014-12-09 -
        # Old notification_content_update raised an exception


class TestNotifierFactory(object):
    def test_notifier_factory_method(self, app_config):
        u = User()
        app_config.EMAIL__NOTIFICATION__ACTIVATED = True
        notifier = NotifierFactory.create(app_config, u)
        assert EmailNotifier == notifier.__class__

        app_config.EMAIL__NOTIFICATION__ACTIVATED = False
        notifier = NotifierFactory.create(app_config, u)
        assert DummyNotifier == notifier.__class__


class TestEmailNotifier(object):
    # TODO - G.M - 04-03-2017 -  [emailNotif] - Restore test for email Notif
    pass
