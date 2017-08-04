# -*- coding: utf-8 -*-
from nose.tools import assert_raises
from resetpassword.lib import _plain_send_mail

from tracim.tests import TestStandard
from smtplib import SMTPNotSupportedError

class TestSerializers(TestStandard):
    application_under_test = 'nosmtp'

    def test_unit__plain_send_mail__ok(self):
        assert_raises(
            (ConnectionRefusedError, SMTPNotSupportedError),
            _plain_send_mail,
            'Name of sender <email@sender.local>',
            'Recipient name <recipient@recipient.local>',
            'hello',
            'How are you ?',
        )
