import string

import pytest
from tracim_backend.lib.utils.utils import password_generator, Color, clamp
from tracim_backend.lib.utils.utils import ALLOWED_AUTOGEN_PASSWORD_CHAR
from tracim_backend.lib.utils.utils import DEFAULT_PASSWORD_GEN_CHAR_LENGTH


class TestPasswordGenerator(object):

    def test_password_generator_ok_nominal_case(self):
        password = password_generator()
        assert len(password) == DEFAULT_PASSWORD_GEN_CHAR_LENGTH
        for char in password:
            assert char in ALLOWED_AUTOGEN_PASSWORD_CHAR


class TestClamp(object):

    def test_clamp_ok_nominal_case(self):
        # min
        assert clamp(-0.1, 0.0, 255.0) == 0
        # max
        assert clamp(255.1, 0.0, 255.0) == 255
        # convert as int -> truncate
        assert clamp(125.1, 0.0, 255.0) == 125
        assert clamp(125.9, 0.0, 255.0) == 125


class TestColor(object):

    def test_color__init__ok_nominal_case(self):
        color = Color('#FFFFFF')
        assert color.normal == '#FFFFFF'

    def test_color__init__ok_bad_value(self):
        # more than 7 char
        with pytest.raises(AssertionError):
            Color('#FFFFFFFA')
        # no "#" at the beginning
        with pytest.raises(AssertionError):
            Color('FFFFFFA')

    def test_color__correct_color_format(self):
        color = Color('#FFFFFF')
        colors = [
            color.normal,
            color.darken,
            color.darken,
            color.get_hexcolor(1.5),
            color.get_hexcolor(3.47),
            color.get_hexcolor(5.2),
            color.get_hexcolor(0.1),
            color.get_hexcolor(0),
            color.get_hexcolor(0.25),
        ]
        for color in colors:
            assert isinstance(color, str)
            assert len(color) == 7
            assert color[0] == '#'

    def test_color__get_hex_color__verify__corner_case(self):
        color = Color('#FF3232')
        assert color.get_hexcolor(0) == "#000000"
        assert color.get_hexcolor(99) == "#ffffff"
