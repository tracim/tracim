import typing

from rq import Connection as RQConnection
from rq import Worker as BaseRQWorker
from rq.dummy import do_nothing
from rq.worker import StopRequested

from tracim_backend.config import CFG
from tracim_backend.lib.rq import RqQueueName
from tracim_backend.lib.rq import get_redis_connection
from tracim_backend.lib.rq import get_rq_queue
from tracim_backend.lib.utils.daemon import FakeDaemon
from tracim_backend.lib.utils.logger import logger


class MailSenderDaemon(FakeDaemon):
    # NOTE: use *args and **kwargs because parent __init__ use strange
    # * parameter
    def __init__(self, config: "CFG", burst=True, *args, **kwargs):
        """
        :param config: tracim config
        :param burst: if true, run one time, if false, run continuously
        """
        super().__init__(*args, **kwargs)
        self.config = config
        self.worker = None  # type: RQWorker
        self.burst = burst

    def append_thread_callback(self, callback: typing.Callable) -> None:
        logger.warning("MailSenderDaemon does not implement append_thread_callback")
        pass

    def stop(self) -> None:
        # When _stop_requested at False, tracim.lib.daemons.RQWorker
        # will raise StopRequested exception in worker thread after receive a
        # job.
        self.worker._stop_requested = True
        redis_connection = get_redis_connection(self.config)
        queue = get_rq_queue(redis_connection, RqQueueName.MAIL_SENDER)
        queue.enqueue(do_nothing)

    def run(self) -> None:

        with RQConnection(get_redis_connection(self.config)):
            self.worker = RQWorker([RqQueueName.MAIL_SENDER.value])
            self.worker.work(burst=self.burst)


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
