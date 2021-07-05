import typing

from tracim_backend.config import CFG
from tracim_backend.lib.mail_fetcher.email_fetcher import MailFetcher
from tracim_backend.lib.utils.daemon import FakeDaemon
from tracim_backend.lib.utils.logger import logger
from tracim_backend.views import BASE_API


class MailFetcherDaemon(FakeDaemon):
    """
    Thread containing a daemon who fetch new mail from a mailbox and
    send http request to a tracim endpoint to handle them.
    """

    def __init__(self, config: "CFG", burst=True, *args, **kwargs):
        """
        :param config: Tracim Config
        :param burst: if true, run one time, if false, run continuously
        """
        super().__init__(*args, **kwargs)
        self.config = config
        self._fetcher = None  # type: MailFetcher
        self.burst = burst

    def append_thread_callback(self, callback: typing.Callable) -> None:
        logger.warning("MailFetcherDaemon does not implement append_thread_callback")
        pass

    def stop(self) -> None:
        if self._fetcher:
            self._fetcher.stop()

    def run(self) -> None:
        self._fetcher = MailFetcher(
            host=self.config.EMAIL__REPLY__IMAP__SERVER,
            port=self.config.EMAIL__REPLY__IMAP__PORT,
            user=self.config.EMAIL__REPLY__IMAP__USER,
            password=self.config.EMAIL__REPLY__IMAP__PASSWORD,
            use_ssl=self.config.EMAIL__REPLY__IMAP__USE_SSL,
            folder=self.config.EMAIL__REPLY__IMAP__FOLDER,
            heartbeat=self.config.EMAIL__REPLY__CHECK__HEARTBEAT,
            use_idle=self.config.EMAIL__REPLY__IMAP__USE_IDLE,
            connection_max_lifetime=self.config.EMAIL__REPLY__CONNECTION__MAX_LIFETIME,
            api_base_url=self.config.WEBSITE__BASE_URL + BASE_API,
            api_key=self.config.API__KEY,
            reply_to_pattern=self.config.EMAIL__NOTIFICATION__REPLY_TO__EMAIL,
            references_pattern=self.config.EMAIL__NOTIFICATION__REFERENCES__EMAIL,
            use_html_parsing=self.config.EMAIL__REPLY__USE_HTML_PARSING,
            use_txt_parsing=self.config.EMAIL__REPLY__USE_TXT_PARSING,
            lockfile_path=self.config.EMAIL__REPLY__LOCKFILE_PATH,
            burst=self.burst,
        )
        self._fetcher.run()
