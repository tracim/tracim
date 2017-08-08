# -*- coding: utf-8 -*-

import sys

from nose.tools import assert_raises
from resetpassword.lib import _plain_send_mail

from tracim.tests import TestStandard


class TestSerializers(TestStandard):
    application_under_test = 'nosmtp'

    def test_unit__plain_send_mail__ok(self):
        if sys.version_info >= (3, 5):
            from smtplib import SMTPNotSupportedError

            assert_raises(
                (ConnectionRefusedError, SMTPNotSupportedError),
                _plain_send_mail,
                'Name of sender <email@sender.local>',
                'Recipient name <recipient@recipient.local>',
                'hello',
                'How are you ?',
            )
        else:
            from smtplib import SMTPException
            assert_raises(
                (SMTPException, ConnectionRefusedError),
                _plain_send_mail,
                'Name of sender <email@sender.local>',
                'Recipient name <recipient@recipient.local>',
                'hello',
                'How are you ?',
            )
