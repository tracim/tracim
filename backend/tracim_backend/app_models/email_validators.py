import re

from marshmallow import ValidationError
from marshmallow.validate import Validator


class TracimEmailValidator(Validator):
    """
    Special Email Validator who accept email from subdomain
    - check existing "@".
    - check if both part are not empty.
    - refuse special characters that cause issue with rfc style address parsing used
    in frontend and backend like "<" and ";"
    """

    DOMAIN_REGEX = USER_REGEX = re.compile(r"[^<>,;\n]+")

    default_message = "Not a valid email address."

    def __init__(self, error=None):
        self.error = error or self.default_message

    def _format_error(self, value):
        return self.error.format(input=value)

    def __call__(self, value):
        message = self._format_error(value)

        if not value or "@" not in value:
            raise ValidationError(message)

        user_part, domain_part = value.rsplit("@", 1)

        if not self.USER_REGEX.fullmatch(user_part):
            raise ValidationError(message)
        if not self.DOMAIN_REGEX.fullmatch(domain_part):
            raise ValidationError(message)

        return value


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
