import re

from tracim.lib.exceptions import UnknownCalendarType
from tracim.lib.exceptions import NotFound
from tracim.lib.user import UserApi
from tracim.lib.workspace import WorkspaceApi
from tracim.model import User
from tracim.model.organizational import Calendar
from tracim.model.organizational import UserCalendar
from tracim.model.organizational import WorkspaceCalendar

CALENDAR_USER_PATH_RE = 'user\/([0-9]+)--([a-z-]*).ics'
CALENDAR_WORKSPACE_PATH_RE = 'workspace\/([0-9]+)--([a-z0-9-]*).ics'

CALENDAR_TYPE_USER = 'USER'
CALENDAR_TYPE_WORKSPACE = 'WORKSPACE'


class CalendarManager(object):
    def __init__(self, user: User):
        self._user = user

    def get_type_for_path(self, path: str) -> str:
        """
        Return calendar type for given path. Raise
        tracim.lib.exceptions.UnknownCalendarType if unknown type.
        :param path: path representation like user/42--foo.ics
        :return: Type of calendar, can be one of CALENDAR_TYPE_USER,
        CALENDAR_TYPE_WORKSPACE
        """
        if re.match(CALENDAR_USER_PATH_RE, path):
            return CALENDAR_TYPE_USER

        if re.match(CALENDAR_WORKSPACE_PATH_RE, path):
            return CALENDAR_TYPE_WORKSPACE

        raise UnknownCalendarType(
            'No match for calendar path "{0}"'.format(path)
        )

    def get_id_for_path(self, path: str, type: str) -> int:
        """
        Return related calendar id for given path. Raise
        tracim.lib.exceptions.UnknownCalendarType if unknown type.
        :param path: path representation like user/42--foo.ics
        :param type: Type of calendar, can be one of CALENDAR_TYPE_USER,
        CALENDAR_TYPE_WORKSPACE
        :return: ID of related calendar object. For UserCalendar it will be
        user id, for WorkspaceCalendar it will be Workspace id.
        """
        if type == CALENDAR_TYPE_USER:
            return re.search(CALENDAR_USER_PATH_RE, path).group(1)
        elif type == CALENDAR_TYPE_WORKSPACE:
            return re.search(CALENDAR_WORKSPACE_PATH_RE, path).group(1)
        raise UnknownCalendarType('Type "{0}" is not implemented'.format(type))

    def find_calendar_with_path(self, path: str) -> Calendar:
        """
        Return calendar for given path. Raise tracim.lib.exceptions.NotFound if
        calendar cannot be found.
        :param path: path representation like user/42--foo.ics
        :return: Calendar corresponding to path
        """
        try:
            type = self.get_type_for_path(path)
            id = self.get_id_for_path(path, type)
        except UnknownCalendarType as exc:
            raise NotFound(str(exc))

        return self.get_calendar(type, id, path)

    def get_calendar(self, type: str, id: str, path: str) -> Calendar:
        """
        Return tracim.model.organizational.Calendar instance for given
        parameters.
        :param type: Type of calendar, can be one of CALENDAR_TYPE_USER,
        CALENDAR_TYPE_WORKSPACE
        :param id: related calendar object id
        :param path: path representation like user/42--foo.ics
        :return: a calendar.
        """
        if type == CALENDAR_TYPE_USER:
            user = UserApi(self._user).get_one_by_id(id)
            return UserCalendar(user, path=path)

        if type == CALENDAR_TYPE_WORKSPACE:
            workspace = WorkspaceApi(self._user).get_one(id)
            return WorkspaceCalendar(workspace, path=path)

        raise UnknownCalendarType('Type "{0}" is not implemented'.format(type))
