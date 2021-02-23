import io
from typing import BinaryIO
from typing import List

import responses

from tracim_backend.lib.translate.services.systran import FILE_TRANSLATION_ENDPOINT
from tracim_backend.lib.translate.services.systran import SUPPORTED_FORMAT_ENDPOINT
from tracim_backend.lib.translate.services.systran import SUPPORTED_LANGUAGES_ENDPOINT
from tracim_backend.lib.translate.services.systran import SystranTranslateService
from tracim_backend.lib.translate.translator import ExternalTranslator
from tracim_backend.lib.translate.translator import TranslateService
from tracim_backend.lib.translate.translator import TranslationLanguagePair
from tracim_backend.lib.translate.translator import TranslationMimetypePair


class FakeTranslateService(TranslateService):
    """
    Sample example of translation service:
    Do uppercase the text/plain file given.
    """

    @property
    def name(self):
        return "uppercase"

    def translate_file(
        self, language_pair, file_buffer: BinaryIO, mimetype: str, **options
    ) -> BinaryIO:
        return io.BytesIO("Translated".encode("utf-8"))

    @property
    def supported_languages_pair(self):
        return [
            TranslationLanguagePair("fr", "en"),
            TranslationLanguagePair("en", "fr"),
        ]

    @property
    def supported_mimetypes_pair(self) -> List[str]:
        return ["text/plain"]


class TestExternalTranslator:
    def test__fake_translate_service_translate__nominal_case(self):
        translator = ExternalTranslator(FakeTranslateService())
        base_content = io.BytesIO("Source content".encode("utf-8"))
        result = translator.translate("fr", "en", base_content, "text/plain",)
        assert result.read().decode("utf-8") == "Translated"


class TestSystranTranslateService:
    @responses.activate
    def test_unit___systran_service__supported_languages_pair__ok__nominal_case(self):
        BASE_API_URL = "https://systran_fake_server:5050"
        API_KEY = "a super key"
        content_response_json = {
            "languagePairs": [
                {
                    "source": "en",
                    "target": "fr",
                    "profiles": [{"id": "XXXXXX-XXXX-XXXX-XXX-XXXX", "private": False}],
                }
            ]
        }
        responses.add(
            responses.GET,
            "{}{}".format(BASE_API_URL, SUPPORTED_LANGUAGES_ENDPOINT),
            json=content_response_json,
            status=200,
        )
        translate_service = SystranTranslateService(api_url=BASE_API_URL, api_key=API_KEY)

        assert len(translate_service.supported_languages_pair) == 1
        assert translate_service.supported_languages_pair[0] == TranslationLanguagePair("en", "fr")

    @responses.activate
    def test_unit___systran_service__supported_mimetype_pairs__ok__nominal_case(self):
        BASE_API_URL = "https://systran_fake_server:5050"
        API_KEY = "a super key"
        content_response_json = {
            "formats": [
                {"mimetypes": {"input": "text/input", "output": "text/output"}, "name": "sample"}
            ]
        }
        responses.add(
            responses.GET,
            "{}{}".format(BASE_API_URL, SUPPORTED_FORMAT_ENDPOINT),
            json=content_response_json,
            status=200,
        )
        translate_service = SystranTranslateService(api_url=BASE_API_URL, api_key=API_KEY)
        mimetype_pair = TranslationMimetypePair("text/input", "text/output")
        assert len(translate_service.supported_format) == 1
        format = translate_service.supported_format[0]
        assert format.name == "sample"
        assert format.mimetype_pair == mimetype_pair

        assert len(translate_service.supported_mimetypes_pair) == 1
        assert translate_service.supported_mimetypes_pair[0] == mimetype_pair

    @responses.activate
    def test_unit___systran_service__translate_file__ok__nominal_case(self):
        BASE_API_URL = "https://systran_fake_server:5050"
        API_KEY = "a super key"
        base_content = io.BytesIO("Source content".encode("utf-8"))
        result_content = io.BytesIO("Translated".encode("utf-8"))
        responses.add(
            responses.POST,
            "{}{}".format(BASE_API_URL, FILE_TRANSLATION_ENDPOINT),
            body=result_content.read(),
            status=200,
            content_type="text/plain",
            stream=True,
        )
        translate_service = SystranTranslateService(api_url=BASE_API_URL, api_key=API_KEY)
        result = translate_service.translate_file(
            file_buffer=base_content,
            language_pair=TranslationLanguagePair("fr", "en"),
            mimetype="text/plain",
        )
        assert result.read().decode("utf-8") == "Translated"
