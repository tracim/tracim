from enum import Enum
from io import BytesIO
import typing

from hapic.data import HapicFile
from sqlalchemy.orm import Session

from tracim_backend.exceptions import TracimException
from tracim_backend.lib.translate.services.systran import SystranTranslationService
from tracim_backend.lib.translate.services.test import TestTranslationService
from tracim_backend.lib.translate.translator import TranslationInputLanguageEqualToOutput
from tracim_backend.lib.translate.translator import TranslationService
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG


class TranslationProvider(str, Enum):
    SYSTRAN = "systran"
    TEST = "test"


TRANSLATION_SERVICE_CLASSES = {
    TranslationProvider.SYSTRAN: SystranTranslationService,
    TranslationProvider.TEST: TestTranslationService,
}


class TranslationLib:
    """
    Tracim Lib to use TranslationServices
    """

    def __init__(
        self, session: Session, current_user: typing.Optional[User], config: "CFG"
    ) -> None:
        self._user = current_user
        self._session = session
        self._config = config

    def get_translation_service(self) -> TranslationService:

        if self._config.TRANSLATION_SERVICE__PROVIDER == TranslationProvider.SYSTRAN:
            return SystranTranslationService(
                api_url=self._config.TRANSLATION_SERVICE__SYSTRAN__API_URL,
                api_key=self._config.TRANSLATION_SERVICE__SYSTRAN__API_KEY,
                timeout=self._config.TRANSLATION_SERVICE__TIMEOUT,
            )
        elif self._config.TRANSLATION_SERVICE__PROVIDER == TranslationProvider.TEST:
            logger.warning(self, "Running in test translation service !")
            return TestTranslationService()
        else:
            raise TracimException("Translation Service not available")

    def translate_raw_content(
        self,
        content_id: int,
        source_language_code: str,
        target_language_code: str,
        force_download: bool,
        mimetype: str,
        filename: typing.Optional[str],
        revision_id: typing.Optional[int] = None,
    ):
        # TODO - S.G. - 2021-03-05 - fix circular import
        # due to TRANSLATION_SERVICE_CLASSES use in CFG.
        from tracim_backend.lib.core.content import ContentApi

        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=self._user,
            session=self._session,
            config=self._config,
        )
        content = api.get_one(content_id)
        if revision_id:
            revision = api.get_one_revision(revision_id=revision_id, content=content)
        else:
            revision = content.current_revision
        if not filename or "raw":
            filename = revision.file_name
        bytes_io = BytesIO(revision.raw_content.encode("utf-8"))
        translation_service = self.get_translation_service()
        try:
            file_object = translation_service.translate_file(
                input_lang=source_language_code,
                output_lang=target_language_code,
                mimetype=mimetype,
                binary_io=bytes_io,
            )
        except TranslationInputLanguageEqualToOutput:
            file_object = BytesIO(content.raw_content.encode("utf-8"))
        return HapicFile(
            file_object=file_object,
            mimetype=mimetype,
            filename=filename,
            as_attachment=force_download,
            last_modified=content.updated,
        )
