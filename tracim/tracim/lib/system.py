# -*- coding: utf-8 -*-
import os
import signal

from tracim.lib.daemons import DaemonsManager


class InterruptManager(object):
    def __init__(self, daemons_manager: DaemonsManager):
        self.daemons_manager = daemons_manager
        self.process_pid = os.getpid()
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
        # Web server is managed by end of stack like uwsgi, apache2.
        # So to ask it's termination, we have to use standard kills signals
        os.kill(self.process_pid, signum)
