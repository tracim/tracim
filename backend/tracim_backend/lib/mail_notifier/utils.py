from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from email.utils import formatdate
from email.utils import make_msgid
from email.utils import parseaddr
import enum
import typing

import html2text

from tracim_backend.lib.utils.sanitizer import HtmlSanitizer


class SmtpConnectMethod(str, enum.Enum):
    DEFAULT = "default"  # use starttls, fallback to unencrypted
    UNSECURE = "unsecure"  # unencrypted
    SMTPS = "smtps"  # use direct encryption

    @classmethod
    def get_all_values(cls) -> typing.List[str]:
        return [cm.value for cm in SmtpConnectMethod]


class SmtpConfiguration(object):
    """Container class for SMTP configuration used in Tracim."""

    def __init__(
        self,
        server: str,
        port: int,
        login: str,
        password: str,
        connect_method: SmtpConnectMethod,
        anonymous: bool,
    ):
        self.server = server
        self.port = port
        self.login = login
        self.password = password
        self.connect_method = connect_method
        self.anonymous = anonymous


class EST(object):
    """
    EST = Email Subject Tags - this is a convenient class - no business logic
    here
    This class is intended to agregate all dynamic content that may be included
    in email subjects
    """

    WEBSITE_TITLE = "{website_title}"
    WORKSPACE_LABEL = "{workspace_label}"
    CONTENT_LABEL = "{content_label}"
    CONTENT_STATUS_LABEL = "{content_status_label}"

    @classmethod
    def all(cls):
        return [cls.CONTENT_LABEL, cls.CONTENT_STATUS_LABEL, cls.WEBSITE_TITLE, cls.WORKSPACE_LABEL]


class EmailAddress(object):
    def __init__(self, label: str, email: str, force_angle_bracket=False):
        self.label = label
        self.email = email
        self.idna_email = self._encode_idna(email)
        self.force_angle_bracket = force_angle_bracket

    def _encode_idna_part(self, part: str):
        return ".".join([p.encode("idna").decode("ascii") for p in part.split(".")])

    def _encode_idna(self, email: str):
        username, domain = [self._encode_idna_part(part) for part in email.rsplit("@", 1)]

        username = self._encode_idna_part(username)
        domain = self._encode_idna_part(domain)

        return username + "@" + domain

    @classmethod
    def from_rfc_email_address(cls, rfc_email: str) -> "EmailAddress":
        label, email = parseaddr(rfc_email)
        return EmailAddress(label, email)

    @property
    def address(self):
        if self.label:
            return formataddr((self.label, self.idna_email))
        if self.force_angle_bracket and self.email and self.email[0] != "<":
            return "<{}>".format(self.idna_email)
        return self.idna_email

    @property
    def domain(self):
        _, _, domain = self.email.partition("@")
        return domain


class EmailNotificationMessage(MIMEMultipart):
    def __init__(
        self,
        subject: str,
        from_header: EmailAddress,
        to_header: EmailAddress,
        body_html: str,
        lang: str,
        reply_to: typing.Optional[EmailAddress] = None,
        references: typing.Optional[EmailAddress] = None,
    ):
        super().__init__("alternative")
        self["Message-ID"] = make_msgid(domain=from_header.domain)
        self["Date"] = formatdate()
        self["Content-Language"] = lang
        self["From"] = from_header.address
        self["To"] = to_header.address
        self["Subject"] = subject
        if reply_to:
            self["Reply-to"] = reply_to.address
        if references:
            self["References"] = references.address

        # INFO - G.M - 2020-04-03 - Set some headers to avoid receiving auto-response.
        self["X-Auto-Response-Suppress"] = "All"
        self["Auto-Submitted"] = "auto-generated"

        body_text = html2text.HTML2Text().handle(HtmlSanitizer(body_html).sanitize())
        part1 = MIMEText(body_text, "plain", "utf-8")
        part2 = MIMEText(body_html, "html", "utf-8")
        # Attach parts into message container.
        # According to RFC 2046, the last part of a multipart message,
        # in this case the HTML message, is best and preferred.
        self.attach(part1)
        self.attach(part2)
