# -*- coding: utf-8 -*-
from email.mime.multipart import MIMEMultipart
import smtplib
import typing

from tracim_backend.config import CFG
from tracim_backend.lib.mail_notifier.utils import SmtpConfiguration
from tracim_backend.lib.mail_notifier.utils import SmtpEncryption
from tracim_backend.lib.rq import RqQueueName
from tracim_backend.lib.rq import get_redis_connection
from tracim_backend.lib.rq import get_rq_queue
from tracim_backend.lib.utils.logger import logger


def send_email_through(
    config: CFG, sendmail_callable: typing.Callable[[MIMEMultipart], None], message: MIMEMultipart
) -> None:
    """
    Send mail encapsulation to send it in async or sync mode.

    TODO BS 20170126: A global mail/sender management should be a good
                      thing. Actually, this method is an fast solution.
    :param config: system configuration
    :param sendmail_callable: A callable who get message on first parameter
    :param message: The message who have to be sent
    """
    if config.JOBS__PROCESSING_MODE == config.CST.SYNC:
        logger.info(send_email_through, "send email to {} synchronously".format(message["To"]))
        sendmail_callable(message)
    elif config.JOBS__PROCESSING_MODE == config.CST.ASYNC:
        logger.info(
            send_email_through,
            "send email to {} asynchronously:"
            "mail stored in queue in wait for a"
            "mail_notifier daemon".format(message["To"]),
        )
        redis_connection = get_redis_connection(config)
        queue = get_rq_queue(redis_connection, RqQueueName.MAIL_SENDER)
        queue.enqueue(sendmail_callable, message)
    else:
        raise NotImplementedError(
            "Mail sender processing mode {} is not implemented".format(config.JOBS__PROCESSING_MODE)
        )


class EmailSender(object):
    """
    Independent email sender class.

    To allow its use in any thread, as an asyncjob_perform() call for
    example, it has no dependencies on SQLAlchemy nor tg HTTP request.
    """

    def __init__(self, config: CFG, smtp_config: SmtpConfiguration, really_send_messages) -> None:
        self._smtp_config = smtp_config
        self.config = config
        self._smtp_connection = None
        self._is_active = really_send_messages

    def connect(self):
        if not self._smtp_connection:
            log = "Connecting to SMTP server {}"
            logger.info(self, log.format(self._smtp_config.server))
            if self._smtp_config.encryption == SmtpEncryption.SMTPS:
                self._smtp_connection = smtplib.SMTP_SSL(
                    self._smtp_config.server, self._smtp_config.port
                )
            else:
                self._smtp_connection = smtplib.SMTP(
                    self._smtp_config.server, self._smtp_config.port
                )
            self._smtp_connection.ehlo()

            if self._smtp_config.encryption == SmtpEncryption.DEFAULT:
                try:
                    starttls_result = self._smtp_connection.starttls()

                    if starttls_result[0] == 220:
                        logger.info(self, "SMTP Start TLS OK")

                    log = "SMTP Start TLS return code: {} with message: {}"
                    logger.debug(
                        self, log.format(starttls_result[0], starttls_result[1].decode("utf-8"))
                    )
                except smtplib.SMTPResponseException as exc:
                    log = "SMTP start TLS return error code: {} with message: {}"
                    logger.error(self, log.format(exc.smtp_code, exc.smtp_error.decode("utf-8")))
                except Exception:
                    log = "Unexpected exception during SMTP start TLS process"
                    logger.exception(self, log)

            if self._smtp_config.authentication:
                try:
                    login_res = self._smtp_connection.login(
                        self._smtp_config.login, self._smtp_config.password
                    )

                    if login_res[0] == 235:
                        logger.info(self, "SMTP Authentication Successful")
                    if login_res[0] == 503:
                        logger.info(self, "SMTP Already Authenticated")

                    log = "SMTP login return code: {} with message: {}"
                    logger.debug(self, log.format(login_res[0], login_res[1].decode("utf-8")))
                except smtplib.SMTPAuthenticationError as exc:
                    log = "SMTP auth return error code: {} with message: {}"
                    logger.error(self, log.format(exc.smtp_code, exc.smtp_error.decode("utf-8")))
                    logger.error(
                        self, "check your auth params combinaison " "(login/password) for SMTP"
                    )
                except smtplib.SMTPResponseException as exc:
                    log = "SMTP login return error code: {} with message: {}"
                    logger.error(self, log.format(exc.smtp_code, exc.smtp_error.decode("utf-8")))
                except Exception:
                    log = "Unexpected exception during SMTP login"
                    logger.exception(self, log)

    def disconnect(self):
        if self._smtp_connection:
            log = "Disconnecting from SMTP server {}"
            logger.info(self, log.format(self._smtp_config.server))
            self._smtp_connection.quit()
            logger.info(self, "Connection closed.")

    def send_mail(self, message: MIMEMultipart):
        if not self._is_active:
            log = "Not sending email to {} (service disabled)"
            logger.info(self, log.format(message["To"]))
        else:
            self.connect()  # Actually, this connects to SMTP only if required
            logger.info(self, "Sending email to {}".format(message["To"]))
            # TODO - G.M - 2019-01-29 - optimisize this code, we should not send
            # email if connection has failed.
            send_action = "{:8s}".format("SENT")
            failed_action = "{:8s}".format("SENDFAIL")
            action = send_action
            try:
                send_message_result = self._smtp_connection.send_message(message)
                # INFO - G.M - 2019-01-29 - send_message return if not failed,
                # dict of refused recipients.

                if send_message_result == {}:
                    logger.debug(self, "One mail correctly sent using SMTP.")
                else:
                    # INFO - G.M - 2019-01-29 - send_message_result != {}
                    # case should not happened
                    # as we send not mail with multiple recipient at the same
                    # time. send_message will not raise exception
                    # just if some recipient work and some other failed.
                    # TODO - G.M - 2019-01-29 - better support for multirecipient email
                    log = "Mail could not be send to some recipient: {}"
                    logger.debug(self, log.format(send_message_result))
                    action = failed_action

            except smtplib.SMTPException:
                log = "SMTP sending message return error"
                logger.exception(self, log)
                action = failed_action
            except Exception:
                log = "Unexpected exception during sending email message using SMTP"
                logger.exception(self, log)
                action = failed_action

            from tracim_backend.lib.mail_notifier.notifier import EmailManager

            if action == send_action:
                msg = "an email was sended to {}".format(message["To"])
            else:
                msg = "fail to send email to {}".format(message["To"])

            EmailManager.log_email_notification(
                msg=msg,
                action=action,
                email_recipient=message["To"],
                email_subject=message["Subject"],
                config=self.config,
            )
