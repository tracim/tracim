# -*- coding: utf-8 -*-
from enum import Enum
import glob
import json
import pathlib
import typing

from babel.core import default_locale

from tracim_backend.exceptions import NotReadableFile
from tracim_backend.exceptions import TranslationConfigurationError
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.utils import is_file_readable

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG

DEFAULT_FALLBACK_LANG = "en"


def translator_marker(string: str) -> str:
    """
    Use this and rename it to _ in order to allow
    translation of string by external program like gettext.
    this function does not do any action on string given and return it.
    """
    return string


class TranslationSource(Enum):
    GLOBAL = "*/backend.json"
    CUSTOM_PROPERTIES = "*.json"


class Translator(object):
    """
    Get translation from json file
    """

    def __init__(
        self,
        app_config: "CFG",
        default_lang: str = None,
        fallback_lang: str = None,
        default_source: TranslationSource = TranslationSource.GLOBAL,
    ):
        """
        you should provide either valid fallback_lang(true value) or valid
        app.config.DEFAULT_LANG (true value).
        """
        if not fallback_lang:
            assert app_config.DEFAULT_LANG
            fallback_lang = app_config.DEFAULT_LANG
        self.fallback_lang = fallback_lang
        if not default_lang:
            default_lang = fallback_lang
        self.default_lang = default_lang
        self.default_source = default_source
        self.app_config = app_config

    @classmethod
    def init_translations(cls, app_config: "CFG") -> "CFG":
        logger.debug(cls, "Load Translations")

        app_config.TRANSLATIONS = {
            TranslationSource.GLOBAL.name: {},
            TranslationSource.CUSTOM_PROPERTIES.name: {},
        }
        # global translations
        files = glob.glob(
            str(pathlib.Path(app_config.BACKEND__I18N_FOLDER_PATH, TranslationSource.GLOBAL.value))
        )
        global_backend_langs = []
        for file in files:
            lang = pathlib.Path(file).parent.name
            try:
                is_file_readable(file)
            except NotReadableFile as exc:
                raise TranslationConfigurationError(
                    "translation file {} is not readable: {}".format(file, str(exc))
                ) from exc
            app_config.TRANSLATIONS[TranslationSource.GLOBAL.name][
                lang
            ] = cls._get_translation_from_file(file)
            global_backend_langs.append(lang)
        logger.debug(cls, "Supported Backend language (Global): " + ",".join(global_backend_langs))

        # custom_properties translations
        custom_properties_langs = []
        if app_config.USER__CUSTOM_PROPERTIES__TRANSLATIONS_DIR_PATH:
            files = glob.glob(
                str(
                    pathlib.Path(
                        app_config.USER__CUSTOM_PROPERTIES__TRANSLATIONS_DIR_PATH,
                        TranslationSource.CUSTOM_PROPERTIES.value,
                    )
                )
            )
            for file in files:
                lang = pathlib.Path(file).name.split(".")[0]
                try:
                    is_file_readable(file)
                except NotReadableFile as exc:
                    raise TranslationConfigurationError(
                        'ERROR: translation file "{}" is not readable: {}'.format(file, str(exc))
                    ) from exc
                app_config.TRANSLATIONS[TranslationSource.CUSTOM_PROPERTIES.name][
                    lang
                ] = cls._get_translation_from_file(file)
                custom_properties_langs.append(lang)
        logger.debug(
            cls,
            "Supported Backend language (Custom Properties): " + ",".join(custom_properties_langs),
        )
        logger.debug(cls, "Translations Loaded")

    @classmethod
    def _get_translation_from_file(self, filepath: str) -> typing.Optional[typing.Dict[str, str]]:
        try:
            with open(filepath) as file:
                trads = json.load(file)
                return trads
        except json.JSONDecodeError as exc:
            not_a_valid_json_file_msg = 'ERROR: "{}" is not a valid json file: {}'
            raise TranslationConfigurationError(not_a_valid_json_file_msg.format(filepath, str(exc))) from exc

    def _get_translation(
        self, lang: str, message: str, source: TranslationSource
    ) -> typing.Tuple[str, bool]:
        try:
            message = self.app_config.TRANSLATIONS[source.name][lang][message]
            if message:
                return message, True
        except KeyError:
            pass
        return message, False

    def get_translation(
        self, message: str, lang: str = None, source: typing.Optional[TranslationSource] = None
    ) -> str:
        """
        Return translation according to lang
        """
        source = source or self.default_source
        lang = lang or self.default_lang
        for l in (lang, self.fallback_lang):
            translated_message, translation_found = self._get_translation(l, message, source=source)
            if translation_found:
                return translated_message
        return message


def get_locale():
    # TODO - G.M - 27-03-2018 - [i18n] Reconnect true internationalization
    return default_locale("LC_TIME")
