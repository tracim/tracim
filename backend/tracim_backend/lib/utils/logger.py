# -*- coding: utf-8 -*-
import logging
import time

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

    def __init__(self, logger_name):
        self._name = logger_name
        self._logger = logging.getLogger(self._name)

    @classmethod
    def _txt(cls, instance_or_class):
        if instance_or_class.__class__.__name__ in ("function", "type"):
            return instance_or_class.__name__
        else:
            return instance_or_class.__class__.__name__

    def debug(self, instance_or_class, message):
        self._logger.debug(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))

    def error(self, instance_or_class, message, exc_info=0):
        self._logger.error(
            Logger.TPL.format(cls=self._txt(instance_or_class), msg=message, exc_info=exc_info)
        )

    def info(self, instance_or_class, message):
        self._logger.info(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))

    def warning(self, instance_or_class, message):
        self._logger.warning(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))

    def critical(self, instance_or_class, message):
        self._logger.critical(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))

    def exception(self, instance_or_class, message):
        self._logger.exception(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))


logger = Logger("tracim")
