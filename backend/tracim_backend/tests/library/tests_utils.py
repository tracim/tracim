import string

from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.lib.utils.utils import ALLOWED_AUTOGEN_PASSWORD_CHAR
from tracim_backend.lib.utils.utils import DEFAULT_PASSWORD_GEN_CHAR_LENGTH


class TestPasswordGenerator(object):

    def test_password_generator_ok_nominal_case(self):
        password = password_generator()
        assert len(password) == DEFAULT_PASSWORD_GEN_CHAR_LENGTH
        for char in password:
            assert char in ALLOWED_AUTOGEN_PASSWORD_CHAR
