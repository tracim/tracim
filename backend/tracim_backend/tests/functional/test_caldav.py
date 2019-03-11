from time import sleep

import pytest
import requests
import transaction
from requests.exceptions import ConnectionError
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.tests import CaldavRadicaleProxyFunctionalTest

VALID_CALDAV_BODY_PUT_EVENT = """
BEGIN:VCALENDAR
PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN
VERSION:2.0
X-WR-CALNAME:test
X-WR-TIMEZONE:Europe/Paris
BEGIN:VEVENT
CREATED:20190308T133249Z
LAST-MODIFIED:20190308T133251Z
DTSTAMP:20190308T133251Z
UID:6028cb45-10f3-4f95-8989-5fb6436a0243
SUMMARY:Nouvel évènement
DTSTART;VALUE=DATE:20190306
DTEND;VALUE=DATE:20190307
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR
"""

class TestCaldavRadicaleProxyEndpoints(CaldavRadicaleProxyFunctionalTest):

    @pytest.mark.skip('This Need sleep method actually')
    def test_radicale_available(self) -> None:
        try:
            result = requests.get('http://localhost:5232', timeout=3)
        except ConnectionError as exc:
            # we do retry just one time in order to be sure server was
            # correctly setup
            sleep(0.1)
            result = requests.get('http://localhost:5232', timeout=3)
        assert result.status_code == 200

    def test_proxy_user_calendar__ok__nominal_case(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        result = self.testapp.get('/calendar/user/{}.ics/'.format(user.user_id), status=404)
        event = VALID_CALDAV_BODY_PUT_EVENT
        result = self.testapp.put('/calendar/user/{}.ics/'.format(user.user_id), event, content_type='text/calendar', status=201)
        result = self.testapp.get('/calendar/user/{}.ics/'.format(user.user_id), status=200)
        result = self.testapp.delete('/calendar/user/{}.ics/'.format(user.user_id), status=200)

    def test_proxy_user_calendar__err__other_user_calendar(self) -> None:
        dbsession = get_tm_session(self.session_factory,
                                   transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('test@test.test', password='test@test.test',
                                do_save=True, do_notify=False,
                                groups=groups)  # nopep8
        user2 = uapi.create_user('test2@test2.test2', password='test@test.test',
                                do_save=True, do_notify=False,
                                groups=groups)  # nopep8
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        result = self.testapp.get(
            '/calendar/user/{}.ics/'.format(user2.user_id), status=403)
        assert result.json_body['code'] == 5001

    def test_proxy_workspace_calendar__ok__nominal_case(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('test@test.test', password='test@test.test', do_save=True, do_notify=False, groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test', save_now=True)  # nopep8
        rapi = RoleApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)  # nopep8
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        result = self.testapp.get('/calendar/workspace/{}.ics/'.format(workspace.workspace_id), status=404)
        event = VALID_CALDAV_BODY_PUT_EVENT
        result = self.testapp.put('/calendar/workspace/{}.ics/'.format(workspace.workspace_id), event, content_type='text/calendar', status=201)
        result = self.testapp.get('/calendar/workspace/{}.ics/'.format(workspace.workspace_id), status=200)
        result = self.testapp.delete('/calendar/workspace/1.ics/'.format(workspace.workspace_id), status=200)

    def test_proxy_workspace_calendar__err__other_workspace_calendar(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = uapi.create_user('test@test.test', password='test@test.test',
                                do_save=True, do_notify=False,
                                groups=groups)  # nopep8
        workspace_api = WorkspaceApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        workspace = workspace_api.create_workspace('test',
                                                   save_now=True)  # nopep8
        transaction.commit()
        self.testapp.authorization = (
            'Basic',
            (
                'test@test.test',
                'test@test.test'
            )
        )
        result = self.testapp.get(
            '/calendar/workspace/{}.ics/'.format(workspace.workspace_id),
            status=403)
        assert result.json_body['code'] == 5001