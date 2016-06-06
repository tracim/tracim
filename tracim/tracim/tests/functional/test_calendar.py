import time

from nose.tools import eq_, ok_
import requests
from requests.exceptions import ConnectionError

from tracim.lib.calendar import CALENDAR_BASE_URL
from tracim.tests import TestCalendar as BaseTestCalendar


class TestCalendar(BaseTestCalendar):
    def test_unit__radicale_connectivity__ok__nominal_case(self):
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()

        radicale_base_url = CALENDAR_BASE_URL.format(
            proto='https' if cfg.RADICALE_CLIENT_SSL else 'http',
            domain=cfg.RADICALE_CLIENT_HOST or '127.0.0.1',
            port=str(cfg.RADICALE_CLIENT_PORT)
        )
        try:
            time.sleep(2)  # TODO - 20160606 - Bastien: sleep to wait ...
            # ... radicale daemon started. We should lock something somewhere !
            response = requests.get(radicale_base_url)
            eq_(response.status_code, 401, 'Radicale http response is 401')
        except ConnectionError:
            ok_(False, 'Unable to contact radicale on HTTP')
