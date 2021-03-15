from abc import ABC
from abc import abstractmethod
from collections import namedtuple
from typing import Any
from typing import BinaryIO
from typing import List

AUTODETECT_LANG = "auto"
TranslationLanguagePair = namedtuple("TranslationLanguagePair", ["input_lang", "output_lang"])
TranslationMimetypePair = namedtuple(
    "TranslationMimetypePair", ["input_mimetype", "output_mimetype"]
)


class TranslationServiceException(Exception):
    pass


class TranslationServiceAccessRefused(TranslationServiceException):
    pass


class InvalidParametersForTranslationService(TranslationServiceException):
    pass


class TranslationServiceServerError(TranslationServiceException):
    pass


class TranslationInputLanguageEqualToOutput(TranslationServiceException):
    pass


class UnavailableTranslationLanguagePair(TranslationServiceException):
    pass


class TranslationServiceTimeout(TranslationServiceException):
    pass


class TranslationService(ABC):
    """
    Translation service: Class based on this should
    connect to a service, and permit to obtain translations
    """

    def translate_file(
        self, input_lang: str, output_lang: str, binary_io: BinaryIO, mimetype: str, **options: Any
    ) -> BinaryIO:
        language_pair = TranslationLanguagePair(input_lang, output_lang)
        return self._translate_file(language_pair, binary_io, mimetype, **options)

    @abstractmethod
    def _translate_file(
        self,
        language_pair: TranslationLanguagePair,
        binary_io: BinaryIO,
        mimetype: str,
        **kwargs: Any
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
    def supported_language_pairs(self) -> List[TranslationLanguagePair]:
        """How to obtain the list of translation pair supported"""
        pass

    @property
    @abstractmethod
    def supported_mimetype_pairs(self) -> List[TranslationMimetypePair]:
        """ List of supported mimetypes for the service"""
        pass
