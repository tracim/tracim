# -*- coding: utf-8 -*-

import sys
import time
import imaplib
import datetime
import json
import typing
from email.message import Message
from email.header import Header, decode_header, make_header
from email.utils import parseaddr, parsedate_tz, mktime_tz
from email import message_from_bytes

import markdown
import requests
from bs4 import BeautifulSoup
from email_reply_parser import EmailReplyParser

from tracim.lib.base import logger

TRACIM_SPECIAL_KEY_HEADER = "X-Tracim-Key"
BS_HTML_BODY_PARSE_CONFIG = {
    'tag_blacklist': ["script", "style", "blockquote"],
    'class_blacklist': ['moz-cite-prefix', 'gmail_extra', 'gmail_quote',
                        'yahoo_quoted'],
    'id_blacklist': ['reply-intro'],
    'tag_whitelist': ['a', 'b', 'strong', 'i', 'br', 'ul', 'li', 'ol',
                      'em', 'i', 'u',
                      'thead', 'tr', 'td', 'tbody', 'table', 'p', 'pre'],
    'attrs_whitelist': ['href'],
}


class DecodedMail(object):

    def __init__(self, message: Message):
        self._message = message

    def _decode_header(self, header_title: str) -> typing.Optional[str]:
        # FIXME : Handle exception
        if header_title in self._message:
            return str(make_header(decode_header(header)))
        else:
            return None

    def get_subject(self) -> typing.Optional[str]:
        return self._decode_header('subject')

    def get_from_address(self) -> typing.Optional[str]:
        return parseaddr(self._message['From'])[1]

    def get_to_address(self)-> typing.Optional[str]:
        return parseaddr(self._message['To'])[1]

    def get_first_ref(self) -> typing.Optional[str]:
        return parseaddr(self._message['References'])[1]

    def get_special_key(self) -> typing.Optional[str]:
        return self._decode_header(TRACIM_SPECIAL_KEY_HEADER)

    def get_body(self) -> typing.Optional[str]:
        body_part = self._get_mime_body_message()
        body = None
        if body_part:
            charset = body_part.get_content_charset('iso-8859-1')
            ctype = body_part.get_content_type()
            if ctype == "text/plain":
                txt_body = body_part.get_payload(decode=True).decode(
                    charset)
                body = DecodedMail._parse_txt_body(txt_body)

            elif ctype == "text/html":
                html_body = body_part.get_payload(decode=True).decode(
                    charset)
                body = DecodedMail._parse_html_body(html_body)

        return body

    @staticmethod
    def _parse_txt_body(txt_body: str):
        txt_body = EmailReplyParser.parse_reply(txt_body)
        html_body = markdown.markdown(txt_body)
        body = DecodedMail._parse_html_body(html_body)
        return body

    @staticmethod
    def _parse_html_body(html_body: str):
        soup = BeautifulSoup(html_body)
        config = BS_HTML_BODY_PARSE_CONFIG
        for tag in soup.findAll():
            if tag.name.lower() in config['tag_blacklist']:
                tag.extract()
            elif 'class' in tag.attrs:
                for elem in config['class_blacklist']:
                    if elem in tag.attrs['class']:
                        tag.extract()
            elif 'id' in tag.attrs:
                for elem in config['id_blacklist']:
                    if elem in tag.attrs['id']:
                        tag.extract()
            elif tag.name.lower() in config['tag_whitelist']:
                attrs = dict(tag.attrs)
                for attr in attrs:
                    if attr not in config['attrs_whitelist']:
                        del tag.attrs[attr]
            else:
                tag.unwrap()
        return str(soup)

    def _get_mime_body_message(self) -> typing.Optional[Message]:
        # FIXME - G.M - 2017-11-16 - Use stdlib msg.get_body feature for py3.6+
        # FIXME - G.M - 2017-11-16 - Check support for non-multipart mail
        part = None
        # Check for html
        for part in self._message.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            if ctype == 'text/html' and 'attachment' not in cdispo:
                return part
        # check for plain text
        for part in self._message.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            if ctype == 'text/plain' and 'attachment' not in cdispo:
                return part
        return part

    def get_key(self) -> typing.Optional[str]:

        """
        First try checking special header, them check 'to' header
        and finally check first(oldest) mail-id of 'references' header
        """
        key = None
        first_ref = self.get_first_ref()
        to_address = self.get_to_address()
        special_key = self.get_special_key()

        if special_key:
            key = special_key
        if not key and to_address:
            key = DecodedMail.find_key_from_mail_address(to_address)
        if not key and first_ref:
            key = DecodedMail.find_key_from_mail_address(first_ref)

        return key

    @staticmethod
    def find_key_from_mail_address(mail_address: str) \
            -> typing.Optional[str]:
        """ Parse mail_adress-like string
        to retrieve key.

        :param mail_address: user+key@something like string
        :return: key
        """
        username = mail_address.split('@')[0]
        username_data = username.split('+')
        if len(username_data) == 2:
            key = username_data[1]
        else:
            key = None
        return key


class MailFetcher(object):

    def __init__(self,
                 host: str, port: str, user: str, password: str, folder: str,
                 delay: int, endpoint: str, token:str) \
            -> None:
        """
        Fetch mail from a mailbox folder through IMAP and add their content to
        Tracim through http according to mail Headers.
        Fetch is regular.
        :param host: imap server hostname
        :param port: imap connection port
        :param user: user login of mailbox
        :param password: user password of mailbox
        :param folder: mail folder where new mail are fetched
        :param delay: seconds to wait before fetching new mail again
        :param endpoint: tracim http endpoint where decoded mail are send.
        :param token: token to authenticate http connexion
        """
        self._connection = None
        self._mails = []
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.folder = folder
        self.delay = delay
        self.endpoint = endpoint
        self.token = token

        self._is_active = True

    def run(self) -> None:
        while self._is_active:
            time.sleep(self.delay)
            self._connect()
            self._fetch()
            self._notify_tracim()
            self._disconnect()

    def stop(self) -> None:
        self._is_active = False

    def _connect(self) -> None:
        # FIXME - G.M - 2017-11-15 Verify connection/disconnection
        # Are old connexion properly close this way ?
        if self._connection:
            self._disconnect()
        # TODO - G.M - 2017-11-15 Support unencrypted connection ?
        # TODO - G.M - 2017-11-15 Support for keyfile,certfile ?
        self._connection = imaplib.IMAP4_SSL(self.host, self.port)
        try:
            self._connection.login(self.user, self.password)
        except Exception as e:
            log = 'IMAP login error: {}'
            logger.debug(self, log.format(e.__str__()))

    def _disconnect(self) -> None:
        if self._connection:
            self._connection.close()
            self._connection.logout()
            self._connection = None

    def _fetch(self) -> None:
        """
        Get news message from mailbox
        """

        # select mailbox
        rv, data = self._connection.select(self.folder)
        if rv == 'OK':
            # get mails
            # FIXME - G.M -  2017-11-15 Which files to select as new file ?
            # Unseen file or All file from a directory (old one should be moved/
            # deleted from mailbox during this process) ?
            rv, data = self._connection.search(None, "(UNSEEN)")
            if rv == 'OK':
                # get mail content
                for num in data[0].split():
                    rv, data = self._connection.fetch(num, '(RFC822)')
                    if rv == 'OK':
                        msg = message_from_bytes(data[0][1])
                        decodedmsg = DecodedMail(msg)
                        self._mails.append(decodedmsg)
                    else:
                        log = 'IMAP : Unable to get mail : {}'
                        logger.debug(self, log.format(str(rv)))
            else:
                # FIXME : Distinct error from empty mailbox ?
                pass
        else:
            log = 'IMAP : Unable to open mailbox : {}'
            logger.debug(self, log.format(str(rv)))

    def _notify_tracim(self) -> None:
        unsended_mail = []
        while self._mails:
            mail = self._mails.pop()
            msg = {"token": self.token,
                   "user_mail": mail.get_from_address(),
                   "content_id": mail.get_key(),
                   "payload": {
                       "content": mail.get_body(),
                   }}
            try:
                r = requests.post(self.endpoint, json=msg)
                response = r.json()
                if 'status' not in response:
                    log = 'bad response: {}'
                    logger.error(self, log.format(str(response)))
                else:
                    if response['status'] == 'ok':
                        pass
                    elif response['status'] == 'error' and 'error' in response:
                        log = 'error with email: {}'
                        logger.error(self, log.format(str(response['error'])))
                    else:
                        log = 'Unknown error with email'
            # TODO - G.M - Verify exception correctly works
            except requests.exceptions.Timeout:
                log = 'Timeout error to transmit fetched mail to tracim : {}'
                logger.error(self, log.format(str(e)))
                unsended_mail.append(mail)
                break
            except requests.exceptions.RequestException as e:
                log = 'Fail to transmit fetched mail to tracim : {}'
                logger.error(self, log.format(str(e)))
                break
        # FIXME - G.M - 2017-11-17 Avoid too short-timed infinite retry ?
        # retry later to send those mail
        self._mails = unsended_mail
