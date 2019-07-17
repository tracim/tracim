from pyramid.config import Configurator

from tracim_backend import TracimRequest
from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.collabora.collabora import CollaboraApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.collabora_api.collabora_schema import CollaboraDiscoverySchema
from tracim_backend.views.collabora_api.collabora_schema import CollaboraEditFileSchema
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

SWAGGER_TAG__CONTENT_COLLABORA_SECTION = "Collabora"
SWAGGER_TAG__CONTENT_COLLABORA_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_COLLABORA_SECTION
)
COLLABORA_BASE = "collabora"
COLLABORA_FILE = "workspaces/{workspace_id}/files/{content_id}"


class CollaboraController(Controller):
    """
    Endpoints for Collabora API
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_COLLABORA_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(CollaboraEditFileSchema())
    def edit_file_info(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type: CFG
        collabora_api = CollaboraApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        access_token = request.current_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY)
        return collabora_api.edit_file_info(
            access_token=access_token,
            content=request.current_content,
            workspace=request.current_workspace,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_COLLABORA_ENDPOINTS])
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
            "collabora_discovery", "/{}/discovery".format(COLLABORA_BASE), request_method="GET"
        )
        configurator.add_view(self.discovery, route_name="collabora_discovery")

        # Edit file
        configurator.add_route(
            "collabora_edit_file_info",
            "/{}/collabora_edit_info".format(COLLABORA_FILE),
            request_method="GET",
        )
        configurator.add_view(self.edit_file_info, route_name="collabora_edit_file_info")
