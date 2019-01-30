# -*- coding: utf-8 -*-
import json
import os

from babel.core import default_locale
import typing
if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG

TRANSLATION_FILENAME = 'backend.json'
DEFAULT_FALLBACK_LANG = 'en'

def translator_marker(string: str) -> str:
    """
    Use this and rename it to _ in order to allow translation of string,
    this function does not do any action on string given and return it.
    """
    return string

class Translator(object):
    """
    Get translation from json file
    """

    def __init__(self, app_config: 'CFG', default_lang: str = None, fallback_lang: str = None):  # nopep8
        self.config = app_config
        if not fallback_lang:
            fallback_lang = DEFAULT_FALLBACK_LANG
        self.fallback_lang = fallback_lang
        if not default_lang:
            default_lang = fallback_lang
        self.default_lang = default_lang

    def _get_json_translation_lang_filepath(self, lang: str) -> typing.Optional[str]:  # nopep8
        i18n_folder = self.config.BACKEND_I18N_FOLDER
        lang_filepath = os.path.join(i18n_folder, lang, TRANSLATION_FILENAME)
        if not os.path.isdir(self.config.BACKEND_I18N_FOLDER):
            return None
        else:
            return lang_filepath

    def _get_translation_from_file(self, filepath: str) -> typing.Optional[typing.Dict[str, str]]:  # nopep8
        try:
            with open(filepath) as file:
                trads = json.load(file)
                return trads
        except Exception:
            return None

    def _get_translation(self, lang: str, message: str) -> typing.Tuple[str, bool]:
        try:
            translation_filepath = self._get_json_translation_lang_filepath(lang)  # nopep8
            translation = self._get_translation_from_file(translation_filepath)
            if message in translation and translation[message]:
                return translation[message], True
        except Exception:
            pass
        return message, False

    def get_translation(self, message: str, lang: str = None) -> str:
        """
        Return translation according to lang
        """
        if not lang:
            lang = self.default_lang
        if lang != self.fallback_lang:
            new_trad, trad_found = self._get_translation(lang, message)
            if trad_found:
                return new_trad
        new_trad, trad_found = self._get_translation(self.fallback_lang, message)
        if trad_found:
            return new_trad
        return message


def get_locale():
    # TODO - G.M - 27-03-2018 - [i18n] Reconnect true internationalization
    return default_locale('LC_TIME')
