import time

import caldav
from caldav.lib.error import AuthorizationError
from nose.tools import eq_, ok_
import requests
from requests.exceptions import ConnectionError

from tracim.model import DBSession
from tracim.tests import TestCalendar as BaseTestCalendar
from tracim.model.auth import User


class TestCalendar(BaseTestCalendar):
    def setUp(self):
        super().setUp()
        time.sleep(3)  # TODO - 20160606 - Bastien: sleep to wait ...
        # ... radicale daemon started. We should lock something somewhere !

    def test_func__radicale_connectivity__ok__nominal_case(self):
        radicale_base_url = self._get_base_url()

        try:
            response = requests.get(radicale_base_url)
            eq_(response.status_code, 401, 'Radicale http response is 401')
        except ConnectionError:
            ok_(False, 'Unable to contact radicale on HTTP')

    def test_func__radicale_auth__ok__as_lawrence(self):
        radicale_base_url = self._get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='lawrence-not-real-email@fsf.local',
            password='foobarbaz'
        )
        try:
            client.propfind()
            ok_(True, 'No auth error when communicate with radicale server')
        except AuthorizationError:
            ok_(False, 'AuthorizationError when communicate with radicale')

    def test_func__radicale_auth__fail__as_john_doe(self):
        radicale_base_url = self._get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='john.doe@foo.local',
            password='nopasswd'
        )
        try:
            client.propfind()
            ok_(False, 'Auth with unknown user should be raise'
                       ' AuthorizationError !')
        except AuthorizationError:
            ok_(True, 'AuthorizationError thrown correctly')

    def test_func__radicale_rights_read_user_calendar__ok__as_lawrence(self):
        radicale_base_url = self._get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='lawrence-not-real-email@fsf.local',
            password='foobarbaz'
        )
        user = DBSession.query(User).filter(
            User.email == 'lawrence-not-real-email@fsf.local'
        ).one()
        calendar_base_url = self._get_user_calendar_url(user.user_id)
        try:
            caldav.Calendar(
                parent=client,
                client=client,
                url=calendar_base_url
            ).events()

            ok_(True, 'User can access it\'s own calendar')
        except AuthorizationError:
            ok_(False, 'User should not access that')

    def test_func__radicale_rights_read_user_calendar__fail__as_john_doe(self):
        radicale_base_url = self._get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='john.doe@foo.local',
            password='nopasswd'
        )
        other_user = DBSession.query(User).filter(
            User.email == 'admin@admin.admin'
        ).one()
        calendar_base_url = self._get_user_calendar_url(other_user.user_id)
        try:
            caldav.Calendar(
                parent=client,
                client=client,
                url=calendar_base_url
            ).events()

            ok_(False, 'User can\'t acces other user calendar')
        except AuthorizationError:
            ok_(True, 'User should not acces other user calendar')
