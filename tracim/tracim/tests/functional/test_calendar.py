import time

import caldav
from caldav.lib.error import AuthorizationError
from nose.tools import eq_, ok_
import requests
from requests.exceptions import ConnectionError

from tracim.tests import TestCalendar as BaseTestCalendar


class TestCalendar(BaseTestCalendar):
    def test_func__radicale_connectivity__ok__nominal_case(self):
        radicale_base_url = self._get_base_url()

        try:
            time.sleep(2)  # TODO - 20160606 - Bastien: sleep to wait ...
            # ... radicale daemon started. We should lock something somewhere !
            response = requests.get(radicale_base_url)
            eq_(response.status_code, 401, 'Radicale http response is 401')
        except ConnectionError:
            ok_(False, 'Unable to contact radicale on HTTP')

    def test_func__radicale_auth__ok__as_lawrence(self):
        client = caldav.DAVClient('http://127.0.0.1:15232',
                                  username='lawrence-not-real-email@fsf.local',
                                  password='foobarbaz')
        try:
            client.propfind()
            ok_(True, 'No auth error when communicate with radicale server')
        except AuthorizationError:
            ok_(False, 'AuthorizationError when communicate with radicale')
