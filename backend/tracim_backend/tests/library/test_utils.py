import pytest

from tracim_backend.lib.utils.utils import ALLOWED_AUTOGEN_PASSWORD_CHAR
from tracim_backend.lib.utils.utils import DEFAULT_PASSWORD_GEN_CHAR_LENGTH
from tracim_backend.lib.utils.utils import ExtendedColor
from tracim_backend.lib.utils.utils import password_generator


class TestPasswordGenerator(object):

    def test_password_generator_ok_nominal_case(self):
        password = password_generator()
        assert len(password) == DEFAULT_PASSWORD_GEN_CHAR_LENGTH
        for char in password:
            assert char in ALLOWED_AUTOGEN_PASSWORD_CHAR


class TestExtendedColor(object):

    def test_extended_color__init__ok_nominal_case(self):
        color = ExtendedColor('#FFFFFF')
        assert color.web == 'white'
