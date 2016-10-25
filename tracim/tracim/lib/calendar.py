import os

import re
import transaction

from icalendar import Event as iCalendarEvent
from sqlalchemy.orm.exc import NoResultFound
from tg.i18n import ugettext as _

from tracim.lib.content import ContentApi
from tracim.lib.exceptions import UnknownCalendarType
from tracim.lib.exceptions import NotFound
from tracim.lib.user import UserApi
from tracim.lib.workspace import UnsafeWorkspaceApi
from tracim.lib.workspace import WorkspaceApi
from tracim.model import User
from tracim.model import DBSession
from tracim.model import new_revision
from tracim.model.data import ActionDescription
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.organisational import Calendar
from tracim.model.organisational import UserCalendar
from tracim.model.organisational import WorkspaceCalendar

CALENDAR_USER_PATH_RE = 'user\/([0-9]+).ics'
CALENDAR_WORKSPACE_PATH_RE = 'workspace\/([0-9]+).ics'

CALENDAR_TYPE_USER = UserCalendar
CALENDAR_TYPE_WORKSPACE = WorkspaceCalendar

CALENDAR_USER_URL_TEMPLATE = 'user/{id}.ics/'
CALENDAR_WORKSPACE_URL_TEMPLATE = 'workspace/{id}.ics/'

CALENDAR_USER_BASE_URL = '/user/'
CALENDAR_WORKSPACE_BASE_URL = '/workspace/'


class CalendarManager(object):
    @classmethod
    def get_personal_calendar_description(cls) -> str:
        return _('My personal calendar')

    @classmethod
    def get_base_url(cls):
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()
        return cfg.RADICALE_CLIENT_BASE_URL_TEMPLATE

    @classmethod
    def get_user_base_url(cls):
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()
        return os.path.join(cfg.RADICALE_CLIENT_BASE_URL_TEMPLATE, 'user/')

    @classmethod
    def get_workspace_base_url(cls):
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()
        return os.path.join(cfg.RADICALE_CLIENT_BASE_URL_TEMPLATE, 'workspace/')

    @classmethod
    def get_user_calendar_url(cls, user_id: int):
        user_path = CALENDAR_USER_URL_TEMPLATE.format(id=str(user_id))
        return os.path.join(cls.get_base_url(), user_path)

    @classmethod
    def get_workspace_calendar_url(cls, workspace_id: int):
        workspace_path = CALENDAR_WORKSPACE_URL_TEMPLATE.format(
            id=str(workspace_id)
        )
        return os.path.join(cls.get_base_url(), workspace_path)

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

        try:
            return self.get_calendar(type, id, path)
        except NoResultFound as exc:
            raise NotFound(str(exc))

    def get_calendar(self, type: str, id: str, path: str) -> Calendar:
        """
        Return tracim.model.organisational.Calendar instance for given
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
            workspace = UnsafeWorkspaceApi(self._user).get_one(id)
            return WorkspaceCalendar(workspace, path=path)

        raise UnknownCalendarType('Type "{0}" is not implemented'.format(type))

    def add_event(
            self,
            calendar: Calendar,
            event: iCalendarEvent,
            event_name: str,
            owner: User,
    ) -> Content:
        """
        Create Content event type.
        :param calendar: Event calendar owner
        :param event: ICS event
        :param event_name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :param owner: Event Owner
        :return: Created Content
        """
        workspace = None
        if isinstance(calendar, WorkspaceCalendar):
            workspace = calendar.related_object
        elif isinstance(calendar, UserCalendar):
            pass
        else:
            raise UnknownCalendarType('Type "{0}" is not implemented'
                                      .format(type(calendar)))

        content = ContentApi(owner).create(
            content_type=ContentType.Event,
            workspace=workspace,
            do_save=False
        )
        self.populate_content_with_event(
            content,
            event,
            event_name
        )
        content.revision_type = ActionDescription.CREATION
        DBSession.add(content)
        DBSession.flush()
        transaction.commit()

        return content

    def update_event(
            self,
            calendar: Calendar,
            event: iCalendarEvent,
            event_name: str,
            current_user: User,
    ) -> Content:
        """
        Update Content Event
        :param calendar: Event calendar owner
        :param event: ICS event
        :param event_name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :param current_user: Current modification asking user
        :return: Updated Content
        """
        workspace = None
        if isinstance(calendar, WorkspaceCalendar):
            workspace = calendar.related_object
        elif isinstance(calendar, UserCalendar):
            pass
        else:
            raise UnknownCalendarType('Type "{0}" is not implemented'
                                      .format(type(calendar)))

        content_api = ContentApi(
            current_user,
            force_show_all_types=True,
            disable_user_workspaces_filter=True
        )
        content = content_api.find_one_by_unique_property(
            property_name='name',
            property_value=event_name,
            workspace=workspace
        )

        with new_revision(content):
            self.populate_content_with_event(
                content,
                event,
                event_name
            )
            content.revision_type = ActionDescription.EDITION

        DBSession.flush()
        transaction.commit()

        return content

    def delete_event_with_name(self, event_name: str, current_user: User)\
            -> Content:
        """
        Delete Content Event
        :param event_name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :param current_user: Current deletion asking user
        :return: Deleted Content
        """
        content_api = ContentApi(current_user, force_show_all_types=True)
        content = content_api.find_one_by_unique_property(
            property_name='name',
            property_value=event_name,
            workspace=None
        )

        with new_revision(content):
            content_api.delete(content)

        DBSession.flush()
        transaction.commit()

        return content

    def populate_content_with_event(
            self,
            content: Content,
            event: iCalendarEvent,
            event_name: str,
    ) -> None:
        """
        Populate Content content instance from iCalendarEvent event attributes.
        :param content: content to populate
        :param event: event with data to insert in content
        :param event_name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :return: given content
        """
        content.label = event.get('summary')
        content.description = event.get('description')
        content.properties = {
            'name': event_name,
            'location': event.get('location'),
            'raw': event.to_ical().decode("utf-8"),
            'start': event.get('dtend').dt.strftime('%Y-%m-%d %H:%M:%S%z'),
            'end': event.get('dtstart').dt.strftime('%Y-%m-%d %H:%M:%S%z'),
        }

    @classmethod
    def get_workspace_readable_calendars_urls_for_user(cls, user: User)\
            -> [str]:
        calendar_urls = []
        for workspace in cls.get_workspace_readable_calendars_for_user(user):
            calendar_urls.append(cls.get_workspace_calendar_url(
                workspace_id=workspace.workspace_id,
            ))

        return calendar_urls

    @classmethod
    def get_workspace_readable_calendars_for_user(cls, user: User)\
            -> ['Workspace']:
        workspaces = []
        workspace_api = WorkspaceApi(user)

        for workspace in workspace_api.get_all():
            if workspace.calendar_enabled:
                workspaces.append(workspace)

        return workspaces

    def is_discovery_path(self, path: str) -> bool:
        """
        If collection url in one of them, Caldav client is tring to discover
        collections.
        :param path: collection path
        :return: True if given collection path is an discover path
        """
        return path in ('user', 'workspace')
