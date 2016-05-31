class TracimException(Exception):
    pass


class DaemonException(TracimException):
    pass


class AlreadyRunningDaemon(DaemonException):
    pass


class CalendarException(TracimException):
    pass


class UnknownCalendarType(CalendarException):
    pass


class NotFound(TracimException):
    pass
