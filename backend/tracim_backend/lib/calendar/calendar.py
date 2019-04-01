import typing

import requests
from colour import Color
from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.exceptions import CalendarServerConnectionError
from tracim_backend.exceptions import CannotCreateCalendar
from tracim_backend.exceptions import WorkspaceCalendarDisabled
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import Calendar
from tracim_backend.models.data import Workspace
from tracim_backend.views.calendar_api.schemas import CalendarType

CREATE_CALENDAR_TEMPLATE = \
"""<?xml version="1.0" encoding="UTF-8" ?>
<create xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:I="http://apple.com/ns/ical/">
  <set>
    <prop>
      <resourcetype>
        <collection />
        <C:calendar />
      </resourcetype>
      <C:supported-calendar-component-set>
        <C:comp name="VEVENT" />
        <C:comp name="VJOURNAL" />
        <C:comp name="VTODO" />
      </C:supported-calendar-component-set>
      <displayname>{calendar_name}</displayname>
      <C:calendar-description>{calendar_description}</C:calendar-description>
      <I:calendar-color>{calendar_color}</I:calendar-color>
    </prop>
  </set>
</create>
"""

class CalendarApi(object):

    def __init__(
            self,
            session: Session,
            current_user: typing.Optional[User],
            config: CFG
    ):
        self._user = current_user
        self._session = session
        self._config = config


    def _check_calendar_exist(self, calendar_url) -> bool:
        try:
            response = requests.get(calendar_url)
        except requests.exceptions.ConnectionError as exc:
            logger.error(self, 'Cannot check calendar existence, connection error to radicale server')
            logger.exception(self, exc)
            raise CalendarServerConnectionError() from exc
        if response.status_code < 400:
            return True
        else:
            # TODO - G.M - 2019-03-13 - Better deal with other error code
            return False

    def _create_calendar(self, calendar_url, calendar_name, calendar_description):
        logger.debug(self, 'create a new caldav calendar at url {}'.format(calendar_url))
        body = CREATE_CALENDAR_TEMPLATE.format(
            calendar_name=calendar_name,
            calendar_color=Color(pick_for='calendar_name').get_hex(),
            calendar_description=calendar_description,
        )
        try:
            response = requests.request('mkcol', calendar_url, data=body)
        except requests.exceptions.ConnectionError as exc:
            raise CalendarServerConnectionError() from exc
        if not response.status_code == 201:
            raise CannotCreateCalendar('Calendar {} cannot be created:{},{}'.format(calendar_url, response.status_code, response.content))
        logger.info(self, 'new caldav calendar created at url {}'.format(calendar_url))

    def _get_calendar_base_url(self, use_proxy: bool):
        if use_proxy:
            base_url = self._config.WEBSITE_BASE_URL
        else:
            base_url = self._config.CALDAV_RADICALE_PROXY_BASE_URL
        return base_url

    def get_workspace_calendar_url(self, workspace: Workspace, use_proxy: bool) -> str:
        base_url = self._get_calendar_base_url(use_proxy=use_proxy)
        return '{}{}{}/'.format(base_url, self._config.CALDAV_RADICALE_WORKSPACE_PATH, workspace.workspace_id)

    def get_user_calendar_url(self, user: User, use_proxy: bool) -> str:
        base_url = self._get_calendar_base_url(use_proxy=use_proxy)
        return '{}{}{}/'.format(base_url, self._config.CALDAV_RADICALE_USER_PATH, user.user_id)

    def ensure_workspace_calendar_exist(self, workspace: Workspace) -> bool:
        """
        Return true if calendar already exist, false if it was just create,
        raise Exception if calendar cannot be created.
        """
        logger.debug(self, 'check for calendar existence of workspace {}'.format(workspace.workspace_id))
        if not workspace.calendar_enabled:
            raise WorkspaceCalendarDisabled()
        workspace_calendar_url = self.get_workspace_calendar_url(workspace, use_proxy=False)
        if not self._check_calendar_exist(workspace_calendar_url):
            self._create_calendar(
                calendar_url=workspace_calendar_url,
                calendar_name=workspace.label,
                calendar_description=workspace.description,
            )
            return False
        return True

    def ensure_user_calendar_exist(self, user: User) -> bool:
        """
        Return true if calendar already exist, false if it was just create,
        raise Exception if calendar cannot be created.
        """
        logger.debug(self, 'check for calendar existence of user {}'.format(user.user_id))
        user_calendar_url = self.get_user_calendar_url(user, use_proxy=False)
        if not self._check_calendar_exist(user_calendar_url):
            self._create_calendar(
                calendar_url=user_calendar_url,
                calendar_name=user.display_name,
                calendar_description='',
            )
            return False
        return True

    def get_user_calendars(
            self,
            user:User,
            workspaces_ids_filter: typing.Optional[typing.List[int]],
            calendar_types_filter: typing.Optional[str]
    ) -> typing.List[Calendar]:
        user_calendars = []

        if not calendar_types_filter:
            calendar_types_filter = [calendar.value for calendar in CalendarType]

        if CalendarType.private.value in calendar_types_filter and not workspaces_ids_filter:
            user_calendars.append(
                Calendar(
                    calendar_url=self.get_user_calendar_url(user, use_proxy=True),
                    with_credentials=True,
                    calendar_type=CalendarType.private.value,
                    workspace_id=None,
                )
            )
        if CalendarType.workspace.value in calendar_types_filter:
            workspace_api = WorkspaceApi(
                current_user=self._user,
                session=self._session,
                config=self._config
            )
            workspaces = workspace_api.get_all_for_user(user)
            for workspace in workspaces:
                if workspaces_ids_filter and workspace.workspace_id not in workspaces_ids_filter:
                    continue
                if not workspace.calendar_enabled:
                    continue
                user_calendars.append(
                    Calendar(
                        calendar_url=self.get_workspace_calendar_url(workspace, use_proxy=True),
                        with_credentials=True,
                        calendar_type=CalendarType.workspace.value,
                        workspace_id=workspace.workspace_id
                    )
                )
        return user_calendars
