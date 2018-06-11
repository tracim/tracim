# -*- coding: utf-8 -*-


class TracimError(Exception):
    pass


class TracimException(Exception):
    pass


class RunTimeError(TracimError):
    pass


class ContentRevisionUpdateError(RuntimeError):
    pass


class ContentRevisionDeleteError(ContentRevisionUpdateError):
    pass


class ConfigurationError(TracimError):
    pass


class AlreadyExistError(TracimError):
    pass


class CommandError(TracimError):
    pass


class CommandAbortedError(CommandError):
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


class SameValueError(ValueError):
    pass


class NotAuthentificated(TracimException):
    pass


class WorkspaceNotFound(NotFound):
    pass


class InsufficientUserWorkspaceRole(TracimException):
    pass


class InsufficientUserProfile(TracimException):
    pass


class ImmutableAttribute(TracimException):
    pass


class DigestAuthNotImplemented(Exception):
    pass


class AuthenticationFailed(TracimException):
    pass


class WrongUserPassword(TracimException):
    pass


class UserNotExist(TracimException):
    pass


class NotificationNotSend(TracimException):
    pass
