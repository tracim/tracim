from marshmallow import ValidationError
import pytest

from tracim_backend.app_models.email_validators import RFCEmailValidator
from tracim_backend.app_models.email_validators import TracimEmailValidator

EMAIL_TESTS = [
    ["local@domain.tld", True],
    ["local@domain", True],
    ["éà@domain", True],
    ["john.doe@sub.domain.tld", True],
    ["john.dot.dot.dot@sub.sub.sub.sub.domain.tld", True],
    ["", False],
    ["@domain", False],
    ["local@", False],
    ['"local@local"@domain', True],
    ['"local local local "@domain', True],
    ["<@domain", False],
    ["a@>", False],
    [",@domain", False],
    ["\nsalut@domain", False],
    [",@domain", False],
    ["local@;domain", False],
]


class TestTracimEmailValidator(object):
    @pytest.mark.parametrize("email, valid", EMAIL_TESTS)
    def test__unit_email_validation__ok__nominal_case(self, email, valid):
        try:
            TracimEmailValidator()(email)
            assert valid
        except ValidationError:
            assert not valid


class TestRFCEmailValidator(object):
    @pytest.mark.parametrize(
        "email, valid",
        EMAIL_TESTS
        + [
            ['John <"local local local "@domain>', True],
            ["John Doe <local@sub.domain.tld>", True],
            ['@ @ <"local local local "@domain>', True],
            ["John Doe <local@<sub>.domain.tld>", False],
            ["John Doe <local@sub;domain.tld>", False],
            ["John Doe\n<local@sub;domain.tld>", False],
        ],
    )
    def test__unit_email_validation__ok__nominal_case(self, email, valid):
        try:
            RFCEmailValidator()(email)
            assert valid
        except ValidationError:
            assert not valid
