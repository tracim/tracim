from contextlib import contextmanager

from radicale.storage.filesystem import Collection as BaseCollection
from icalendar import Event as iCalendarEvent
from radicale.ical import Event as RadicaleEvent

from tracim.lib.calendar import CalendarManager
from tracim.lib.radicale.auth import Auth
from tracim.model import Content


class Collection(BaseCollection):
    """
    Radicale use it's own storage system but this override create, update
    and delete events in our database.
    """

    def __init__(self, path: str, principal: bool=False):
        super().__init__(path, principal)
        self._replacing = False  # See ``replacing`` context manager
        self._manager = CalendarManager(None)

    @contextmanager
    def replacing(self):
        """
        Radicale filesystem storage make a ``remove`` then an ``append`` to
        update an item. So to know what we are in update context when
        ``append`` and ``remove`` functions are called, use this context
        manager in ``replace`` function.
        """
        try:
            self._replacing = True
            yield self
        finally:
            self._replacing = False

    def replace(self, name: str, text: str) -> None:
        """
        Override of parent replace to manage event update action. See
        ``replacing`` context manager for more informations.
        :param name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :param text: ICS Event content
        """
        with self.replacing():
            super().replace(name, text)
        self._update_tracim_event(name, text)

    def remove(self, name: str) -> None:
        """
        :param name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        """
        super().remove(name)
        if not self._replacing:
            self._remove_tracim_event(name)

    def append(self, name: str, text: str) -> None:
        """
        :param name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :param text: ICS Event content
        """
        super().append(name, text)
        if not self._replacing:
            self._add_tracim_event(name, text)

    def _add_tracim_event(self, name: str, text: str) -> Content:
        """
        Create tracim internal Event (Content) with Radicale given data.
        :param name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :param text: ICS Event content
        :return: Created Content
        """
        event = self._extract_event(name, text)
        calendar = self._manager.find_calendar_with_path(self.path)
        return self._manager.add_event(
            calendar=calendar,
            event=event,
            event_name=name,
            owner=Auth.current_user
        )

    def _update_tracim_event(self, name: str, text: str) -> Content:
        """
        Update tracim internal Event (Content) with Radicale given data.
        :param name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :param text: ICS Event content
        :return: Updated Content
        """
        event = self._extract_event(name, text)
        calendar = self._manager.find_calendar_with_path(self.path)
        return self._manager.update_event(
            calendar=calendar,
            event=event,
            event_name=name,
            current_user=Auth.current_user
        )

    def _remove_tracim_event(self, name: str) -> Content:
        """
        Delete internal tracim Event (Content) with given Event name.
        :param name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :return: Deleted Content
        """
        return self._manager.delete_event_with_name(name, Auth.current_user)

    def _extract_event(self, name: str, text: str) -> iCalendarEvent:
        """
        Return a icalendar.cal.Event construct with given Radicale ICS data.
        :param name: Event name (ID) like
        20160602T083511Z-18100-1001-1-71_Bastien-20160602T083516Z.ics
        :param text: ICS Event content
        :return: ICS Event representation
        """
        radicale_items = self._parse(text, (RadicaleEvent,), name)
        for item_name in radicale_items:
            item = radicale_items[item_name]
            if isinstance(item, RadicaleEvent):
                return iCalendarEvent.from_ical(item.text)
