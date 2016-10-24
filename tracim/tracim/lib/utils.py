# -*- coding: utf-8 -*-
import os
import time
import signal

from tracim.lib.base import logger

def exec_time_monitor():
    def decorator_func(func):
        def wrapper_func(*args, **kwargs):
            start = time.time()
            retval = func(*args, **kwargs)
            end = time.time()
            logger.debug(func, 'exec time: {} seconds'.format(end-start))
            return retval
        return wrapper_func
    return decorator_func


class SameValueError(ValueError):
    pass


def replace_reset_password_templates(engines):
    try:
        if engines['text/html'][1] == 'resetpassword.templates.index':
            engines['text/html'] = (
                'mako',
                'tracim.templates.reset_password_index',
                engines['text/html'][2],
                engines['text/html'][3]
            )

        if engines['text/html'][1] == 'resetpassword.templates.change_password':
            engines['text/html'] = (
                'mako',
                'tracim.templates.reset_password_change_password',
                engines['text/html'][2],
                engines['text/html'][3]
            )
    except IndexError:
        pass
    except KeyError:
        pass


@property
def NotImplemented():
    raise NotImplementedError()


def add_signal_handler(signal_id, handler) -> None:
    """
    Add a callback attached to python signal.
    :param signal_id: signal identifier (eg. signal.SIGTERM)
    :param handler: callback to execute when signal trig
    """
    def _handler(*args, **kwargs):
        handler()
        signal.signal(signal_id, signal.SIG_DFL)
        os.kill(os.getpid(), signal_id)  # Rethrow signal

    signal.signal(signal_id, _handler)
