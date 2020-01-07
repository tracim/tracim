from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.applications.collaborative_document_edition.collaboration_document_edition_factory import (
    CollaborativeDocumentEditionFactory,
)
from tracim_backend.config import CFG
from tracim_backend.views import BASE_API_V2

SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS = "Collaborative Document Edition"
COLLABORATIVE_DOCUMENT_EDITION_BASE = "collaborative-document-edition"


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str, context: PyramidContext
) -> Configurator:
    if app_config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED:
        # TODO - G.M - 2019-07-17 - check if possible to avoid this import here,
        # import is here because import WOPI of Collabora controller without adding it to
        # pyramid make trouble in hapic which try to get view related
        # to controller but failed.
        from tracim_backend.applications.collaborative_document_edition.wopi.controller import (
            WOPIController,
        )

        wopi_controller = WOPIController()
        configurator.include(wopi_controller.bind, route_prefix=BASE_API_V2)
        collaborative_document_edition_controller = CollaborativeDocumentEditionFactory().get_controller(
            app_config
        )
        configurator.include(
            collaborative_document_edition_controller.bind, route_prefix=BASE_API_V2
        )
    return configurator
