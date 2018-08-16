import typing
from tracim_backend.lib.mail_fetcher.email_fetcher import MailFetcher
from tracim_backend.lib.utils.daemon import FakeDaemon
from tracim_backend.lib.utils.logger import logger


class MailFetcherDaemon(FakeDaemon):
    """
    Thread containing a daemon who fetch new mail from a mailbox and
    send http request to a tracim endpoint to handle them.
    """
    def __init__(self, config: 'CFG', *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.config = config
        self._fetcher = None  # type: MailFetcher

    def append_thread_callback(self, callback: typing.Callable) -> None:
        logger.warning('MailFetcherrDaemon not implement append_thread_callback')
        pass

    def stop(self) -> None:
        if self._fetcher:
            self._fetcher.stop()

    def run(self) -> None:
        self._fetcher = MailFetcher(
            host=self.config.EMAIL_REPLY_IMAP_SERVER,
            port=self.config.EMAIL_REPLY_IMAP_PORT,
            user=self.config.EMAIL_REPLY_IMAP_USER,
            password=self.config.EMAIL_REPLY_IMAP_PASSWORD,
            use_ssl=self.config.EMAIL_REPLY_IMAP_USE_SSL,
            folder=self.config.EMAIL_REPLY_IMAP_FOLDER,
            heartbeat=self.config.EMAIL_REPLY_CHECK_HEARTBEAT,
            use_idle=self.config.EMAIL_REPLY_IMAP_USE_IDLE,
            connection_max_lifetime=self.config.EMAIL_REPLY_CONNECTION_MAX_LIFETIME,  # nopep8
            # FIXME - G.M - 2017-11-15 - proper tracim url formatting
            endpoint=self.config.WEBSITE_BASE_URL + "/events",
            token=self.config.EMAIL_REPLY_TOKEN,
            use_html_parsing=self.config.EMAIL_REPLY_USE_HTML_PARSING,
            use_txt_parsing=self.config.EMAIL_REPLY_USE_TXT_PARSING,
            lockfile_path=self.config.EMAIL_REPLY_LOCKFILE_PATH,
        )
        self._fetcher.run()
