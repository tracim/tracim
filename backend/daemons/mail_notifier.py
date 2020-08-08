# coding=utf-8
# Runner for daemon
from tracim_backend.lib.mail_notifier.daemon import MailSenderDaemon
from tracim_backend.lib.utils.daemon import initialize_config_from_environment

app_config = initialize_config_from_environment()
daemon = MailSenderDaemon(app_config, burst=False)
daemon.run()
