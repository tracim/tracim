# -*- coding: utf-8 -*-

import sys

from nose.tools import assert_raises
from resetpassword.lib import _plain_send_mail

from tracim.tests import TestStandard


class TestResetPassword(TestStandard):
    application_under_test = 'nosmtp'

    # TODO - A.P - 2017-08-23 - Reactivate this test
    # Solving [1] causes all tests, after the following one, to fail.
    # [1] no admin calendar: https://github.com/tracim/tracim/issues/274
    # Deactivating it solves this odd issue, probably due to improper
    # individual test environment setup in tests sequence.
    #def deactivated_test_unit__plain_send_mail__ok(self):
    #    if sys.version_info >= (3, 5):
    #        from smtplib import SMTPNotSupportedError

    #        assert_raises(
    #            (ConnectionRefusedError, SMTPNotSupportedError),
    #            _plain_send_mail,
    #            'Name of sender <email@sender.local>',
    #            'Recipient name <recipient@recipient.local>',
    #            'hello',
    #            'How are you ?',
    #        )
    #    else:
    #        from smtplib import SMTPException
    #        assert_raises(
    #            (SMTPException, ConnectionRefusedError),
    #            _plain_send_mail,
    #            'Name of sender <email@sender.local>',
    #            'Recipient name <recipient@recipient.local>',
    #            'hello',
    #            'How are you ?',
    #        )
