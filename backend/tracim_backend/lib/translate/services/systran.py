from http import HTTPStatus
import mimetypes
from typing import Any
from typing import BinaryIO
from typing import List

import requests

from tracim_backend.lib.translate.translator import TranslationFailed
from tracim_backend.lib.translate.translator import TranslationLanguagePair
from tracim_backend.lib.translate.translator import TranslationMimetypePair
from tracim_backend.lib.translate.translator import TranslationService

FILE_TRANSLATION_ENDPOINT = "/translation/file/translate"
SUPPORTED_FORMAT_ENDPOINT = "/translation/supportedFormats"
SUPPORTED_LANGUAGES_ENDPOINT = "/translation/supportedLanguages"


class SystranFormat:
    def __init__(self, name: str, mimetype_pair: TranslationMimetypePair) -> None:
        self.name = name
        self.mimetype_pair = mimetype_pair

    def __repr__(self) -> str:
        return "<SystranFormat(name={}, translation_pair={})>".format(
            repr(self.name), repr(self.mimetype_pair),
        )


class SystranTranslationService(TranslationService):
    def __init__(self, api_url: str, api_key: str) -> None:
        self.api_url = api_url
        self.api_key = api_key

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
        response = requests.post(
            "{}{}".format(self.api_url, FILE_TRANSLATION_ENDPOINT),
            files={"input": (file_name, binary_io, mimetype)},
            params=params,
            headers=headers,
            stream=True,
        )
        if response.status_code == HTTPStatus.OK:
            return response.raw
        else:
            raise TranslationFailed(str(response.json()))

    @property
    def supported_formats(self) -> List[SystranFormat]:
        formats = []
        headers = self._add_auth_to_headers({})
        response = requests.get(
            "{}{}".format(self.api_url, SUPPORTED_FORMAT_ENDPOINT), headers=headers,
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
            "{}{}".format(self.api_url, SUPPORTED_LANGUAGES_ENDPOINT), headers=headers,
        )
        json_response = response.json()
        pairs = json_response["languagePairs"]
        for pair in pairs:
            source = pair["source"]
            target = pair["target"]
            language_pairs.append(TranslationLanguagePair(source, target))
        return language_pairs


# TODO: remove this code as soon as tracim implement the api.
if __name__ == "__main__":
    import os

    simple_html_file = "valid path"
    translation_service = SystranTranslationService(
        api_url=os.environ["SYSTRAN_API_URL"], api_key=os.environ["SYSTRAN_API_KEY"]
    )
    with open(simple_html_file, "rb") as my_file:
        result = translation_service.translate_file(
            "fr",
            "ko",
            my_file,
            "text/html",
            format="html",  # this one is optional, it is useful to force format for translation
        )
        with open("/tmp/test_result", "wb+") as new_file:
            new_file.write(result.read())
