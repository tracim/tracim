import typing

from tracim_backend.config import CFG
from tracim_backend.lib.user_connection_state_monitor.monitor import UserConnectionStateMonitor
from tracim_backend.lib.utils.daemon import FakeDaemon
from tracim_backend.lib.utils.logger import logger


class UserConnectionStateMonitorDaemon(FakeDaemon):
    """
    Thread containing a daemon who fetch new mail from a mailbox and
    send http request to a tracim endpoint to handle them.
    """

    def __init__(self, config: CFG, burst=True, *args, **kwargs):
        """
        :param config: Tracim Config
        :param burst: if true, run one time, if false, run continuously
        """
        super().__init__(*args, **kwargs)
        self.config = config
        self._user_connection_state_monitor = None  # type: UserConnectionStateMonitor
        self.burst = burst

    def append_thread_callback(self, callback: typing.Callable) -> None:
        logger.warning("UserConnectionStateDaemon does not implement append_thread_callback")
        pass

    def stop(self) -> None:
        if self._user_connection_state_monitor:
            self._user_connection_state_monitor.stop()

    def run(self) -> None:
        self._user_connection_state_monitor = UserConnectionStateMonitor(config=self.config)
        self._user_connection_state_monitor.run()
