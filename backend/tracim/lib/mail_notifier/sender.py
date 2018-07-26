# -*- coding: utf-8 -*-
import smtplib
import typing
from email.message import Message
from email.mime.multipart import MIMEMultipart

from tracim.config import CFG
from tracim.lib.utils.logger import logger
from tracim.lib.utils.utils import get_rq_queue
from tracim.lib.utils.utils import get_redis_connection
from tracim.lib.mail_notifier.utils import SmtpConfiguration

def send_email_through(
        config: CFG,
        sendmail_callable: typing.Callable[[Message], None],
        message: Message,
) -> None:
    """
    Send mail encapsulation to send it in async or sync mode.

    TODO BS 20170126: A global mail/sender management should be a good
                      thing. Actually, this method is an fast solution.
    :param config: system configuration
    :param sendmail_callable: A callable who get message on first parameter
    :param message: The message who have to be sent
    """

    if config.EMAIL_PROCESSING_MODE == config.CST.SYNC:
        sendmail_callable(message)
    elif config.EMAIL_PROCESSING_MODE == config.CST.ASYNC:
        redis_connection = get_redis_connection(config)
        queue = get_rq_queue(redis_connection, 'mail_sender')
        queue.enqueue(sendmail_callable, message)
    else:
        raise NotImplementedError(
            'Mail sender processing mode {} is not implemented'.format(
                config.EMAIL_PROCESSING_MODE,
            )
        )


class EmailSender(object):
    """
    Independent email sender class.

    To allow its use in any thread, as an asyncjob_perform() call for
    example, it has no dependencies on SQLAlchemy nor tg HTTP request.
    """

    def __init__(
            self,
            config: CFG,
            smtp_config: SmtpConfiguration,
            really_send_messages
    ) -> None:
        self._smtp_config = smtp_config
        self.config = config
        self._smtp_connection = None
        self._is_active = really_send_messages

    def connect(self):
        if not self._smtp_connection:
            log = 'Connecting from SMTP server {}'
            logger.info(self, log.format(self._smtp_config.server))
            self._smtp_connection = smtplib.SMTP(
                self._smtp_config.server,
                self._smtp_config.port
            )
            self._smtp_connection.ehlo()

            if self._smtp_config.login:
                try:
                    starttls_result = self._smtp_connection.starttls()
                    log = 'SMTP start TLS result: {}'
                    logger.debug(self, log.format(starttls_result))
                except Exception as e:
                    log = 'SMTP start TLS error: {}'
                    logger.debug(self, log.format(e.__str__()))

            if self._smtp_config.login:
                try:
                    login_res = self._smtp_connection.login(
                        self._smtp_config.login,
                        self._smtp_config.password
                    )
                    log = 'SMTP login result: {}'
                    logger.debug(self, log.format(login_res))
                except Exception as e:
                    log = 'SMTP login error: {}'
                    logger.debug(self, log.format(e.__str__()))
            logger.info(self, 'Connection OK')

    def disconnect(self):
        if self._smtp_connection:
            log = 'Disconnecting from SMTP server {}'
            logger.info(self, log.format(self._smtp_config.server))
            self._smtp_connection.quit()
            logger.info(self, 'Connection closed.')

    def send_mail(self, message: MIMEMultipart):
        if not self._is_active:
            log = 'Not sending email to {} (service disabled)'
            logger.info(self, log.format(message['To']))
        else:
            self.connect()  # Actually, this connects to SMTP only if required
            logger.info(self, 'Sending email to {}'.format(message['To']))
            self._smtp_connection.send_message(message)
            from tracim.lib.mail_notifier.notifier import EmailManager
            EmailManager.log_notification(
                action='   SENT',
                recipient=message['To'],
                subject=message['Subject'],
                config=self.config,
            )
