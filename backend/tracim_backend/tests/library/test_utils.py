import pytest

from tracim_backend.lib.mail_notifier.utils import EmailAddress
from tracim_backend.lib.utils.dict_parsing import translate_dict
from tracim_backend.lib.utils.utils import ALLOWED_AUTOGEN_PASSWORD_CHAR
from tracim_backend.lib.utils.utils import DEFAULT_PASSWORD_GEN_CHAR_LENGTH
from tracim_backend.lib.utils.utils import ExtendedColor
from tracim_backend.lib.utils.utils import clamp
from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.lib.utils.utils import string_to_list


class TestPasswordGenerator(object):
    def test_password_generator_ok_nominal_case(self):
        password = password_generator()
        assert len(password) == DEFAULT_PASSWORD_GEN_CHAR_LENGTH
        for char in password:
            assert char in ALLOWED_AUTOGEN_PASSWORD_CHAR


class TestClamp(object):
    def test_clamp_ok_nominal_case(self):
        # min
        assert clamp(-0.1, 0.0, 255.0) == 0.0
        # max
        assert clamp(255.1, 0.0, 255.0) == 255.0
        # normla
        assert clamp(126.1, 0.0, 255.0) == 126.1


class TestExtendedColor(object):
    def test_extended_color__init__ok_nominal_case(self):
        color = ExtendedColor("#FFFFFF")
        assert color.web == "white"

    def test_extended_color__lighten_darken__nominal_case(self):
        color = ExtendedColor("#9f6644")
        color_darken = color.darken
        assert isinstance(color_darken, ExtendedColor)
        assert color_darken != color
        assert color_darken.web != color.web

        color_lighten = color.lighten
        assert isinstance(color_lighten, ExtendedColor)
        assert color_lighten != color
        assert color_lighten.web != color.web

        assert color_lighten != color_darken
        assert color_lighten.web != color_darken.web

    def test_extended_color__lighten_darken__white(self):
        color = ExtendedColor("#FFFFFF")
        assert color.web == "white"
        color_darken = color.darken
        color_lighten = color.lighten
        assert color_lighten == color
        assert color_lighten != color_darken
        assert color_lighten.web == color.web

    def test_extended_color__lighten_darken__black(self):
        color = ExtendedColor("#000000")
        assert color.web == "black"
        color_darken = color.darken
        color_lighten = color.lighten
        assert color_darken == color
        # INFO - G.M - 2018-09-12 - lighten can not
        # add X% more light to something already dark.
        assert color_darken == color_lighten
        assert color_darken.web == color.web


class TestStringToList(object):
    def test__unit__string_to_list__ok__list_of_string_unstripped(self):
        assert string_to_list(
            "one , two,three,fo ur", separator=",", cast_func=str, do_strip=False
        ) == ["one ", " two", "three", "fo ur"]

    def test_unit__string_to_list__ok__list_of_string_stripped(self):
        assert string_to_list(
            "one , two,three,fo ur", separator=",", cast_func=str, do_strip=True
        ) == ["one", "two", "three", "fo ur"]

    def test_unit__string_to_list__ok__list_of_int_(self):
        assert string_to_list("1,2,3,4", separator=",", cast_func=int, do_strip=True) == [
            1,
            2,
            3,
            4,
        ]


class TestTranslateDict(object):
    @pytest.mark.parametrize(
        "data,result",
        [
            [
                {"nomodify": "dontmodify", "modify": "modified"},
                {"nomodify": "dontmodify", "modify": "MODIFIED"},
            ],
            [
                {
                    "nomodify": {"nomodify3": "dontmodify", "modify1": "modified"},
                    "nomodify2": "dontmodify",
                    "modify2": "MODIFIED",
                },
                {
                    "nomodify": {"nomodify3": "dontmodify", "modify1": "MODIFIED"},
                    "nomodify2": "dontmodify",
                    "modify2": "MODIFIED",
                },
            ],
            [
                {"modify": ["this", "should", "be", "modified"]},
                {"modify": ["THIS", "SHOULD", "BE", "MODIFIED"]},
            ],
            [{"nomodify": [{"modify": "modify"}]}, {"nomodify": [{"modify": "MODIFY"}]}],
        ],
    )
    def test__unit_translate_dict__to_uppercase(self, data, result):
        def to_upper(data: str):
            return data.upper()

        assert (
            translate_dict(
                keys_to_check=["modify", "modify1", "modify2", "modify3"],
                data=data,
                translation_method=to_upper,
            )
            == result
        )


class TestEmailAddress(object):
    def test_unit__email_address_address__ok__nominal_case(self):
        john_address = EmailAddress(label="John Doe", email="john.doe@domainame.ndl")
        assert john_address.domain == "domainame.ndl"
        assert john_address.label == "John Doe"
        assert john_address.email == "john.doe@domainame.ndl"
        assert john_address.force_angle_bracket is False
        assert john_address.address == "John Doe <john.doe@domainame.ndl>"

    def test_unit__email_address_address__ok__force_angle_brackets(self):
        john_address = EmailAddress(
            label="John Doe", email="john.doe@domainame.ndl", force_angle_bracket=True
        )
        assert john_address.domain == "domainame.ndl"
        assert john_address.label == "John Doe"
        assert john_address.email == "john.doe@domainame.ndl"
        assert john_address.force_angle_bracket is True
        assert john_address.address == "John Doe <john.doe@domainame.ndl>"

    def test_unit__email_address_address__ok__empty_label(self):
        john_address = EmailAddress(label="", email="john.doe@domainame.ndl")
        assert john_address.domain == "domainame.ndl"
        assert john_address.label == ""
        assert john_address.email == "john.doe@domainame.ndl"
        assert john_address.force_angle_bracket is False
        assert john_address.address == "john.doe@domainame.ndl"

    def test_unit__email_address_address__ok__empty_label_and_force_angle_brackets(self):
        john_address = EmailAddress(
            label="", email="john.doe@domainame.ndl", force_angle_bracket=True
        )
        assert john_address.domain == "domainame.ndl"
        assert john_address.label == ""
        assert john_address.email == "john.doe@domainame.ndl"
        assert john_address.force_angle_bracket is True
        assert john_address.address == "<john.doe@domainame.ndl>"

    def test_unit__email_address_address__ok__from_rfc_email_address__no_label_no_bracket(self):
        john_address = EmailAddress.from_rfc_email_address("john.doe@domainame.ndl")
        assert john_address.domain == "domainame.ndl"
        assert john_address.label == ""
        assert john_address.email == "john.doe@domainame.ndl"
        assert john_address.force_angle_bracket is False
        assert john_address.address == "john.doe@domainame.ndl"

    def test_unit__email_address_address__ok__from_rfc_email_address__no_label_with_bracket(self):
        john_address = EmailAddress.from_rfc_email_address("<john.doe@domainame.ndl>")
        assert john_address.domain == "domainame.ndl"
        assert john_address.label == ""
        assert john_address.email == "john.doe@domainame.ndl"
        assert john_address.force_angle_bracket is False
        assert john_address.address == "john.doe@domainame.ndl"

    def test_unit__email_address_address__ok__from_rfc_email_address__nominal_case(self):
        john_address = EmailAddress.from_rfc_email_address("John Doe <john.doe@domainame.ndl>")
        assert john_address.domain == "domainame.ndl"
        assert john_address.label == "John Doe"
        assert john_address.email == "john.doe@domainame.ndl"
        assert john_address.force_angle_bracket is False
        assert john_address.address == "John Doe <john.doe@domainame.ndl>"

    def test_unit__email_address_address__ok__from_rfc_email_address__with_label_quotation(self):
        john_address = EmailAddress.from_rfc_email_address('"John Doe" <john.doe@domainame.ndl>')
        assert john_address.domain == "domainame.ndl"
        assert john_address.label == "John Doe"
        assert john_address.email == "john.doe@domainame.ndl"
        assert john_address.force_angle_bracket is False
        assert john_address.address == "John Doe <john.doe@domainame.ndl>"
