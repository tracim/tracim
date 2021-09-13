import re

from marshmallow import ValidationError
from marshmallow.validate import Email


class TracimEmailValidator(Email):
    """ Special Email Validator who accept email from subdomain"""

    USER_REGEX = re.compile(
        r"(^[-!#$%&'*+/=?^`{}|~\w]+(\.[-!#$%&'*+/=?^`{}|~\w]+)*\Z"  # dot-atom
        # quoted-string
        r'|^"([\001-\010\013\014\016-\037!#-\[\]-\177]' r'|\\[\001-\011\013\014\016-\177])*"\Z)',
        re.IGNORECASE | re.UNICODE,
    )

    DOMAIN_REGEX = re.compile(
        # domain
        r"(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.?)+" r"(?:[A-Z]{2,6}|[A-Z0-9-]{2,})\Z"
        # literal form, ipv4 address (SMTP 4.1.3)
        r"|^\[(25[0-5]|2[0-4]\d|[0-1]?\d?\d)" r"(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\]\Z",
        re.IGNORECASE | re.UNICODE,
    )


class RFCEmailValidator(TracimEmailValidator):

    default_message = "Not a valid rfc email address."

    def __call__(self, value):
        splitted_value = value.replace(">", "").split("<")
        # INFO - G.M - 2019-09-16 - email only
        if len(splitted_value) == 1:
            TracimEmailValidator.__call__(self, splitted_value[0])
        # INFO - G.M - 2019-09-16 - name <email@adress.ndd> case
        elif len(splitted_value) == 2:
            TracimEmailValidator.__call__(self, splitted_value[1])
        else:
            message = self._format_error(value)
            raise ValidationError(message)
        return value
