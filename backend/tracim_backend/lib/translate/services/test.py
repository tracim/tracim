import io
from typing import Any
from typing import BinaryIO
from typing import List

from tracim_backend.lib.translate.translator import TranslationLanguagePair
from tracim_backend.lib.translate.translator import TranslationMimetypePair
from tracim_backend.lib.translate.translator import TranslationService
from tracim_backend.lib.translate.translator import TranslationServiceException


class TestTranslationService(TranslationService):
    """
    A Translation service that just serve for test purpose
    as result given are not real translation.
    """

    @property
    def name(self) -> str:
        return "TranslationServiceTester"

    def _translate_file(
        self,
        language_pair: TranslationLanguagePair,
        binary_io: BinaryIO,
        mimetype: str,
        **kwargs: Any
    ) -> BinaryIO:
        try:
            test_response = """
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
                        <td>{}</td>
                        <td>{}</td>
                        <td>{}</td>
                    </tr>
                </tbody>
            </table>
            """.format(
                language_pair.input_lang, language_pair.output_lang, mimetype
            )
            return io.BytesIO(test_response.encode("utf-8"))
        except Exception:
            raise TranslationServiceException("File given should be utf-8 encoded text")

    @property
    def supported_mimetype_pairs(self) -> List[TranslationMimetypePair]:
        return [TranslationMimetypePair("text/html", "text/html")]

    @property
    def supported_language_pairs(self) -> List[TranslationLanguagePair]:
        """
        This service don't support real language source and destination
        """
        return [TranslationLanguagePair("test_source", "test_result")]
