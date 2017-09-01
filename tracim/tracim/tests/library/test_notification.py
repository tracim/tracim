# -*- coding: utf-8 -*-
import os
import re

from nose.tools import eq_
from nose.tools import ok_

from tracim.config.app_cfg import CFG
from tracim.lib.notifications import DummyNotifier
from tracim.lib.notifications import EmailNotifier
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

        eq_(4, len(tags))
        ok_('{website_title}' in tags)
        ok_('{workspace_label}' in tags)
        ok_('{content_label}' in tags)
        ok_('{content_status_label}' in tags)


class TestEmailNotifier(TestStandard):

    def test_unit__log_notification(self):
        log_path = CFG.get_instance().EMAIL_NOTIFICATION_LOG_FILE_PATH
        pattern = '\|{rec}\|{subj}$\\n'
        line_1_rec = 'user 1 <us.er@o.ne>'
        line_1_subj = 'notification 1'
        line_1_pattern = pattern.format(rec=line_1_rec, subj=line_1_subj)
        line_2_rec = 'user 2 <us.er@t.wo>'
        line_2_subj = 'notification 2'
        line_2_pattern = pattern.format(rec=line_2_rec, subj=line_2_subj)
        EmailNotifier._log_notification(
            recipient=line_1_rec,
            subject=line_1_subj,
        )
        EmailNotifier._log_notification(
            recipient=line_2_rec,
            subject=line_2_subj,
        )
        with open(log_path, 'rt') as log_file:
            line_1 = log_file.readline()
            line_2 = log_file.readline()
        os.remove(path=log_path)
        ok_(re.search(pattern=line_1_pattern, string=line_1))
        ok_(re.search(pattern=line_2_pattern, string=line_2))

    def test_email_notifier__build_name_with_user_id(self):
        u = User()
        u.user_id = 3
        u.display_name = 'François Michâlié'

        config = CFG.get_instance()
        config.EMAIL_NOTIFICATION_FROM_EMAIL = 'noreply+{user_id}@tracim.io'

        notifier = EmailNotifier(smtp_config=None, global_config=config)
        email = notifier._get_sender(user=u)
        eq_('=?utf-8?q?Fran=C3=A7ois_Mich=C3=A2li=C3=A9_via_Tracim?= <noreply+3@tracim.io>', email)  # nopep8

    def test_email_notifier__build_name_without_user_id(self):
        u = User()
        u.user_id = 3
        u.display_name = 'François Michâlié'

        config = CFG.get_instance()
        config.EMAIL_NOTIFICATION_FROM_EMAIL = 'noreply@tracim.io'

        notifier = EmailNotifier(smtp_config=None, global_config=config)
        email = notifier._get_sender(user=u)
        eq_('=?utf-8?q?Fran=C3=A7ois_Mich=C3=A2li=C3=A9_via_Tracim?= <noreply@tracim.io>', email)  # nopep8

    def test_email_notifier__build_name_with_user_id_wrong_syntax(self):
        u = User()
        u.user_id = 3
        u.display_name = 'François Michâlié'

        config = CFG.get_instance()
        config.EMAIL_NOTIFICATION_FROM_EMAIL = 'noreply+{userid}@tracim.io'

        notifier = EmailNotifier(smtp_config=None, global_config=config)
        email = notifier._get_sender(user=u)
        eq_('=?utf-8?q?Fran=C3=A7ois_Mich=C3=A2li=C3=A9_via_Tracim?= <noreply+{userid}@tracim.io>', email)  # nopep8

    def test_email_notifier__build_name_with_no_user(self):
        config = CFG.get_instance()
        config.EMAIL_NOTIFICATION_FROM_DEFAULT_LABEL = 'Robot'
        config.EMAIL_NOTIFICATION_FROM_EMAIL = 'noreply@tracim.io'

        notifier = EmailNotifier(smtp_config=None, global_config=config)
        email = notifier._get_sender()
        eq_('Robot <noreply@tracim.io>', email)
