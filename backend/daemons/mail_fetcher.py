# coding=utf-8
# Runner for daemon
from tracim_backend.lib.utils.daemon import initialize_config_from_environment
from tracim_backend.lib.mail_fetcher.daemon import MailFetcherDaemon

app_config = initialize_config_from_environment()
daemon = MailFetcherDaemon(app_config, burst=False)
daemon.run()
