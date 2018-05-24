from sqlalchemy.orm import collections

from tracim.lib.utils.logger import logger
from tracim.lib.utils.utils import get_rq_queue
from tracim.lib.utils.utils import get_redis_connection
from rq.dummy import do_nothing
from rq.worker import StopRequested
from rq import Connection as RQConnection
from rq import Worker as BaseRQWorker


class FakeDaemon(object):
    """
    Temporary class for transition between tracim 1 and tracim 2
    """
    def __init__(self, config, *args, **kwargs):
        pass


class MailSenderDaemon(FakeDaemon):
    # NOTE: use *args and **kwargs because parent __init__ use strange
    # * parameter
    def __init__(self, config, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.config = config
        self.worker = None  # type: RQWorker

    def append_thread_callback(self, callback: collections.Callable) -> None:
        logger.warning('MailSenderDaemon not implement append_thread_callback')
        pass

    def stop(self) -> None:
        # When _stop_requested at False, tracim.lib.daemons.RQWorker
        # will raise StopRequested exception in worker thread after receive a
        # job.
        self.worker._stop_requested = True
        redis_connection = get_redis_connection(self.config)
        queue = get_rq_queue(redis_connection, 'mail_sender')
        queue.enqueue(do_nothing)

    def run(self) -> None:

        with RQConnection(get_redis_connection(self.config)):
            self.worker = RQWorker(['mail_sender'])
            self.worker.work()


class RQWorker(BaseRQWorker):
    def _install_signal_handlers(self):
        # RQ Worker is designed to work in main thread
        # So we have to disable these signals (we implement server stop in
        # MailSenderDaemon.stop method).
        pass

    def dequeue_job_and_maintain_ttl(self, timeout):
        # RQ Worker is designed to work in main thread, so we add behaviour
        # here: if _stop_requested has been set to True, raise the standard way
        # StopRequested exception to stop worker.
        if self._stop_requested:
            raise StopRequested()
        return super().dequeue_job_and_maintain_ttl(timeout)