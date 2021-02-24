from http import HTTPStatus
import mimetypes
from typing import BinaryIO
from typing import List

import requests

from tracim_backend.lib.translate.translator import ExternalTranslator
from tracim_backend.lib.translate.translator import TranslateService
from tracim_backend.lib.translate.translator import TranslationFailed
from tracim_backend.lib.translate.translator import TranslationLanguagePair
from tracim_backend.lib.translate.translator import TranslationMimetypePair

FILE_TRANSLATION_ENDPOINT = "/translation/file/translate"
SUPPORTED_FORMAT_ENDPOINT = "/translation/supportedFormats"
SUPPORTED_LANGUAGES_ENDPOINT = "/translation/supportedLanguages"


class SystranFormat:
    def __init__(self, name: str, mimetype_pair: TranslationMimetypePair):
        self.name = name
        self.mimetype_pair = mimetype_pair

    def __repr__(self):
        return "<SystranFormat(name={}, translation_pair={})>".format(
            repr(self.name),
            repr(self.mimetype_pair),
        )


class SystranTranslationService(TranslationService):

    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key

    @property
    def name(self):
        return "Systran"

    def _add_auth_to_params(self, params: dict) -> dict:
        params["key"] = self.api_key
        return params

    def translate_file(
        self, language_pair: TranslationLanguagePair, binary_io: BinaryIO, mimetype: str, **kwargs: typing.Any
    ) -> BinaryIO:
        format = kwargs.get("format")
        extension = mimetypes.guess_extension(mimetype)
        file_name = "file{}".format(extension)
        params = {
            "source": language_pair.input_lang,
            "target": language_pair.output_lang,
            "async": False,
        }
        params = self._add_auth_to_params(params)
        if format:
            params["format"] = format
        response = requests.post(
            "{}{}".format(self.api_url, FILE_TRANSLATION_ENDPOINT),
            files={"input": (file_name, binary_io, mimetype)},
            params=params,
            # TODO: RECHECK how to use header instead of query parameter
            # headers={
            #      'Authorization': 'api_key {}'.format(self.api_key)
            # },
            stream=True,
        )
        if response.status_code == HTTPStatus.OK:
            return response.raw
        else:
            raise TranslationFailed(str(response.json()))

    @property
    def supported_formats(self) -> List[SystranFormat]:
        formats = []
        params = self._add_auth_to_params({})
        response = requests.get(
            "{}{}".format(self.api_url, SUPPORTED_FORMAT_ENDPOINT),
            # TODO: RECHECK how to use header instead of query parameter
            params=params,
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
        for format in self.supported_format:
            mimetype_pairs.append(format.mimetype_pair)
        return mimetype_pairs

    @property
    def supported_language_pairs(self) -> List[TranslationLanguagePair]:
        language_pairs = []
        params = self._add_auth_to_params({})
        response = requests.get(
            "{}{}".format(self.api_url, SUPPORTED_LANGUAGES_ENDPOINT),
            # TODO: RECHECK how to use header instead of query parameter
            params=params,
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

    simple_html_file = "a valid_path"
    translator = ExternalTranslator(
        SystranTranslateService(
            api_url=os.environ["SYSTRAN_API_URL"], api_key=os.environ["SYSTRAN_API_KEY"]
        )
    )
    with open(simple_html_file, "rb") as my_file:
        result = translator.translate(
            "fr",
            "ko",
            my_file,
            "text/html",
            format="html",  # this one is optional, it is useful to force format for translation
        )
        with open("/tmp/test_result", "wb+") as new_file:
            new_file.write(result.read())
