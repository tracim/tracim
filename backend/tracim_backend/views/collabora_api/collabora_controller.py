import os
import typing

from pyramid.config import Configurator
import transaction

from tracim_backend import TracimRequest
from tracim_backend.app_models.contents import FILE_TYPE
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import ParentNotFound
from tracim_backend.extensions import hapic
from tracim_backend.lib.collabora.collabora import CollaboraApi
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import TEMPLATES
from tracim_backend.views.core_api.schemas import CollaboraCreateFromTemplateSchema
from tracim_backend.views.core_api.schemas import CollaboraDiscoverySchema
from tracim_backend.views.core_api.schemas import CollaboraEditFileSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

SWAGGER_TAG__CONTENT_COLLABORA_SECTION = "Collabora"
SWAGGER_TAG__CONTENT_COLLABORA_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_COLLABORA_SECTION
)
COLLABORA_BASE = "collabora"
COLLABORA_FILES = "workspaces/{workspace_id}/files"
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
    @check_right(is_reader)
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(CollaboraCreateFromTemplateSchema())
    @hapic.output_body(CollaboraEditFileSchema())
    def create_from_template(self, context, request: TracimRequest, hapic_data=None):
        template = hapic_data.body.get("template")
        file_name = "{}.{}".format(hapic_data.body.get("title"), template.split(".")[-1])
        parent_id = hapic_data.body.get("parent_id")

        current_file_path = os.path.dirname(os.path.abspath(__file__))
        with open(
            os.path.join(current_file_path, "..", "..", "templates", "open_documents", template),
            "rb",
        ) as f:
            raw_template_content = f.read()

        mimetype = TEMPLATES[template]

        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )

        parent = None  # type: typing.Optional['Content']
        if parent_id:
            try:
                parent = api.get_one(content_id=parent_id, content_type=content_type_list.Any_SLUG)
            except ContentNotFound as exc:
                raise ParentNotFound(
                    "Parent with content_id {} not found".format(parent_id)
                ) from exc
        content = api.create(
            filename=file_name,
            content_type_slug=FILE_TYPE,
            workspace=request.current_workspace,
            parent=parent,
        )
        api.save(content, ActionDescription.CREATION)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.update_file_data(
                content,
                new_filename=file_name,
                new_mimetype=mimetype,
                new_content=raw_template_content,
            )
        api.execute_created_content_actions(content)

        collabora_api = CollaboraApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        access_token = request.current_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY)
        return collabora_api.edit_file_info(
            access_token=access_token, content=content, workspace=request.current_workspace
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

        # Create file from template
        configurator.add_route(
            "collabora_create_file_from_template",
            "/{}/create_with_template".format(COLLABORA_FILES),
            request_method="POST",
        )
        configurator.add_view(
            self.create_from_template, route_name="collabora_create_file_from_template"
        )
