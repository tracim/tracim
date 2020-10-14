# -*- coding: utf-8 -*-
import logging
import time
import typing

from colorlog import colorlog


class StandardUTCFormatter(logging.Formatter):
    converter = time.gmtime


class ColoredUTCFormatter(colorlog.ColoredFormatter):
    converter = time.gmtime


class Logger(object):
    """
    Global logger
    """

    TPL = "[{cls}] {msg}"

    def __init__(self, logger_name: str):
        self._name = logger_name
        self._logger = logging.getLogger(self._name)

    @classmethod
    def _txt(cls, instance_or_class: typing.Any):
        if instance_or_class.__class__.__name__ in ("function", "type"):
            return instance_or_class.__name__
        else:
            return instance_or_class.__class__.__name__

    def _msg(self, instance_or_class: typing.Any, msg: typing.Union[str, Exception]):
        return Logger.TPL.format(cls=self._txt(instance_or_class), msg=msg)

    def debug(self, instance_or_class, message: str, exc_info: bool = False):
        self._logger.debug(msg=self._msg(instance_or_class, message), exc_info=exc_info)

    def error(self, instance_or_class, message: str, exc_info: bool = False):
        self._logger.error(msg=self._msg(instance_or_class, message), exc_info=exc_info)

    def info(self, instance_or_class, message: str, exc_info: bool = False):
        self._logger.info(msg=self._msg(instance_or_class, message), exc_info=exc_info)

    def warning(self, instance_or_class, message: str, exc_info: bool = False):
        self._logger.warning(msg=self._msg(instance_or_class, message), exc_info=exc_info)

    def critical(self, instance_or_class, message: str, exc_info: bool = False):
        self._logger.critical(msg=self._msg(instance_or_class, message), exc_info=exc_info)

    def exception(self, instance_or_class, message: typing.Union[str, Exception]):
        self._logger.exception(msg=self._msg(instance_or_class, message),)


logger = Logger("tracim")
