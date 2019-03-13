import typing

import requests
from colour import Color
from sqlalchemy.orm import Session

from tracim_backend import CFG
from tracim_backend.exceptions import CannotCreateCalendar, \
    CannotAccessToCalendar
from tracim_backend.exceptions import WorkspaceCalendarDisabled
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.data import Workspace

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
        result = requests.get(calendar_url)
        if result.status_code < 400:
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
        result = requests.request('mkcol', calendar_url, data=body)
        if not result.status_code == 201:
            raise CannotCreateCalendar('Calendar {} cannot be created:{},{}'.format(calendar_url, result.status_code, result.content))
        logger.info(self, 'new caldav calendar created at url {}'.format(calendar_url))

    def _get_calendar_base_url(self, use_proxy: bool):
        if use_proxy:
            base_url = self._config.WEBSITE_BASE_URL
        else:
            base_url = self._config.CALDAV_RADICALE_PROXY_BASE_URL
        return base_url

    def _get_workspace_calendar_url(self, workspace: Workspace, use_proxy: bool) -> str:
        base_url = self._get_calendar_base_url(use_proxy=use_proxy)
        return '{}{}{}/'.format(base_url, self._config.CALDAV_RADICALE_WORKSPACE_PATH, workspace.workspace_id)

    def _get_user_calendar_url(self, user: User, use_proxy: bool) -> str:
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
        workspace_calendar_url = self._get_workspace_calendar_url(workspace, use_proxy=False)
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
        user_calendar_url = self._get_user_calendar_url(user, use_proxy=False)
        if not self._check_calendar_exist(user_calendar_url):
            self._create_calendar(
                calendar_url=user_calendar_url,
                calendar_name=user.display_name,
                calendar_description='',
            )
            return False
        return True
