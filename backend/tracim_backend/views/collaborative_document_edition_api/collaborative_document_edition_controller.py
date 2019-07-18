from pyramid.config import Configurator

from tracim_backend import TracimRequest
from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.collabora.collabora import CollaboraApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.views.collaborative_document_edition_api.collaborative_document_edition_schema import (
    CollaboraDiscoverySchema,
)
from tracim_backend.views.collaborative_document_edition_api.collaborative_document_edition_schema import (
    CollaborativeDocumentEditionToken,
)
from tracim_backend.views.controllers import Controller

SWAGGER_TAG__CONTENT_COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS = "Collaborative Document Edition"
COLLABORATIVE_DOCUMENT_EDITION_BASE = "collaborative-document-edition"


class CollaborativeDocumentEditionController(Controller):
    """
    Endpoints for Collabora API
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(CollaborativeDocumentEditionToken())
    def collaborative_document_edition_token(
        self, context, request: TracimRequest, hapic_data=None
    ):
        app_config = request.registry.settings["CFG"]  # type: CFG
        collabora_api = CollaboraApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        access_token = request.current_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY)
        return collabora_api.get_token(access_token=access_token)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS])
    @hapic.output_body(CollaboraDiscoverySchema(many=True))
    def discovery(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type: CFG
        collabora_api = CollaboraApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        return collabora_api.discover()

    def bind(self, configurator: Configurator):
        # Discovery
        configurator.add_route(
            "collaborative_document_edition_discovery",
            "/{}/discovery".format(COLLABORATIVE_DOCUMENT_EDITION_BASE),
            request_method="GET",
        )
        configurator.add_view(self.discovery, route_name="collaborative_document_edition_discovery")

        # Edit file
        configurator.add_route(
            "collaborative_document_edition_token",
            "/{}/token".format(COLLABORATIVE_DOCUMENT_EDITION_BASE),
            request_method="GET",
        )
        configurator.add_view(
            self.collaborative_document_edition_token,
            route_name="collaborative_document_edition_token",
        )
