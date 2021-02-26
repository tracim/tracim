import io
from typing import BinaryIO
from typing import List

import responses

from tracim_backend.lib.translate.services.systran import FILE_TRANSLATION_ENDPOINT
from tracim_backend.lib.translate.services.systran import SUPPORTED_FORMAT_ENDPOINT
from tracim_backend.lib.translate.services.systran import SUPPORTED_LANGUAGES_ENDPOINT
from tracim_backend.lib.translate.services.systran import SystranTranslationService
from tracim_backend.lib.translate.services.test import TestTranslationService
from tracim_backend.lib.translate.translator import TranslationLanguagePair
from tracim_backend.lib.translate.translator import TranslationMimetypePair
from tracim_backend.lib.translate.translator import TranslationService


class FakeTranslationService(TranslationService):
    """
    Sample example of translation service:
    Do uppercase the text/plain file given.
    """

    @property
    def name(self):
        return "uppercase"

    def _translate_file(
        self, language_pair, binary_io: BinaryIO, mimetype: str, **options
    ) -> BinaryIO:
        return io.BytesIO("Translated".encode("utf-8"))

    @property
    def supported_language_pairs(self):
        return [
            TranslationLanguagePair("fr", "en"),
            TranslationLanguagePair("en", "fr"),
        ]

    @property
    def supported_mimetype_pairs(self) -> List[str]:
        return ["text/plain"]


class TestExternalTranslator:
    def test__fake_translate_service_translate_file__nominal_case(self) -> None:
        translator = FakeTranslationService()
        base_content = io.BytesIO("Source content".encode("utf-8"))
        result = translator.translate_file("fr", "en", base_content, "text/plain",)
        assert result.read().decode("utf-8") == "Translated"


class TestTestTranslationService:
    def test_unit___test_service__supported_mimetypes_pair__ok__nominal_case(self) -> None:
        translation_service = TestTranslationService()
        assert translation_service.supported_mimetype_pairs == [
            TranslationMimetypePair("text/html", "text/html")
        ]

    def test_unit___test_service__supported_languages_pair__ok__nominal_case(self) -> None:
        translation_service = TestTranslationService()
        assert translation_service.supported_language_pairs == [
            TranslationLanguagePair("test_source", "test_result")
        ]

    def test_unit___test_service__translate_file__ok__nominal_case(self):
        translation_service = TestTranslationService()
        assert (
            translation_service.translate_file(
                binary_io=io.BytesIO(b""),
                input_lang="test_source",
                output_lang="test_result",
                mimetype="text/html",
            )
            .read()
            .decode("utf-8")
            == """
        <table>
        <thead>
        <tr>
        <th>source_lang_code</th>
        <th>target_lang_code</th>
        <th>mimetype</th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td>test_source</td>
        <td>test_result</td>
        <td>text/html</td>
        </tr>
        </tbody>
        </table>
        """.strip().replace(
                " ", ""
            )
        )


class TestSystranTranslationService:
    @responses.activate
    def test_unit___systran_service__supported_languages_pair__ok__nominal_case(self) -> None:
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
        translation_service = SystranTranslationService(api_url=BASE_API_URL, api_key=API_KEY)

        assert len(translation_service.supported_language_pairs) == 1
        assert translation_service.supported_language_pairs[0] == TranslationLanguagePair(
            "en", "fr"
        )

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
        translation_service = SystranTranslationService(api_url=BASE_API_URL, api_key=API_KEY)
        mimetype_pair = TranslationMimetypePair("text/input", "text/output")
        assert len(translation_service.supported_formats) == 1
        format = translation_service.supported_formats[0]
        assert format.name == "sample"
        assert format.mimetype_pair == mimetype_pair

        assert len(translation_service.supported_mimetype_pairs) == 1
        assert translation_service.supported_mimetype_pairs[0] == mimetype_pair

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
        translation_service = SystranTranslationService(api_url=BASE_API_URL, api_key=API_KEY)
        result = translation_service.translate_file(
            input_lang="fr", output_lang="en", binary_io=base_content, mimetype="text/plain",
        )
        assert result.read().decode("utf-8") == "Translated"
