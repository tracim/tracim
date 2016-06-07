import time

import caldav
import transaction
from caldav.lib.error import AuthorizationError
from nose.tools import eq_, ok_
import requests
from requests.exceptions import ConnectionError
from sqlalchemy.orm.exc import NoResultFound

from tracim.config.app_cfg import daemons
from tracim.lib.calendar import CalendarManager
from tracim.lib.workspace import WorkspaceApi
from tracim.model import DBSession
from tracim.tests import TestCalendar as BaseTestCalendar
from tracim.model.auth import User
from tracim.model.data import Content


class TestCalendar(BaseTestCalendar):
    def setUp(self):
        super().setUp()
        time.sleep(3)  # TODO - 20160606 - Bastien: sleep to wait ...
        # ... radicale daemon started. We should lock something somewhere !

    def test_func__radicale_connectivity__ok__nominal_case(self):
        radicale_base_url = CalendarManager.get_base_url()

        try:
            response = requests.get(radicale_base_url)
            eq_(response.status_code, 401, 'Radicale http response is 401')
        except ConnectionError:
            ok_(False, 'Unable to contact radicale on HTTP')

    def test_func__radicale_auth__ok__as_lawrence(self):
        radicale_base_url = CalendarManager.get_base_url()
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
        radicale_base_url = CalendarManager.get_base_url()
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

    def test_func__rights_read_user_calendar__ok__as_lawrence(self):
        radicale_base_url = CalendarManager.get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='lawrence-not-real-email@fsf.local',
            password='foobarbaz'
        )
        user = DBSession.query(User).filter(
            User.email == 'lawrence-not-real-email@fsf.local'
        ).one()
        user_calendar_url = CalendarManager.get_user_calendar_url(user.user_id)
        try:
            caldav.Calendar(
                parent=client,
                client=client,
                url=user_calendar_url
            ).events()

            ok_(True, 'User can access it\'s own calendar')
        except AuthorizationError:
            ok_(False, 'User should not access that')

    def test_func__rights_read_user_calendar__fail__as_john_doe(self):
        radicale_base_url = CalendarManager.get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='john.doe@foo.local',
            password='nopasswd'
        )
        other_user = DBSession.query(User).filter(
            User.email == 'admin@admin.admin'
        ).one()
        user_calendar_url = CalendarManager.get_user_calendar_url(other_user.user_id)
        try:
            caldav.Calendar(
                parent=client,
                client=client,
                url=user_calendar_url
            ).events()

            ok_(False, 'User can\'t acces other user calendar')
        except AuthorizationError:
            ok_(True, 'User should not acces other user calendar')

    def test_func__rights_read_workspace_calendar__ok__as_owner(self):
        lawrence = DBSession.query(User).filter(
            User.email == 'lawrence-not-real-email@fsf.local'
        ).one()
        workspace = WorkspaceApi(lawrence).create_workspace(
            'workspace_1',
            save_now=False
        )
        workspace.calendar_enabled = True
        DBSession.flush()

        workspace_calendar_url = CalendarManager.get_workspace_calendar_url(
            workspace.workspace_id
        )

        transaction.commit()

        radicale_base_url = CalendarManager.get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='lawrence-not-real-email@fsf.local',
            password='foobarbaz'
        )
        try:
            caldav.Calendar(
                parent=client,
                client=client,
                url=workspace_calendar_url
            ).events()

            ok_(True, 'User can acces own workspace calendar')
        except AuthorizationError:
            ok_(False, 'User should not acces own workspace calendar')

    def test_func__rights_read_workspace_calendar__fail__as_unauthorized(self):
        lawrence = DBSession.query(User).filter(
            User.email == 'lawrence-not-real-email@fsf.local'
        ).one()
        workspace = WorkspaceApi(lawrence).create_workspace(
            'workspace_1',
            save_now=False
        )
        workspace.calendar_enabled = True
        DBSession.flush()

        workspace_calendar_url = CalendarManager.get_workspace_calendar_url(
            workspace.workspace_id
        )

        transaction.commit()

        radicale_base_url = CalendarManager.get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='bob@fsf.local',
            password='foobarbaz'
        )
        try:
            caldav.Calendar(
                parent=client,
                client=client,
                url=workspace_calendar_url
            ).events()

            ok_(False, 'User can\'t access unright workspace calendar')
        except AuthorizationError:
            ok_(True, 'User should not access unright workspace calendar')

    def test_func__event_create__ok__nominal_case(self):
        lawrence = DBSession.query(User).filter(
            User.email == 'lawrence-not-real-email@fsf.local'
        ).one()
        radicale_base_url = CalendarManager.get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='lawrence-not-real-email@fsf.local',
            password='foobarbaz'
        )
        user_calendar_url = CalendarManager.get_user_calendar_url(
            lawrence.user_id
        )
        user_calendar = caldav.Calendar(
            parent=client,
            client=client,
            url=user_calendar_url
        )

        event_ics = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Example Corp.//CalDAV Client//EN
BEGIN:VEVENT
UID:1234567890
DTSTAMP:20100510T182145Z
DTSTART:20100512T170000Z
DTEND:20100512T180000Z
SUMMARY:This is an event
LOCATION:Here
END:VEVENT
END:VCALENDAR
"""
        user_calendar.add_event(event_ics)
        user_calendar.save()

        daemons.execute_in_thread('radicale', lambda: transaction.commit())
        # TODO - 20160606 - Bastien: lock should be better here ?
        time.sleep(3)  # Wait for be sure transaction commited in daemon
        transaction.commit()
        try:
            event = DBSession.query(Content).filter(
                Content.label == 'This is an event'
            ).one()
        except NoResultFound:
            ok_(False, 'Content record should exist for '
                       '"This is an event" label')

        eq_(event.properties['location'], 'Here')
        eq_(event.properties['start'], '2010-05-12 18:00:00+0000')
        eq_(event.properties['end'], '2010-05-12 17:00:00+0000')
