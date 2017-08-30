import os
import time

import caldav
import transaction
from caldav.lib.error import AuthorizationError
from collections import OrderedDict
from nose.tools import eq_
from nose.tools import ok_
from nose.tools import raises
import requests
from requests.exceptions import ConnectionError
from sqlalchemy.orm.exc import NoResultFound
from tg import config

from tracim.config.app_cfg import daemons
from tracim.lib.calendar import CalendarManager
from tracim.lib.workspace import WorkspaceApi
from tracim.model import DBSession
from tracim.tests import TestCalendar as BaseTestCalendar
from tracim.tests import not_raises
from tracim.model.auth import User
from tracim.model.data import Content
from tracim.model.data import ContentRevisionRO
from tracim.model.data import Workspace


class TestCalendar(BaseTestCalendar):
    def setUp(self):
        super().setUp()
        time.sleep(3)  # TODO - 20160606 - Bastien: sleep to wait ...
        # ... radicale daemon started. We should lock something somewhere !

    def test_func__radicale_connectivity__ok__nominal_case(self):
        radicale_base_url = CalendarManager.get_base_url()

        try:
            response = requests.get(radicale_base_url)
            eq_(response.status_code, 401, 'Radicale http response should be '
                                           '401, its {0}'
                .format(response.status_code))
        except ConnectionError as exc:
            ok_(False, 'Unable to contact radicale on HTTP: {0}'.format(exc))

    @not_raises(AuthorizationError)
    def test_func__radicale_auth__ok__as_lawrence(self):
        radicale_base_url = CalendarManager.get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='lawrence-not-real-email@fsf.local',
            password='foobarbaz'
        )
        client.propfind()

    @raises(AuthorizationError)
    def test_func__radicale_auth__fail__as_john_doe(self):
        radicale_base_url = CalendarManager.get_base_url()
        client = caldav.DAVClient(
            radicale_base_url,
            username='john.doe@foo.local',
            password='nopasswd'
        )
        client.propfind()

    @not_raises(AuthorizationError)
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
        caldav.Calendar(
            parent=client,
            client=client,
            url=user_calendar_url
        ).events()

    @raises(AuthorizationError)
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
        caldav.Calendar(
            parent=client,
            client=client,
            url=user_calendar_url
        ).events()

    @not_raises(AuthorizationError)
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
        caldav.Calendar(
            parent=client,
            client=client,
            url=workspace_calendar_url
        ).events()

    @raises(AuthorizationError)
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
        caldav.Calendar(
            parent=client,
            client=client,
            url=workspace_calendar_url
        ).events()

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
            event = DBSession.query(Content) \
                .filter(Content.label == 'This is an event') \
                .filter(Content.owner_id == lawrence.user_id) \
                .filter(Content.id == ContentRevisionRO.content_id) \
                .one()
        except NoResultFound:
            ok_(False, 'Content record should exist for '
                       '"This is an event" label')

        eq_(event.properties['location'], 'Here')
        eq_(event.properties['start'], '2010-05-12 18:00:00+0000')
        eq_(event.properties['end'], '2010-05-12 17:00:00+0000')

    def test_created_user_radicale_calendar(self):
        self._connect_user(
            'admin@admin.admin',
            'admin@admin.admin',
        )

        user_count = DBSession.query(User)\
            .filter(User.email == 'an-other-email@test.local').count()
        eq_(0, user_count, 'User should not exist yet')

        radicale_users_folder = '{0}/user'\
            .format(config.get('radicale.server.filesystem.folder'))
        eq_(
            False,
            os.path.isdir(radicale_users_folder),
            'Radicale users folder should not exist yet',
        )

        # Create a new user, his calendar should be created to
        try_post_user = self.app.post(
            '/admin/users',
            OrderedDict([
                ('name', 'TEST'),
                ('email', 'an-other-email@test.local'),
                ('password', 'an-other-email@test.local'),
                ('is_tracim_manager', 'off'),
                ('is_tracim_admin', 'off'),
                ('send_email', 'off'),
            ])
        )

        eq_(try_post_user.status_code, 302,
            "Code should be 302, but is %d" % try_post_user.status_code)

        users_calendars = len([
            name for name in os.listdir(radicale_users_folder)
            if name.endswith('.ics')
        ])

        user = DBSession.query(User) \
            .filter(User.email == 'an-other-email@test.local').one()

        eq_(1, users_calendars, 'Radicale user path should list 1 calendar')
        user_calendar = '{0}/{1}.ics'.format(
            radicale_users_folder,
            user.user_id,
        )
        user_calendar_exist = os.path.isfile(user_calendar)
        eq_(True, user_calendar_exist, 'User calendar should be created')

    def test_created_workspace_radicale_calendar(self):
        self._connect_user(
            'admin@admin.admin',
            'admin@admin.admin',
        )

        workspaces_count = DBSession.query(Workspace)\
            .filter(Workspace.label == 'WTESTCAL').count()
        eq_(0, workspaces_count, 'Workspace should not exist yet !')

        radicale_workspaces_folder = '{0}/workspace'\
            .format(config.get('radicale.server.filesystem.folder'))
        eq_(
            False,
            os.path.isdir(radicale_workspaces_folder),
            'Radicale workskpaces folder should not exist yet',
        )

        # Create a new workspace, his calendar should be created to
        try_post_workspace = self.app.post(
            '/admin/workspaces',
            OrderedDict([
                ('name', 'WTESTCAL'),
                ('description', 'WTESTCALDESCR'),
                ('calendar_enabled', 'on'),
            ])
        )

        eq_(try_post_workspace.status_code, 302,
            "Code should be 302, but is %d" % try_post_workspace.status_code)

        workspaces_calendars = len([
            name for name in os.listdir(radicale_workspaces_folder)
            if name.endswith('.ics')
        ])

        workspace = DBSession.query(Workspace) \
            .filter(Workspace.label == 'WTESTCAL').one()

        eq_(
            1,
            workspaces_calendars,
            'Radicale workspace path should list 1 calendar',
        )
        workspace_calendar = '{0}/{1}.ics'.format(
            radicale_workspaces_folder,
            workspace.workspace_id,
        )
        workspace_calendar_exist = os.path.isfile(workspace_calendar)
        eq_(
            True,
            workspace_calendar_exist,
            'Workspace calendar should be created',
        )

    def unit_test__disable_workspace_disable_file__ok__nominal_case(self):
        self._connect_user(
            'admin@admin.admin',
            'admin@admin.admin',
        )
        radicale_workspaces_folder = '{0}/workspace'.format(
            config.get('radicale.server.filesystem.folder'),
        )
        delete_radicale_workspaces_folder = '{0}/workspace/deleted'.format(
            config.get('radicale.server.filesystem.folder'),
        )

        # Core after assume "test_created_workspace_radicale_calendar" is ok
        self.app.post(
            '/admin/workspaces',
            OrderedDict([
                ('name', 'WTESTCAL2'),
                ('description', 'WTESTCAL2DESCR'),
                ('calendar_enabled', 'on'),
            ])
        )
        created_workspace = DBSession.query(Workspace)\
            .filter(Workspace.label == 'WTESTCAL2')\
            .one()
        disable_response = self.app.put(
            '/admin/workspaces/{}?_method=PUT'.format(
                created_workspace.workspace_id,
            ),
            OrderedDict([
                ('name', 'WTESTCAL2'),
                ('description', 'WTESTCAL2DESCR'),
                ('calendar_enabled', 'off'),
            ])
        )
        eq_(disable_response.status_code, 302,
            "Code should be 302, but is %d" % disable_response.status_code)
        workspaces_calendars = [
            name for name in
            os.listdir(radicale_workspaces_folder)
            if name.endswith('.ics')
        ]
        deleted_workspaces_calendars = [
            name for name in
            os.listdir(delete_radicale_workspaces_folder)
            if name.endswith('.ics')
        ]

        eq_(
            0,
            len(workspaces_calendars),
            msg='No workspace ics file should exist, but {} found'.format(
                len(workspaces_calendars),
            ),
        )
        eq_(
            1,
            len(deleted_workspaces_calendars),
            msg='1 deleted workspace ics file should exist, but {} found'
                .format(
                    len(deleted_workspaces_calendars),
                ),
        )
        workspace_ics_file_name = '{}.ics'.format(
                created_workspace.workspace_id
        )
        ok_(
            workspace_ics_file_name in deleted_workspaces_calendars,
            '{} should be in deleted workspace calendar folder'.format(
                workspace_ics_file_name
            ),
        )

    def unit_test__re_enable_workspace_re_enable_file__ok__nominal_case(self):
        self._connect_user(
            'admin@admin.admin',
            'admin@admin.admin',
        )
        radicale_workspaces_folder = '{0}/workspace'.format(
            config.get('radicale.server.filesystem.folder'),
        )
        delete_radicale_workspaces_folder = '{0}/workspace/deleted'.format(
            config.get('radicale.server.filesystem.folder'),
        )

        # Core after assume
        # "unit_test__disable_workspace_disable_file__ok__nominal_case" is ok
        self.app.post(
            '/admin/workspaces',
            OrderedDict([
                ('name', 'WTESTCAL2'),
                ('description', 'WTESTCAL2DESCR'),
                ('calendar_enabled', 'on'),
            ])
        )
        created_workspace = DBSession.query(Workspace) \
            .filter(Workspace.label == 'WTESTCAL2') \
            .one()
        self.app.put(
            '/admin/workspaces/{}?_method=PUT'.format(
                created_workspace.workspace_id,
            ),
            OrderedDict([
                ('name', 'WTESTCAL2'),
                ('description', 'WTESTCAL2DESCR'),
                ('calendar_enabled', 'off'),
            ])
        )
        re_enable_response = self.app.put(
            '/admin/workspaces/{}?_method=PUT'.format(
                created_workspace.workspace_id,
            ),
            OrderedDict([
                ('name', 'WTESTCAL2'),
                ('description', 'WTESTCAL2DESCR'),
                ('calendar_enabled', 'on'),
            ])
        )
        eq_(re_enable_response.status_code, 302,
            "Code should be 302, but is %d" % re_enable_response.status_code)
        workspaces_calendars = [
            name for name in
            os.listdir(radicale_workspaces_folder)
            if name.endswith('.ics')
            ]
        deleted_workspaces_calendars = [
            name for name in
            os.listdir(delete_radicale_workspaces_folder)
            if name.endswith('.ics')
            ]

        eq_(
            1,
            len(workspaces_calendars),
            msg='1 workspace ics file should exist, but {} found'.format(
                len(workspaces_calendars),
            ),
        )
        eq_(
            0,
            len(deleted_workspaces_calendars),
            msg='0 deleted workspace ics file should exist, but {} found'
                .format(
                len(deleted_workspaces_calendars),
            ),
        )
        workspace_ics_file_name = '{}.ics'.format(
            created_workspace.workspace_id
        )
        ok_(
            workspace_ics_file_name in workspaces_calendars,
            '{} should be in workspace calendar folder'.format(
                workspace_ics_file_name
            ),
        )
