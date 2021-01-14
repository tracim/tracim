import re
import typing

from marshmallow import ValidationError
from marshmallow.validate import Regexp


def validate_simple_dict(dict_: typing.Dict) -> None:
    """
    A simple dict validator with:
    key as 0-9a-zA-Z-_. based string
    value as either: string, int, bool, float types
    """
    for key in dict_.keys():
        if not isinstance(key, str):
            raise ValidationError('Dictionary key "{}" is not a string'.format(key))
        regex_validator = Regexp(regex=(re.compile("^[0-9a-zA-Z-_.]+$")))
        try:
            regex_validator(key)
        except ValidationError as exc:
            raise ValidationError(
                'Dictionary key "{}" incorrect : {}'.format(key, str(exc))
            ) from exc

    # INFO - G.M - We assume float is the type used for float conversion,
    # this may change depending
    # on how the json parser is configured.
    float_type = float
    invalid_key_value_pairs = [
        (key, value)
        for key, value in dict_.items()
        if not isinstance(value, (str, int, bool, float_type, type(None)))
    ]
    if invalid_key_value_pairs:
        raise ValidationError(
            "Only string/number/null values are allowed as dictionary value. Invalid values: {}".format(
                invalid_key_value_pairs
            )
        )


def translate_dict(
    data: dict, keys_to_check: typing.List[str], translation_method: typing.Callable
) -> dict:
    """
    Regenerate similar dict but
    replace "key: string_value" pair
    by "key: translation_method(value)" pair
    recursively
    :param data: original dict
    :param keys_to_check: keys value to check for applying translation method
    :param translation_method: method to run for translation of key
    :return:
    """
    result = {}
    for key, value in data.items():
        if isinstance(value, str) and key in keys_to_check:
            result[key] = translation_method(value)
        elif isinstance(value, dict):
            result[key] = translate_dict(
                data=value, keys_to_check=keys_to_check, translation_method=translation_method,
            )
        elif isinstance(value, list):
            result[key] = translate_list(
                data=value,
                keys_to_check=keys_to_check,
                translation_method=translation_method,
                key=key,
            )
        else:
            result[key] = value
    return result


def translate_list(
    data: list,
    keys_to_check: typing.List[str],
    translation_method: typing.Callable,
    key: str = None,
) -> typing.List:
    """
    Regenerate similar list but
    replace "key: string_value" pair
    by "key: translation_method(value)" pair
    recursively
    :param data: original list
    :param keys_to_check: keys value to check for applying translation method
    :param translation_method: method to run for translation of key
    :param key
    :return: translated list
    """
    result = []
    for value in data:
        if isinstance(value, str) and key in keys_to_check:
            result.append(translation_method(value))
        elif isinstance(value, dict):
            result.append(
                translate_dict(
                    data=value, keys_to_check=keys_to_check, translation_method=translation_method
                )
            )
        else:
            result.append(value)
    return result


def get_translation_key_from_dict(data: dict, keys_to_check: typing.List[str]):
    """
    Utility method to ease the generation of translation files
    :param data: original dict
    :param keys_to_check: keys value to check for getting translation key
    """
    translation_dict = {}

    def provision_translation_dict(value: str):
        translation_dict[value] = ""

    translate_dict(data, keys_to_check, provision_translation_dict)

    return translation_dict
