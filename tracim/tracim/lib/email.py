# -*- coding: utf-8 -*-

from email.mime.multipart import MIMEMultipart
import smtplib

from tracim.lib.base import logger


class SmtpConfiguration(object):
    """
    Container class for SMTP configuration used in Tracim
    """

    def __init__(self, server: str, port: int, login: str, password: str):
        self.server = server
        self.port = port
        self.login = login
        self.password = password



class EmailSender(object):
    """
    this class allow to send emails and has no relations with SQLAlchemy and other tg HTTP request environment
    This means that it can be used in any thread (even through a asyncjob_perform() call
    """
    def __init__(self, config: SmtpConfiguration, really_send_messages):
        self._smtp_config = config
        self._smtp_connection = None
        self._is_active = really_send_messages

    def connect(self):
        if not self._smtp_connection:
            logger.info(self, 'Connecting from SMTP server {}'.format(self._smtp_config.server))
            self._smtp_connection = smtplib.SMTP(self._smtp_config.server, self._smtp_config.port)
            self._smtp_connection.ehlo()
            if self._smtp_config.login:
                try:
                    starttls_result = self._smtp_connection.starttls()
                    logger.debug(self, 'SMTP start TLS result: {}'.format(starttls_result))
                except Exception as e:
                    logger.debug(self, 'SMTP start TLS error: {}'.format(e.__str__()))

            login_res = self._smtp_connection.login(self._smtp_config.login, self._smtp_config.password)
            logger.debug(self, 'SMTP login result: {}'.format(login_res))
            logger.info(self, 'Connection OK')

    def disconnect(self):
        if self._smtp_connection:
            logger.info(self, 'Disconnecting from SMTP server {}'.format(self._smtp_config.server))
            self._smtp_connection.quit()
            logger.info(self, 'Connection closed.')


    def send_mail(self, message: MIMEMultipart):
        if not self._is_active:
            logger.info(self, 'Not sending email to {} (service desactivated)'.format(message['To']))
        else:
            self.connect() # Acutally, this connects to SMTP only if required
            logger.info(self, 'Sending email to {}'.format(message['To']))
            self._smtp_connection.send_message(message)
