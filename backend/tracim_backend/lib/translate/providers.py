from enum import Enum

from tracim_backend.lib.translate.services.systran import SystranTranslationService


class TranslationProvider(str, Enum):
    SYSTRAN = "systran"


TRANSLATION_SERVICE_CLASSES = {TranslationProvider.SYSTRAN: SystranTranslationService}
