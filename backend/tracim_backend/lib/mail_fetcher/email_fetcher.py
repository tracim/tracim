# -*- coding: utf-8 -*-

from email import message_from_bytes
from email.header import decode_header
from email.header import make_header
from email.message import Message
from email.utils import parseaddr
import socket
import ssl
import time
import typing

from email_reply_parser import EmailReplyParser
import filelock
import imapclient
import markdown
import requests

from tracim_backend.exceptions import AutoReplyEmailNotAllowed
from tracim_backend.exceptions import BadStatusCode
from tracim_backend.exceptions import EmptyEmailBody
from tracim_backend.exceptions import NoSpecialKeyFound
from tracim_backend.exceptions import UnsupportedRequestMethod
from tracim_backend.lib.mail_fetcher.email_processing.parser import ParsedHTMLMail
from tracim_backend.lib.utils.authentification import TRACIM_API_KEY_HEADER
from tracim_backend.lib.utils.authentification import TRACIM_API_USER_EMAIL_LOGIN_HEADER
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.sanitizer import HtmlSanitizer  # nopep8

TRACIM_SPECIAL_KEY_HEADER = "X-Tracim-Key"
CONTENT_TYPE_TEXT_PLAIN = "text/plain"
CONTENT_TYPE_TEXT_HTML = "text/html"

IMAP_CHECKED_FLAG = imapclient.FLAGGED
IMAP_SEEN_FLAG = imapclient.SEEN

MAIL_FETCHER_FILELOCK_TIMEOUT = 10
MAIL_FETCHER_CONNECTION_TIMEOUT = 60 * 3
MAIL_FETCHER_IDLE_RESPONSE_TIMEOUT = 60 * 9  # this should be not more
# that 29 minutes according to rfc2177.(server wait 30min by default)


class MessageContainer(object):
    def __init__(self, message: Message, uid: int) -> None:
        self.message = message
        self.uid = uid


class DecodedMail(object):
    def __init__(
        self,
        message: Message,
        uid: int = None,
        reply_to_pattern: str = "",
        references_pattern: str = "",
    ) -> None:
        self._message = message
        self.uid = uid
        self.reply_to_pattern = reply_to_pattern
        self.references_pattern = references_pattern

    def _decode_header(self, header_title: str) -> typing.Optional[str]:
        # FIXME : Handle exception
        if header_title in self._message:
            return str(make_header(decode_header(self._message[header_title])))
        else:
            return None

    def get_subject(self) -> typing.Optional[str]:
        return self._decode_header("subject")

    def get_from_address(self) -> str:
        return parseaddr(self._message["From"])[1]

    def get_to_address(self) -> str:
        return parseaddr(self._message["To"])[1]

    def get_first_ref(self) -> str:
        return parseaddr(self._message["References"])[1]

    def get_special_key(self) -> typing.Optional[str]:
        return self._decode_header(TRACIM_SPECIAL_KEY_HEADER)

    def get_body(self, use_html_parsing=True, use_txt_parsing=True) -> typing.Optional[str]:
        body_part = self._get_mime_body_message()
        body = None
        if body_part:
            charset = body_part.get_content_charset("iso-8859-1")
            content_type = body_part.get_content_type()
            if content_type == CONTENT_TYPE_TEXT_PLAIN:
                txt_body = body_part.get_payload(decode=True).decode(charset)
                if use_txt_parsing:
                    txt_body = EmailReplyParser.parse_reply(txt_body)
                html_body = markdown.markdown(txt_body)
                body = HtmlSanitizer(html_body).sanitize()

            elif content_type == CONTENT_TYPE_TEXT_HTML:
                html_body = body_part.get_payload(decode=True).decode(charset)
                if use_html_parsing:
                    html_body = str(ParsedHTMLMail(html_body))
                body = HtmlSanitizer(html_body).sanitize()
            if not body:
                raise EmptyEmailBody()
        return body

    def _get_mime_body_message(self) -> typing.Optional[Message]:
        # TODO - G.M - 2017-11-16 - Use stdlib msg.get_body feature for py3.6+
        part = None
        # Check for html
        for part in self._message.walk():
            content_type = part.get_content_type()
            content_dispo = str(part.get("Content-Disposition"))
            if content_type == CONTENT_TYPE_TEXT_HTML and "attachment" not in content_dispo:
                return part
        # check for plain text
        for part in self._message.walk():
            content_type = part.get_content_type()
            content_dispo = str(part.get("Content-Disposition"))
            if content_type == CONTENT_TYPE_TEXT_PLAIN and "attachment" not in content_dispo:
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
            return DecodedMail.find_key_from_mail_address(
                to_address, self.reply_to_pattern, "{content_id}"
            )
        if first_ref:
            return DecodedMail.find_key_from_mail_address(
                first_ref, self.references_pattern, "{content_id}"
            )

        raise NoSpecialKeyFound()

    @classmethod
    def find_key_from_mail_address(
        cls, mail_address: str, pattern: str, marker_str: str
    ) -> typing.Optional[str]:
        """ Parse mail_adress-like string
        to retrieve key.
        :param mail_address: mail_adress like user+key@something / key@something
        :param pattern: pattern like user+{marker_str}@something
        :param marker_str: marker_name with bracket like {content_id}
        :return: key
        """
        # splitting pattern with marker_str,
        # ex with {content_id} as marker_str
        # noreply+{content_id}@website.tld -> ['noreply+','@website.tld']
        static_parts = pattern.split(marker_str)
        assert len(static_parts) > 1
        assert len(static_parts) < 3
        if len(static_parts) == 2:
            before, after = static_parts
            if mail_address.startswith(before) and mail_address.endswith(after):
                key = mail_address.replace(before, "").replace(after, "")
                assert key.isalnum()
                return key
            logger.warning(
                cls, "pattern {} does not match email address {} ".format(pattern, mail_address)
            )
            return None

    def check_validity_for_comment_content(self) -> None:
        """
        Check if DecodedMail is valid for comment content
        :return: None or raise Error
        """
        if self._check_if_auto_reply_mail():
            raise AutoReplyEmailNotAllowed("Mail seems to be an auto-reply mail, skip it")

    def _check_if_auto_reply_mail(self) -> bool:
        """
        Check if email seems to be an autoreply
        see https://arp242.net/autoreply.html for more info
        """
        # INFO - G.M - 2019-06-28 - RFC 3834, https://tools.ietf.org/html/rfc3834
        # standard mechanism
        auto_submitted_header = self._decode_header("Auto-submitted")
        if auto_submitted_header and auto_submitted_header.lower().strip().startswith(
            "auto-replied"
        ):
            return True

        # INFO - G.M - 2019-06-28 - somes not standard check for autoreply
        x_auto_response_suppress_raw_value = self._decode_header("X-Auto-Response-Suppress")
        if x_auto_response_suppress_raw_value:
            x_auto_response_suppress_values = []
            for value in x_auto_response_suppress_raw_value.split(","):
                value = value.strip().lower()
                x_auto_response_suppress_values.append(value)
            if (
                "dr" in x_auto_response_suppress_values
                or "autoreply" in x_auto_response_suppress_values
                or "all" in x_auto_response_suppress_values
            ):
                return True

        precedence_header = self._decode_header("Precedence")
        if precedence_header and precedence_header.lower() == "auto_reply":
            return True

        x_auto_reply_header = self._decode_header("X-Autoreply")
        if x_auto_reply_header and x_auto_reply_header.lower() == "yes":
            return True
        return False


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
        api_base_url: str,
        api_key: str,
        reply_to_pattern: str,
        references_pattern: str,
        use_html_parsing: bool,
        use_txt_parsing: bool,
        lockfile_path: str,
        burst: bool,
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
        :param api_base_url: url to get access to tracim api
        :param api_key: tracim api key
        :param reply_to_pattern: pattern used in tracim reply_to
        :param references_pattern: pattern used in tracim references
        :param use_html_parsing: parse html mail
        :param use_txt_parsing: parse txt mail
        :param burst: if true, run only one time,
        if false run as continous daemon.
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
        self.api_base_url = api_base_url
        self.reply_to_pattern = reply_to_pattern
        self.references_pattern = references_pattern
        self.api_key = api_key
        self.use_html_parsing = use_html_parsing
        self.use_txt_parsing = use_txt_parsing
        self.lock = filelock.FileLock(lockfile_path)
        self._is_active = True
        self.burst = burst

    def run(self) -> None:
        logger.info(self, "Starting MailFetcher")
        while self._is_active:
            imapc = None
            sleep_after_connection = True
            try:
                imapc = imapclient.IMAPClient(
                    self.host, self.port, ssl=self.use_ssl, timeout=MAIL_FETCHER_CONNECTION_TIMEOUT
                )
                imapc.login(self.user, self.password)

                logger.debug(self, "Select folder {}".format(self.folder))
                imapc.select_folder(self.folder)

                # force renew connection when deadline is reached
                deadline = time.time() + self.connection_max_lifetime
                while True:
                    if not self._is_active:
                        logger.warning(self, "Mail Fetcher process aborted")
                        sleep_after_connection = False
                        break

                    if time.time() > deadline:
                        logger.debug(
                            self,
                            "MailFetcher Connection Lifetime limit excess"
                            ", Try Re-new connection",
                        )
                        sleep_after_connection = False
                        break

                    # check for new mails
                    self._check_mail(imapc)

                    if self.use_idle and imapc.has_capability("IDLE"):
                        # IDLE_mode wait until event from server
                        logger.debug(self, "wait for event(IDLE)")
                        imapc.idle()
                        imapc.idle_check(timeout=MAIL_FETCHER_IDLE_RESPONSE_TIMEOUT)
                        imapc.idle_done()
                    else:
                        if self.use_idle and not imapc.has_capability("IDLE"):
                            log = (
                                "IDLE mode activated but server do not"
                                "support it, use polling instead."
                            )
                            logger.warning(self, log)

                        if self.burst:
                            self.stop()
                            break
                        # normal polling mode : sleep a define duration
                        logger.debug(self, "sleep for {}".format(self.heartbeat))
                        time.sleep(self.heartbeat)

                    if self.burst:
                        self.stop()
                        break
            # Socket
            except (socket.error, socket.gaierror, socket.herror) as e:
                log = "Socket fail with IMAP connection {}"
                logger.error(self, log.format(e.__str__()))

            except socket.timeout as e:
                log = "Socket timeout on IMAP connection {}"
                logger.error(self, log.format(e.__str__()))

            # SSL
            except ssl.SSLError as e:
                log = "SSL error on IMAP connection"
                logger.error(self, log.format(e.__str__()))

            except ssl.CertificateError as e:
                log = "SSL Certificate verification failed on IMAP connection"
                logger.error(self, log.format(e.__str__()))

            # Filelock
            except filelock.Timeout as e:
                log = "Mail Fetcher Lock Timeout {}"
                logger.warning(self, log.format(e.__str__()))

            # IMAP
            # TODO - G.M - 10-01-2017 - Support imapclient exceptions
            # when Imapclient stable will be 2.0+

            except BadIMAPFetchResponse as e:
                log = (
                    "Imap Fetch command return bad response."
                    "Is someone else connected to the mailbox ?: "
                    "{}"
                )
                logger.error(self, log.format(e.__str__()))
            # Others
            except Exception as e:
                log = "Mail Fetcher error {}"
                logger.error(self, log.format(e.__str__()))

            finally:
                # INFO - G.M - 2018-01-09 - Connection closing
                # Properly close connection according to
                # https://github.com/mjs/imapclient/pull/279/commits/043e4bd0c5c775c5a08cb5f1baa93876a46732ee
                # TODO : Use __exit__ method instead when imapclient stable will
                # be 2.0+ .
                if imapc:
                    logger.debug(self, "Try logout")
                    try:
                        imapc.logout()
                    except Exception:
                        try:
                            imapc.shutdown()
                        except Exception as e:
                            log = "Can't logout, connection broken ? {}"
                            logger.error(self, log.format(e.__str__()))

            if self.burst:
                self.stop()
                break

            if sleep_after_connection:
                logger.debug(self, "sleep for {}".format(self.heartbeat))
                time.sleep(self.heartbeat)

        log = "Mail Fetcher stopped"
        logger.debug(self, log)

    def _check_mail(self, imapc: imapclient.IMAPClient) -> None:
        with self.lock.acquire(timeout=MAIL_FETCHER_FILELOCK_TIMEOUT):
            messages = self._fetch(imapc)
            cleaned_mails = [
                DecodedMail(m.message, m.uid, self.reply_to_pattern, self.references_pattern)
                for m in messages
            ]
            self._notify_tracim(cleaned_mails, imapc)

    def stop(self) -> None:
        self._is_active = False

    def _fetch(self, imapc: imapclient.IMAPClient) -> typing.List[MessageContainer]:
        """
        Get news message from mailbox
        :return: list of new mails
        """
        messages = []

        logger.debug(self, "Fetch unflagged messages")
        uids = imapc.search(["UNFLAGGED"])
        logger.debug(self, "Found {} unflagged mails".format(len(uids)))
        for msgid, data in imapc.fetch(uids, ["BODY.PEEK[]"]).items():
            # INFO - G.M - 2017-12-08 - Fetch BODY.PEEK[]
            # Retrieve all mail(body and header) but don't set mail
            # as seen because of PEEK
            # see rfc3501
            logger.debug(self, 'Fetch mail "{}"'.format(msgid))

            try:
                msg = message_from_bytes(data[b"BODY[]"])
            except KeyError as e:
                # INFO - G.M - 12-01-2018 - Fetch may return events response
                # In some specific case, fetch command may return events
                # response unrelated to fetch request.
                # This should happen only when someone-else use the mailbox
                # at the same time of the fetcher.
                # see https://github.com/mjs/imapclient/issues/334
                except_msg = "fetch response : {}".format(str(data))
                raise BadIMAPFetchResponse(except_msg) from e

            msg_container = MessageContainer(msg, msgid)
            messages.append(msg_container)

        return messages

    def _notify_tracim(self, mails: typing.List[DecodedMail], imapc: imapclient.IMAPClient) -> None:
        """
        Send http request to tracim endpoint
        :param mails: list of mails to send
        :return: none
        """
        logger.debug(self, "Notify tracim about {} new responses".format(len(mails)))
        # TODO BS 20171124: Look around mail.get_from_address(), mail.get_key()
        # , mail.get_body() etc ... for raise InvalidEmailError if missing
        #  required informations (actually get_from_address raise IndexError
        #  if no from address for example) and catch it here
        while mails:
            mail = mails.pop()
            try:
                method, endpoint, json_body_dict = self._create_comment_request(mail)
            except NoSpecialKeyFound as exc:
                log = "Failed to create comment request due to missing specialkey in mail {}"
                logger.error(self, log.format(exc.__str__()))
                continue
            except EmptyEmailBody:
                log = "Empty body, skip mail"
                logger.error(self, log)
                continue
            except AutoReplyEmailNotAllowed:
                log = "Autoreply mail, skip mail"
                logger.warning(self, log)
                continue
            except Exception as exc:
                log = "Failed to create comment request in mail fetcher error : {}"
                logger.error(self, log.format(exc.__str__()))
                continue

            try:
                self._send_request(
                    mail=mail,
                    imapc=imapc,
                    method=method,
                    endpoint=endpoint,
                    json_body_dict=json_body_dict,
                )
            except requests.exceptions.Timeout as e:
                log = "Timeout error to transmit fetched mail to tracim : {}"
                logger.error(self, log.format(str(e)))
            except requests.exceptions.RequestException as e:
                log = "Fail to transmit fetched mail to tracim : {}"
                logger.error(self, log.format(str(e)))

    def _get_auth_headers(self, user_email) -> dict:
        return {TRACIM_API_KEY_HEADER: self.api_key, TRACIM_API_USER_EMAIL_LOGIN_HEADER: user_email}

    def _get_content_info(self, content_id, user_email):
        endpoint = "{api_base_url}contents/{content_id}".format(
            api_base_url=self.api_base_url, content_id=content_id
        )
        result = requests.get(endpoint, headers=self._get_auth_headers(user_email))
        if result.status_code not in [200, 204]:
            details = str(result.content)
            msg = "bad status code {}(200 is valid) response when trying to get info about a content: {}"
            msg = msg.format(str(result.status_code), details)
            raise BadStatusCode(msg)
        return result.json()

    def _create_comment_request(self, mail: DecodedMail) -> typing.Tuple[str, str, dict]:
        mail.check_validity_for_comment_content()
        content_id = mail.get_key()
        content_info = self._get_content_info(content_id, mail.get_from_address())
        mail_body = mail.get_body(
            use_html_parsing=self.use_html_parsing, use_txt_parsing=self.use_txt_parsing
        )
        endpoint = "{api_base_url}workspaces/{workspace_id}/contents/{content_id}/comments".format(
            api_base_url=self.api_base_url,
            content_id=content_id,
            workspace_id=content_info["workspace_id"],
        )
        method = "POST"
        body = {"raw_content": mail_body}
        return method, endpoint, body

    def _send_request(
        self,
        mail: DecodedMail,
        imapc: imapclient.IMAPClient,
        method: str,
        endpoint: str,
        json_body_dict: dict,
    ):
        logger.debug(
            self,
            "Contact API on {endpoint} with method {method} with body {body}".format(
                endpoint=endpoint, method=method, body=str(json_body_dict)
            ),
        )
        if method == "POST":
            request_method = requests.post
        else:
            # TODO - G.M - 2018-08-24 - Better handling exception
            raise UnsupportedRequestMethod("Request method not supported")

        r = request_method(
            url=endpoint,
            json=json_body_dict,
            headers=self._get_auth_headers(mail.get_from_address()),
        )
        if r.status_code not in [200, 204]:
            details = r.json().get("message")
            msg = "bad status code {} (200 and 204 are valid) response when sending mail to tracim: {}"
            msg = msg.format(str(r.status_code), details)
            raise BadStatusCode(msg)
        # Flag all correctly checked mail
        if r.status_code in [200, 204]:
            imapc.add_flags((mail.uid,), IMAP_CHECKED_FLAG)
            imapc.add_flags((mail.uid,), IMAP_SEEN_FLAG)
