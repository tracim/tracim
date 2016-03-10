# -*- coding: utf-8 -*-


class TracimError(Exception):
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
