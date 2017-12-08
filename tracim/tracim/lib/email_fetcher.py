# -*- coding: utf-8 -*-

import time
import imaplib
import json
import typing
from email import message_from_bytes
from email.header import decode_header
from email.header import make_header
from email.message import Message
from email.utils import parseaddr

import markdown
import requests
from email_reply_parser import EmailReplyParser
from tracim.lib.base import logger
from tracim.lib.email_processing.parser import ParsedHTMLMail
from tracim.lib.email_processing.sanitizer import HtmlSanitizer

TRACIM_SPECIAL_KEY_HEADER = 'X-Tracim-Key'
CONTENT_TYPE_TEXT_PLAIN = 'text/plain'
CONTENT_TYPE_TEXT_HTML = 'text/html'


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


class MailFetcher(object):
    def __init__(
        self,
        host: str,
        port: str,
        user: str,
        password: str,
        use_ssl: bool,
        folder: str,
        delay: int,
        endpoint: str,
        token: str,
        use_html_parsing: bool,
        use_txt_parsing: bool,
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
        :param delay: seconds to wait before fetching new mail again
        :param endpoint: tracim http endpoint where decoded mail are send.
        :param token: token to authenticate http connexion
        :param use_html_parsing: parse html mail
        :param use_txt_parsing: parse txt mail
        """
        self._connection = None
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.use_ssl = use_ssl
        self.folder = folder
        self.delay = delay
        self.endpoint = endpoint
        self.token = token
        self.use_html_parsing = use_html_parsing
        self.use_txt_parsing = use_txt_parsing

        self._is_active = True

    def run(self) -> None:
        logger.info(self, 'Starting MailFetcher')
        while self._is_active:
            logger.debug(self, 'sleep for {}'.format(self.delay))
            time.sleep(self.delay)
            try:
                self._connect()
                messages = self._fetch()
                cleaned_mails = [DecodedMail(m.message, m.uid)
                                 for m in messages]
                self._notify_tracim(cleaned_mails)
                self._disconnect()
            except Exception as e:
                # TODO - G.M - 2017-11-23 - Identify possible exceptions
                log = 'IMAP error: {}'
                logger.warning(self, log.format(e.__str__()))

    def stop(self) -> None:
        self._is_active = False

    def _connect(self) -> None:
        # TODO - G.M - 2017-11-15 Verify connection/disconnection
        # Are old connexion properly close this way ?
        if self._connection:
            logger.debug(self, 'Disconnect from IMAP')
            self._disconnect()
        # TODO - G.M - 2017-11-23 Support for predefined SSLContext ?
        # without ssl_context param, tracim use default security configuration
        # which is great in most case.
        if self.use_ssl:
            logger.debug(self, 'Connect IMAP {}:{} using SSL'.format(
                self.host,
                self.port,
            ))
            self._connection = imaplib.IMAP4_SSL(self.host, self.port)
        else:
            logger.debug(self, 'Connect IMAP {}:{}'.format(
                self.host,
                self.port,
            ))
            self._connection = imaplib.IMAP4(self.host, self.port)

        try:
            logger.debug(self, 'Login IMAP with login {}'.format(
                self.user,
            ))
            self._connection.login(self.user, self.password)
        except Exception as e:
            log = 'IMAP login error: {}'
            logger.error(self, log.format(e.__str__()))

    def _disconnect(self) -> None:
        if self._connection:
            self._connection.close()
            self._connection.logout()
            self._connection = None

    def _fetch(self) -> typing.List[MessageContainer]:
        """
        Get news message from mailbox
        :return: list of new mails
        """
        messages = []
        # select mailbox
        logger.debug(self, 'Fetch messages from folder {}'.format(
            self.folder,
        ))
        rv, data = self._connection.select(self.folder)
        logger.debug(self, 'Response status {}'.format(
            rv,
        ))
        if rv == 'OK':
            # get mails
            # TODO - G.M -  2017-11-15 Which files to select as new file ?
            # Unseen file or All file from a directory (old one should be
            #  moved/ deleted from mailbox during this process) ?
            logger.debug(self, 'Fetch unseen messages')
            rv, data = self._connection.search(None, "(UNSEEN)")
            logger.debug(self, 'Response status {}'.format(
                rv,
            ))
            if rv == 'OK':
                # get mail content
                logger.debug(self, 'Found {} unseen mails'.format(
                    len(data[0].split()),
                ))
                for uid in data[0].split():
                    # INFO - G.M - 2017-12-08 - Fetch BODY.PEEK[]
                    # Retrieve all mail(body and header) but don't set mail
                    # as seen because of PEEK
                    # see rfc3501
                    logger.debug(self, 'Fetch mail "{}"'.format(
                        uid,
                    ))
                    rv, data = self._connection.fetch(uid, 'BODY.PEEK[]')
                    logger.debug(self, 'Response status {}'.format(
                        rv,
                    ))
                    if rv == 'OK':
                        msg = message_from_bytes(data[0][1])
                        msg_container = MessageContainer(msg, uid)
                        messages.append(msg_container)
                    else:
                        log = 'IMAP : Unable to get mail : {}'
                        logger.error(self, log.format(str(rv)))
            else:
                log = 'IMAP : Unable to get unseen mail : {}'
                logger.error(self, log.format(str(rv)))
        else:
            log = 'IMAP : Unable to open mailbox : {}'
            logger.error(self, log.format(str(rv)))
        return messages

    def _notify_tracim(
        self,
        mails: typing.List[DecodedMail],
    ) -> typing.List[DecodedMail]:
        """
        Send http request to tracim endpoint
        :param mails: list of mails to send
        :return: unsended mails
        """
        logger.debug(self, 'Notify tracim about {} new responses'.format(
            len(mails),
        ))
        unsended_mails = []
        # TODO BS 20171124: Look around mail.get_from_address(), mail.get_key()
        # , mail.get_body() etc ... for raise InvalidEmailError if missing
        #  required informations (actually get_from_address raise IndexError
        #  if no from address for example) and catch it here
        while mails:
            mail = mails.pop()
            msg = {'token': self.token,
                   'user_mail': mail.get_from_address(),
                   'content_id': mail.get_key(),
                   'payload': {
                       'content': mail.get_body(
                           use_html_parsing=self.use_html_parsing,
                           use_txt_parsing=self.use_txt_parsing),
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
                else:
                    self._set_flag(mail.uid)
            # TODO - G.M - Verify exception correctly works
            except requests.exceptions.Timeout as e:
                log = 'Timeout error to transmit fetched mail to tracim : {}'
                logger.error(self, log.format(str(e)))
                unsended_mails.append(mail)
            except requests.exceptions.RequestException as e:
                log = 'Fail to transmit fetched mail to tracim : {}'
                logger.error(self, log.format(str(e)))

        return unsended_mails

    def _set_flag(self, uid):
        assert uid is not None
        rv, data = self._connection.store(
            uid,
            '+FLAGS',
            '\\Seen'
        )
        if rv == 'OK':
            log = 'Message {} set as seen.'.format(uid)
            logger.debug(self, log)
        else:
            log = 'Can not set Message {} as seen : {}'.format(uid, rv)
            logger.error(self, log)
