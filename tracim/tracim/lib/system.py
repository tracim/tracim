# -*- coding: utf-8 -*-
import os
import signal

from tracim.lib.daemons import DaemonsManager


class InterruptManager(object):
    """
    Manager interruption of tracim components.

    Stop all tracim daemons, then:

    With a specific production server like uWSGI, we should use master
    FIFO system to exit properly the program:
    https://github.com/unbit/uwsgi/issues/849. But to be generic, we resend the
    signal after intercept it.
    """
    def __init__(
            self,
            tracim_process_pid: int,
            daemons_manager: DaemonsManager,
    ) -> None:
        """
        :param tracim_process_pid: pid of tracim.
        :param daemons_manager: Tracim daemons manager
        """
        self.daemons_manager = daemons_manager
        self.tracim_process_pid = tracim_process_pid
        self._install_sgnal_handlers()

    def _install_sgnal_handlers(self) -> None:
        """
        Install signal handler to intercept SIGINT and SIGTERM signals
        """
        signal.signal(signal.SIGTERM, self.stop)
        signal.signal(signal.SIGINT, self.stop)

    def _remove_signal_handlers(self) -> None:
        """
        Remove installed signals to permit stop of main thread.
        """
        signal.signal(signal.SIGTERM, signal.SIG_DFL)
        signal.signal(signal.SIGINT, signal.SIG_DFL)

    def stop(self, signum, frame) -> None:
        """
        Run stopping process needed when tracim have to stop.
        :param signum: signal interruption value
        :param frame: frame of signal origin
        """
        self._remove_signal_handlers()
        self.daemons_manager.stop_all()
        os.kill(self.tracim_process_pid, signum)
