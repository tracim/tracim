# -*- coding: utf-8 -*-

import time
import json
import typing
import socket
import ssl

from email import message_from_bytes
from email.header import decode_header
from email.header import make_header
from email.message import Message
from email.utils import parseaddr

import filelock
import markdown
import requests
import imapclient

from email_reply_parser import EmailReplyParser
from tracim.lib.base import logger
from tracim.lib.email_processing.parser import ParsedHTMLMail
from tracim.lib.email_processing.sanitizer import HtmlSanitizer

TRACIM_SPECIAL_KEY_HEADER = 'X-Tracim-Key'
CONTENT_TYPE_TEXT_PLAIN = 'text/plain'
CONTENT_TYPE_TEXT_HTML = 'text/html'

IMAP_CHECKED_FLAG = imapclient.FLAGGED

MAIL_FETCHER_FILELOCK_TIMEOUT = 10
MAIL_FETCHER_CONNECTION_TIMEOUT = 60*3
MAIL_FETCHER_IDLE_RESPONSE_TIMEOUT = 60*9   # this should be not more
# that 29 minutes according to rfc2177.(server wait 30min by default)


class MessageContainer(object):
    def __init__(self, message: Message, uid: int) -> None:
        self.message = message
        self.uid = uid


class DecodedMail(object):
    def __init__(self, message: Message, uid: int=None) -> None:
        self._message = message
        self.uid = uid

    def _decode_header(self, header_title: str) -> typing.Optional[str]:
        # FIXME : Handle exception
        if header_title in self._message:
            return str(make_header(decode_header(self._message[header_title])))
        else:
            return None

    def get_subject(self) -> typing.Optional[str]:
        return self._decode_header('subject')

    def get_from_address(self) -> str:
        return parseaddr(self._message['From'])[1]

    def get_to_address(self) -> str:
        return parseaddr(self._message['To'])[1]

    def get_first_ref(self) -> str:
        return parseaddr(self._message['References'])[1]

    def get_special_key(self) -> typing.Optional[str]:
        return self._decode_header(TRACIM_SPECIAL_KEY_HEADER)

    def get_body(
            self,
            use_html_parsing=True,
            use_txt_parsing=True,
    ) -> typing.Optional[str]:
        body_part = self._get_mime_body_message()
        body = None
        if body_part:
            charset = body_part.get_content_charset('iso-8859-1')
            content_type = body_part.get_content_type()
            if content_type == CONTENT_TYPE_TEXT_PLAIN:
                txt_body = body_part.get_payload(decode=True).decode(
                    charset)
                if use_txt_parsing:
                    txt_body = EmailReplyParser.parse_reply(txt_body)
                html_body = markdown.markdown(txt_body)
                body = HtmlSanitizer.sanitize(html_body)

            elif content_type == CONTENT_TYPE_TEXT_HTML:
                html_body = body_part.get_payload(decode=True).decode(
                    charset)
                if use_html_parsing:
                    html_body = str(ParsedHTMLMail(html_body))
                body = HtmlSanitizer.sanitize(html_body)

        return body

    def _get_mime_body_message(self) -> typing.Optional[Message]:
        # TODO - G.M - 2017-11-16 - Use stdlib msg.get_body feature for py3.6+
        part = None
        # Check for html
        for part in self._message.walk():
            content_type = part.get_content_type()
            content_dispo = str(part.get('Content-Disposition'))
            if content_type == CONTENT_TYPE_TEXT_HTML \
                    and 'attachment' not in content_dispo:
                return part
        # check for plain text
        for part in self._message.walk():
            content_type = part.get_content_type()
            content_dispo = str(part.get('Content-Disposition'))
            if content_type == CONTENT_TYPE_TEXT_PLAIN \
                    and 'attachment' not in content_dispo:
                return part
        return part

    def get_key(self) -> typing.Optional[str]:

        """
        key is the string contain in some mail header we need to retrieve.
        First try checking special header, them check 'to' header
        and finally check first(oldest) mail-id of 'references' header
        """
        first_ref = self.get_first_ref()
        to_address = self.get_to_address()
        special_key = self.get_special_key()

        if special_key:
            return special_key
        if to_address:
            return DecodedMail.find_key_from_mail_address(to_address)
        if first_ref:
            return DecodedMail.find_key_from_mail_address(first_ref)

        return None

    @classmethod
    def find_key_from_mail_address(
        cls,
        mail_address: str,
    ) -> typing.Optional[str]:
        """ Parse mail_adress-like string
        to retrieve key.

        :param mail_address: user+key@something like string
        :return: key
        """
        username = mail_address.split('@')[0]
        username_data = username.split('+')
        if len(username_data) == 2:
            return username_data[1]
        return None


class BadIMAPFetchResponse(Exception):
    pass


class MailFetcher(object):
    def __init__(
        self,
        host: str,
        port: str,
        user: str,
        password: str,
        use_ssl: bool,
        folder: str,
        use_idle: bool,
        connection_max_lifetime: int,
        heartbeat: int,
        endpoint: str,
        token: str,
        use_html_parsing: bool,
        use_txt_parsing: bool,
        lockfile_path: str,
    ) -> None:
        """
        Fetch mail from a mailbox folder through IMAP and add their content to
        Tracim through http according to mail Headers.
        Fetch is regular.
        :param host: imap server hostname
        :param port: imap connection port
        :param user: user login of mailbox
        :param password: user password of mailbox
        :param use_ssl: use imap over ssl connection
        :param folder: mail folder where new mail are fetched
        :param use_idle: use IMAP IDLE(server notification) when available
        :param heartbeat: seconds to wait before fetching new mail again
        :param connection_max_lifetime: maximum duration allowed for a
             connection . connection are automatically renew when their
             lifetime excess this duration.
        :param endpoint: tracim http endpoint where decoded mail are send.
        :param token: token to authenticate http connexion
        :param use_html_parsing: parse html mail
        :param use_txt_parsing: parse txt mail
        """
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.use_ssl = use_ssl
        self.folder = folder
        self.heartbeat = heartbeat
        self.use_idle = use_idle
        self.connection_max_lifetime = connection_max_lifetime
        self.endpoint = endpoint
        self.token = token
        self.use_html_parsing = use_html_parsing
        self.use_txt_parsing = use_txt_parsing
        self.lock = filelock.FileLock(lockfile_path)
        self._is_active = True

    def run(self) -> None:
        logger.info(self, 'Starting MailFetcher')
        while self._is_active:
            imapc = None
            sleep_after_connection = True
            try:
                imapc = imapclient.IMAPClient(
                    self.host,
                    self.port,
                    ssl=self.use_ssl,
                    timeout=MAIL_FETCHER_CONNECTION_TIMEOUT
                )
                imapc.login(self.user, self.password)

                logger.debug(self, 'Select folder {}'.format(
                    self.folder,
                ))
                imapc.select_folder(self.folder)

                # force renew connection when deadline is reached
                deadline = time.time() + self.connection_max_lifetime
                while True:
                    if not self._is_active:
                        logger.warning(self, 'Mail Fetcher process aborted')
                        sleep_after_connection = False
                        break

                    if time.time() > deadline:
                        logger.debug(
                            self,
                            "MailFetcher Connection Lifetime limit excess"
                            ", Try Re-new connection")
                        sleep_after_connection = False
                        break

                    # check for new mails
                    self._check_mail(imapc)

                    if self.use_idle and imapc.has_capability('IDLE'):
                        # IDLE_mode wait until event from server
                        logger.debug(self, 'wail for event(IDLE)')
                        imapc.idle()
                        imapc.idle_check(
                            timeout=MAIL_FETCHER_IDLE_RESPONSE_TIMEOUT
                        )
                        imapc.idle_done()
                    else:
                        if self.use_idle and not imapc.has_capability('IDLE'):
                            log = 'IDLE mode activated but server do not' \
                                  'support it, use polling instead.'
                            logger.warning(self, log)
                        # normal polling mode : sleep a define duration
                        logger.debug(self,
                                     'sleep for {}'.format(self.heartbeat))
                        time.sleep(self.heartbeat)

            # Socket
            except (socket.error,
                    socket.gaierror,
                    socket.herror) as e:
                log = 'Socket fail with IMAP connection {}'
                logger.error(self, log.format(e.__str__()))

            except socket.timeout as e:
                log = 'Socket timeout on IMAP connection {}'
                logger.error(self, log.format(e.__str__()))

            # SSL
            except ssl.SSLError as e:
                log = 'SSL error on IMAP connection'
                logger.error(self, log.format(e.__str__()))

            except ssl.CertificateError as e:
                log = 'SSL Certificate verification failed on IMAP connection'
                logger.error(self, log.format(e.__str__()))

            # Filelock
            except filelock.Timeout as e:
                log = 'Mail Fetcher Lock Timeout {}'
                logger.warning(self, log.format(e.__str__()))

            # IMAP
            # TODO - G.M - 10-01-2017 - Support imapclient exceptions
            # when Imapclient stable will be 2.0+

            except BadIMAPFetchResponse as e:
                log = 'Imap Fetch command return bad response.' \
                      'Is someone else connected to the mailbox ?'
                logger.error(self, log.format(e.__str__()))
            # Others
            except Exception as e:
                log = 'Mail Fetcher error {}'
                logger.error(self, log.format(e.__str__()))

            finally:
                # INFO - G.M - 2018-01-09 - Connection closing
                # Properly close connection according to
                # https://github.com/mjs/imapclient/pull/279/commits/043e4bd0c5c775c5a08cb5f1baa93876a46732ee
                # TODO : Use __exit__ method instead when imapclient stable will
                # be 2.0+ .
                if imapc:
                    logger.debug(self, 'Try logout')
                    try:
                        imapc.logout()
                    except Exception:
                        try:
                            imapc.shutdown()
                        except Exception as e:
                            log = "Can't logout, connection broken ? {}"
                            logger.error(self, log.format(e.__str__()))

            if sleep_after_connection:
                logger.debug(self, 'sleep for {}'.format(self.heartbeat))
                time.sleep(self.heartbeat)

        log = 'Mail Fetcher stopped'
        logger.debug(self, log)

    def _check_mail(self, imapc: imapclient.IMAPClient) -> None:
        with self.lock.acquire(
                timeout=MAIL_FETCHER_FILELOCK_TIMEOUT
        ):
            messages = self._fetch(imapc)
            cleaned_mails = [DecodedMail(m.message, m.uid)
                             for m in messages]
            self._notify_tracim(cleaned_mails, imapc)

    def stop(self) -> None:
        self._is_active = False

    def _fetch(
        self, 
        imapc: imapclient.IMAPClient,
    ) -> typing.List[MessageContainer]:
        """
        Get news message from mailbox
        :return: list of new mails
        """
        messages = []

        logger.debug(self, 'Fetch unflagged messages')
        uids = imapc.search(['UNFLAGGED'])
        logger.debug(self, 'Found {} unflagged mails'.format(
            len(uids),
        ))
        for msgid, data in imapc.fetch(uids, ['BODY.PEEK[]']).items():
            # INFO - G.M - 2017-12-08 - Fetch BODY.PEEK[]
            # Retrieve all mail(body and header) but don't set mail
            # as seen because of PEEK
            # see rfc3501
            logger.debug(self, 'Fetch mail "{}"'.format(
                msgid,
            ))

            try:
                msg = message_from_bytes(data[b'BODY[]'])
            except KeyError as e:
                # INFO - G.M - 12-01-2018 - Fetch may return events response
                # In some specific case, fetch command may return events
                # response unrelated to fetch request.
                # This should happen only when someone-else use the mailbox
                # at the same time of the fetcher.
                # see https://github.com/mjs/imapclient/issues/334
                raise BadIMAPFetchResponse from e

            msg_container = MessageContainer(msg, msgid)
            messages.append(msg_container)

        return messages

    def _notify_tracim(
        self,
        mails: typing.List[DecodedMail],
        imapc: imapclient.IMAPClient
    ) -> None:
        """
        Send http request to tracim endpoint
        :param mails: list of mails to send
        :return: none
        """
        logger.debug(self, 'Notify tracim about {} new responses'.format(
            len(mails),
        ))
        # TODO BS 20171124: Look around mail.get_from_address(), mail.get_key()
        # , mail.get_body() etc ... for raise InvalidEmailError if missing
        #  required informations (actually get_from_address raise IndexError
        #  if no from address for example) and catch it here
        while mails:
            mail = mails.pop()
            body =  mail.get_body(
                use_html_parsing=self.use_html_parsing,
                use_txt_parsing=self.use_txt_parsing,
            )
            from_address = mail.get_from_address()

            # don't create element for 'empty' mail
            if not body:
                logger.warning(
                    self,
                    'Mail from {} has not valable content'.format(
                        from_address
                    ),
                )
                continue

            msg = {'token': self.token,
                   'user_mail': from_address,
                   'content_id': mail.get_key(),
                   'payload': {
                       'content': body,
                   }}
            try:
                logger.debug(
                    self,
                    'Contact API on {} with body {}'.format(
                        self.endpoint,
                        json.dumps(msg),
                    ),
                )
                r = requests.post(self.endpoint, json=msg)
                if r.status_code not in [200, 204]:
                    details = r.json().get('msg')
                    log = 'bad status code {} response when sending mail to tracim: {}'  # nopep8
                    logger.error(self, log.format(
                        str(r.status_code),
                        details,
                    ))
                # Flag all correctly checked mail
                if r.status_code in [200, 204, 400]:
                    imapc.add_flags((mail.uid,), IMAP_CHECKED_FLAG)
            # TODO - G.M - Verify exception correctly works
            except requests.exceptions.Timeout as e:
                log = 'Timeout error to transmit fetched mail to tracim : {}'
                logger.error(self, log.format(str(e)))
            except requests.exceptions.RequestException as e:
                log = 'Fail to transmit fetched mail to tracim : {}'
                logger.error(self, log.format(str(e)))
