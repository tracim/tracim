# -*- coding: utf-8 -*-


class TracimError(Exception):
    pass


class AlreadyExistError(TracimError):
    pass


class CommandError(TracimError):
    pass


class CommandAbortedError(CommandError):
    pass
