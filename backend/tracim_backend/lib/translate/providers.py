from enum import Enum
import typing

from sqlalchemy.orm import Session

from tracim_backend.lib.translate.services.systran import SystranTranslationService
from tracim_backend.lib.translate.translator import TranslationService
from tracim_backend.models.auth import User

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG


class TranslationProvider(str, Enum):
    SYSTRAN = "systran"


TRANSLATION_SERVICE_CLASSES = {TranslationProvider.SYSTRAN: SystranTranslationService}


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

    def get_translation_service(self) -> typing.Optional[TranslationService]:

        if self._config.TRANSLATION_SERVICE__PROVIDER == TranslationProvider.SYSTRAN:
            return SystranTranslationService(
                api_url=self._config.TRANSLATION_SERVICE__SYSTRAN__API_URL,
                api_key=self._config.TRANSLATION_SERVICE__SYSTRAN__API_KEY,
            )
        else:
            return None
