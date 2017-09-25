# -*- coding: utf-8 -*-
import smtplib
import typing
from email.message import Message
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from mako.template import Template
from tg.i18n import ugettext as _

from tracim.lib.base import logger
from tracim.lib.utils import get_rq_queue
from tracim.model import User


def send_email_through(
        sendmail_callable: typing.Callable[[Message], None],
        message: Message,
) -> None:
    """
    Send mail encapsulation to send it in async or sync mode.

    TODO BS 20170126: A global mail/sender management should be a good
                      thing. Actually, this method is an fast solution.
    :param sendmail_callable: A callable who get message on first parameter
    :param message: The message who have to be sent
    """
    from tracim.config.app_cfg import CFG
    cfg = CFG.get_instance()

    if cfg.EMAIL_PROCESSING_MODE == CFG.CST.SYNC:
        sendmail_callable(message)
    elif cfg.EMAIL_PROCESSING_MODE == CFG.CST.ASYNC:
        queue = get_rq_queue('mail_sender')
        queue.enqueue(sendmail_callable, message)
    else:
        raise NotImplementedError(
            'Mail sender processing mode {} is not implemented'.format(
                cfg.EMAIL_PROCESSING_MODE,
            )
        )


class SmtpConfiguration(object):
    """Container class for SMTP configuration used in Tracim."""

    def __init__(self, server: str, port: int, login: str, password: str):
        self.server = server
        self.port = port
        self.login = login
        self.password = password


class EmailSender(object):
    """
    Independent email sender class.

    To allow its use in any thread, as an asyncjob_perform() call for
    example, it has no dependencies on SQLAlchemy nor tg HTTP request.
    """

    def __init__(self, config: SmtpConfiguration, really_send_messages):
        self._smtp_config = config
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
            from tracim.lib.notifications import EmailNotifier
            EmailNotifier.log_notification(
                action='   SENT',
                recipient=message['To'],
                subject=message['Subject'],
            )


class EmailManager(object):
    def __init__(self, smtp_config: SmtpConfiguration, global_config):
        self._smtp_config = smtp_config
        self._global_config = global_config

    def notify_created_account(
            self,
            user: User,
            password: str,
    ) -> None:
        """
        Send created account email to given user.

        :param password: choosed password
        :param user: user to notify
        """
        # TODO BS 20160712: Cyclic import
        from tracim.lib.notifications import EST

        logger.debug(self, 'user: {}'.format(user.user_id))
        logger.info(self, 'Sending asynchronous email to 1 user ({0})'.format(
            user.email,
        ))

        async_email_sender = EmailSender(
            self._smtp_config,
            self._global_config.EMAIL_NOTIFICATION_ACTIVATED
        )

        subject = \
            self._global_config.EMAIL_NOTIFICATION_CREATED_ACCOUNT_SUBJECT \
            .replace(
                EST.WEBSITE_TITLE,
                self._global_config.WEBSITE_TITLE.__str__()
            )
        message = MIMEMultipart('alternative')
        message['Subject'] = subject
        message['From'] = '{0} <{1}>'.format(
            self._global_config.EMAIL_NOTIFICATION_FROM_DEFAULT_LABEL,
            self._global_config.EMAIL_NOTIFICATION_FROM_EMAIL,
        )
        message['To'] = user.email

        text_template_file_path = self._global_config.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_TEXT  # nopep8
        html_template_file_path = self._global_config.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_HTML  # nopep8

        body_text = self._render(
            mako_template_filepath=text_template_file_path,
            context={
                'user': user,
                'password': password,
                'login_url': self._global_config.WEBSITE_BASE_URL,
            }
        )

        body_html = self._render(
            mako_template_filepath=html_template_file_path,
            context={
                'user': user,
                'password': password,
                'login_url': self._global_config.WEBSITE_BASE_URL,
            }
        )

        part1 = MIMEText(body_text, 'plain', 'utf-8')
        part2 = MIMEText(body_html, 'html', 'utf-8')

        # Attach parts into message container.
        # According to RFC 2046, the last part of a multipart message,
        # in this case the HTML message, is best and preferred.
        message.attach(part1)
        message.attach(part2)

        send_email_through(async_email_sender.send_mail, message)

    def _render(self, mako_template_filepath: str, context: dict):
        """
        Render mako template with all needed current variables.

        :param mako_template_filepath: file path of mako template
        :param context: dict with template context
        :return: template rendered string
        """
        # TODO - D.A. - 2014-11-06 - move this
        # Import is here for circular import problem
        import tracim.lib.helpers as helpers
        from tracim.config.app_cfg import CFG

        template = Template(filename=mako_template_filepath)
        return template.render(
            base_url=self._global_config.WEBSITE_BASE_URL,
            _=_,
            h=helpers,
            CFG=CFG.get_instance(),
            **context
        )


def get_email_manager():
    """
    :return: EmailManager instance
    """
    #  TODO: Find a way to import properly without cyclic import
    from tracim.config.app_cfg import CFG

    global_config = CFG.get_instance()
    smtp_config = SmtpConfiguration(
        global_config.EMAIL_NOTIFICATION_SMTP_SERVER,
        global_config.EMAIL_NOTIFICATION_SMTP_PORT,
        global_config.EMAIL_NOTIFICATION_SMTP_USER,
        global_config.EMAIL_NOTIFICATION_SMTP_PASSWORD
    )

    return EmailManager(global_config=global_config, smtp_config=smtp_config)
