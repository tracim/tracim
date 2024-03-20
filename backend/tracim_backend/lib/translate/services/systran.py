from http import HTTPStatus
import mimetypes
import re
import requests
from typing import Any
from typing import BinaryIO
from typing import List
from typing import Optional

from tracim_backend.lib.translate.translator import InvalidParametersForTranslationService
from tracim_backend.lib.translate.translator import TranslationInputLanguageEqualToOutput
from tracim_backend.lib.translate.translator import TranslationLanguagePair
from tracim_backend.lib.translate.translator import TranslationMimetypePair
from tracim_backend.lib.translate.translator import TranslationService
from tracim_backend.lib.translate.translator import TranslationServiceAccessRefused
from tracim_backend.lib.translate.translator import TranslationServiceException
from tracim_backend.lib.translate.translator import TranslationServiceServerError
from tracim_backend.lib.translate.translator import TranslationServiceTimeout
from tracim_backend.lib.translate.translator import UnavailableTranslationLanguagePair

FILE_TRANSLATION_ENDPOINT = "/translation/file/translate"
SUPPORTED_FORMAT_ENDPOINT = "/translation/supportedFormats"
SUPPORTED_LANGUAGES_ENDPOINT = "/translation/supportedLanguages"


class SystranFormat:
    def __init__(self, name: str, mimetype_pair: TranslationMimetypePair) -> None:
        self.name = name
        self.mimetype_pair = mimetype_pair

    def __repr__(self) -> str:
        return "<SystranFormat(name={}, translation_pair={})>".format(
            repr(self.name),
            repr(self.mimetype_pair),
        )


class SystranTranslationService(TranslationService):
    def __init__(self, api_url: str, api_key: str, timeout: Optional[float] = None) -> None:
        self.api_url = api_url
        self.api_key = api_key
        self.timeout = timeout

    @property
    def name(self) -> str:
        return "Systran"

    def _add_auth_to_headers(self, headers: dict) -> dict:
        headers["Authorization"] = "{} {}".format("Key", self.api_key)
        return headers

    def _translate_file(
        self,
        language_pair: TranslationLanguagePair,
        binary_io: BinaryIO,
        mimetype: str,
        **kwargs: Any
    ) -> BinaryIO:
        format = kwargs.get("format")
        extension = mimetypes.guess_extension(mimetype)
        file_name = "file{}".format(extension)
        params = {
            "source": language_pair.input_lang,
            "target": language_pair.output_lang,
            "async": False,
        }
        headers = self._add_auth_to_headers({})
        if format:
            params["format"] = format
        try:
            response = requests.post(
                "{}{}".format(self.api_url, FILE_TRANSLATION_ENDPOINT),
                files={"input": (file_name, binary_io, mimetype)},
                params=params,
                headers=headers,
                timeout=self.timeout,
                stream=True,
            )
        except requests.exceptions.Timeout:
            # NOTE - S.G. - 2021-03-05 - Timeout is useful
            # as the systran API sometimes takes a very long time before returning an error.
            # Known cases: translation of an english file in english with some texts.
            msg = "Translation response took more than {} seconds to arrive".format(self.timeout)
            raise TranslationServiceTimeout(msg)
        if response.status_code == HTTPStatus.OK:
            return response.raw
        elif response.status_code == HTTPStatus.FORBIDDEN:
            raise TranslationServiceAccessRefused("access refused to systran translation service")
        else:
            try:
                error = response.json()["error"]
            except Exception as exc:
                raise TranslationServiceException(
                    "Unknown error when requesting translation server"
                ) from exc

            if error.get("statusCode") == HTTPStatus.BAD_REQUEST:
                raise InvalidParametersForTranslationService(
                    "Invalid parameters given for translation: {}".format(error["message"])
                )
            elif error.get("statusCode") == HTTPStatus.INTERNAL_SERVER_ERROR:
                # HACK - S.G. - 2021-03-05 - special error case
                # when autodetected source is the same as the target language
                regex = re.compile(".*Translate_(\\w+)_{}.*".format(language_pair.output_lang))
                matches = regex.match(error.get("message", ""))
                if matches:
                    if matches.group(1) == language_pair.output_lang:
                        raise TranslationInputLanguageEqualToOutput(error["message"])
                    else:
                        raise UnavailableTranslationLanguagePair(
                            "source: {}, target: {}".format(
                                matches.group(1), language_pair.output_lang
                            )
                        )
                raise TranslationServiceServerError(
                    "Translation service server error: {}".format(error["message"])
                )
            else:
                raise TranslationServiceException(error["message"])

    @property
    def supported_formats(self) -> List[SystranFormat]:
        formats = []
        headers = self._add_auth_to_headers({})
        response = requests.get(
            "{}{}".format(self.api_url, SUPPORTED_FORMAT_ENDPOINT),
            headers=headers,
        )
        json_response = response.json()
        for format in json_response["formats"]:
            name = format["name"]
            input_mimetype = format["mimetypes"]["input"]
            output_mimetype = format["mimetypes"]["output"]
            mimetype_pair = TranslationMimetypePair(input_mimetype, output_mimetype)
            formats.append(SystranFormat(name, mimetype_pair))
        return formats

    @property
    def supported_mimetype_pairs(self) -> List[TranslationMimetypePair]:
        mimetype_pairs = []
        for format in self.supported_formats:
            mimetype_pairs.append(format.mimetype_pair)
        return mimetype_pairs

    @property
    def supported_language_pairs(self) -> List[TranslationLanguagePair]:
        language_pairs = []
        headers = self._add_auth_to_headers({})
        response = requests.get(
            "{}{}".format(self.api_url, SUPPORTED_LANGUAGES_ENDPOINT),
            headers=headers,
        )
        json_response = response.json()
        pairs = json_response["languagePairs"]
        for pair in pairs:
            source = pair["source"]
            target = pair["target"]
            language_pairs.append(TranslationLanguagePair(source, target))
        return language_pairs
