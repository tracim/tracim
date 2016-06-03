# -*- coding: utf-8 -*-

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


def add_signal_handler(signal_id, handler, execute_before=True) -> None:
    """
    Add a callback attached to python signal.
    :param signal_id: signal identifier (eg. signal.SIGTERM)
    :param handler: callback to execute when signal trig
    :param execute_before: If True, callback is executed before eventual
    existing callback on given dignal id.
    """
    previous_handler = signal.getsignal(signal_id)

    def call_callback(*args, **kwargs):
        if not execute_before and callable(previous_handler):
            previous_handler(*args, **kwargs)

        handler(*args, **kwargs)

        if execute_before and callable(previous_handler):
            previous_handler(*args, **kwargs)

    signal.signal(signal_id, call_callback)
