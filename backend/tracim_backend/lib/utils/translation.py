# -*- coding: utf-8 -*-
import json
import os

from babel.core import default_locale
import typing
if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG

TRANSLATION_FILENAME = 'translation.json'
DEFAULT_FALLBACK_LANG = 'en'


class Translator(object):

    def __init__(self, app_config: 'CFG', default_lang: str = None, fallback_lang: str = None):  # nopep8
        self.config = app_config
        if not fallback_lang:
            fallback_lang = DEFAULT_FALLBACK_LANG
        self.fallback_lang = fallback_lang
        if not default_lang:
            default_lang = fallback_lang
        self.default_lang = default_lang

    def _get_trad_filepath(self, lang: str) -> typing.Optional[str]:
        i18n_folder = self.config.BACKEND_I18N_FOLDER
        lang_filepath = os.path.join(i18n_folder, lang, TRANSLATION_FILENAME)
        if not os.path.isdir(self.config.BACKEND_I18N_FOLDER):
            return None
        else:
            return lang_filepath

    def _get_trad_from_file(self, filepath: str) -> typing.Optional[typing.Dict[str, str]]:  # nopep8
        try:
            with open(filepath) as file:
                trads = json.load(file)
                return trads
        except Exception:
            return None

    def _get_trad(self, lang: str, message: str) -> typing.Tuple[str, bool]:
        try:
            trad_file = self._get_trad_filepath(lang)
            trad = self._get_trad_from_file(trad_file)
            if message in trad:
                return trad[message], True
        except Exception:
            pass
        return message, False

    def get_trad(self, message: str, lang: str = None) -> str:
        if not lang:
            lang = self.default_lang
        if lang != self.fallback_lang:
            new_trad, trad_found = self._get_trad(lang, message)
            if trad_found:
                return new_trad
        new_trad, trad_found = self._get_trad(self.fallback_lang, message)
        if trad_found:
            return new_trad
        return message


def get_locale():
    # TODO - G.M - 27-03-2018 - [i18n] Reconnect true internationalization
    return default_locale('LC_TIME')
