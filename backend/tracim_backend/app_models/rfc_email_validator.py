from marshmallow import ValidationError
from marshmallow.validate import Email


class RFCEmailValidator(Email):

    default_message = "Not a valid rfc email address."

    def __call__(self, value):
        splitted_value = value.replace(">", "").split("<")
        # INFO - G.M - 2019-09-16 - email only
        if len(splitted_value) == 1:
            Email.__call__(self, splitted_value[0])
        # INFO - G.M - 2019-09-16 - name <email@adress.ndd> case
        elif len(splitted_value) == 2:
            Email.__call__(self, splitted_value[1])
        else:
            message = self._format_error(value)
            raise ValidationError(message)
        return value
