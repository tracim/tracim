# -*- coding: utf-8 -*-

import datetime
from unittest.mock import MagicMock

import pytz
from babel.dates import get_timezone
from nose.tools import eq_
from tg.request_local import TurboGearsContextMember
from tg.util.webtest import test_context
from tg import tmpl_context

import tracim.lib.helpers as h
from tracim.config.app_cfg import CFG
from tracim.model.serializers import DictLikeClass
from tracim.tests import TestStandard


class TestHelpers(TestStandard):

    def test_is_item_still_editable(self):
        config = CFG.get_instance()
        item = DictLikeClass()

        config.DATA_UPDATE_ALLOWED_DURATION = 0
        item.created = datetime.datetime.now() - datetime.timedelta(0, 10)

        item.type = DictLikeClass({'id': 5})
        eq_(False, h.is_item_still_editable(config, item))

        item.type.id = 'comment'
        eq_(False, h.is_item_still_editable(config, item))

        config.DATA_UPDATE_ALLOWED_DURATION = -1
        item.type.id = 'comment'
        item.created = datetime.datetime.now() - datetime.timedelta(0, 10)
        eq_(True, h.is_item_still_editable(config, item))

        config.DATA_UPDATE_ALLOWED_DURATION = 12
        item.created = datetime.datetime.now() - datetime.timedelta(0, 10)
        eq_(True, h.is_item_still_editable(config, item), 'created: {}, now: {}'.format(item.created, datetime.datetime.now())) # This test will pass only if the test duration is less than 120s !!!

        config.DATA_UPDATE_ALLOWED_DURATION = 8
        item.created = datetime.datetime.now() - datetime.timedelta(0, 10)
        eq_(False, h.is_item_still_editable(config, item))

    def test_unit__change_datetime_timezone__ok__with_naive_and_current_user(self):  # nopep8
        user_mock = MagicMock(timezone='America/Guadeloupe')

        with test_context(self.app):
            tmpl_context.current_user = user_mock
            naive_datetime = datetime.datetime(2000, 1, 1, 0, 0, 0)

            new_datetime = h.get_with_timezone(
                datetime_object=naive_datetime,
                default_from_timezone='UTC',
                to_timezone='',  # user_mock.timezone should be used
            )

            eq_(str(new_datetime), '1999-12-31 20:00:00-04:00')
