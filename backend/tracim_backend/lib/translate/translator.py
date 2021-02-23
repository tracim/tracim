from abc import ABC
from abc import abstractmethod
from collections import namedtuple
from typing import BinaryIO
from typing import List

AUTODETECT_LANG = "auto"
TranslationLanguagePair = namedtuple("TranslationLanguagePair", ["input_lang", "output_lang"])
TranslationMimetypePair = namedtuple(
    "TranslationMimetypePair", ["input_mimetype", "output_mimetype"]
)


class TranslationFailed(Exception):
    pass


class TranslateService(ABC):
    """
    Translation service: Class based on this should
    connect to a service, and permit to obtain translations
    """

    @abstractmethod
    def translate_file(
        self,
        language_pair: TranslationLanguagePair,
        file_buffer: BinaryIO,
        mimetype: str,
        **options,
    ) -> BinaryIO:
        """ Translate a file"""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """ Name of the Translation service"""
        pass

    @property
    @abstractmethod
    def supported_languages_pair(self) -> List[TranslationLanguagePair]:
        """How to obtain the list of translation pair supported"""
        pass

    @property
    @abstractmethod
    def supported_mimetypes_pair(self) -> List[TranslationMimetypePair]:
        """ List of supported mimetypes for the service"""
        pass


class ExternalTranslator:
    """
    Main class for translation, same api for different translation service.
    """

    def __init__(self, translate_service: TranslateService):
        self.translate_service = translate_service

    def translate(
        self, input_lang: str, output_lang: str, file_buffer: BinaryIO, mimetype: str, **options
    ):
        current_node = TranslationLanguagePair(input_lang, output_lang)
        return self._translate(
            current_node, self.translate_service, file_buffer, mimetype, **options
        )

    def _translate(
        self,
        translation_node: TranslationLanguagePair,
        backend: TranslateService,
        file_buffer: BinaryIO,
        mimetype: str,
        **options,
    ):
        return backend.translate_file(translation_node, file_buffer, mimetype, **options)
