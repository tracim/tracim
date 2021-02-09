from http import HTTPStatus
import typing

from hapic import HapicData
from pyramid.config import Configurator
from pyramid.traversal import DefaultRootFactory
import transaction

from tracim_backend import ContentNotFound
from tracim_backend import TracimRequest
from tracim_backend import hapic
from tracim_backend.app_models.contents import FILE_TYPE
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.collaborative_document_edition.data import (
    COLLABORATIVE_DOCUMENT_EDITION_BASE,
)
from tracim_backend.applications.collaborative_document_edition.data import (
    SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS,
)
from tracim_backend.applications.collaborative_document_edition.factory import (
    CollaborativeDocumentEditionFactory,
)
from tracim_backend.applications.collaborative_document_edition.models import (
    CollaborativeDocumentEditionToken,
)
from tracim_backend.applications.collaborative_document_edition.models import FileTemplateList
from tracim_backend.applications.collaborative_document_edition.schema import (
    CollaborativeDocumentEditionTokenSchema,
)
from tracim_backend.applications.collaborative_document_edition.schema import (
    FileCreateFromTemplateSchema,
)
from tracim_backend.applications.collaborative_document_edition.schema import FileTemplateInfoSchema
from tracim_backend.applications.content_file.controller import can_create_file
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import FileTemplateNotAvailable
from tracim_backend.exceptions import ParentNotFound
from tracim_backend.exceptions import UnallowedSubContent
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema


class CollaborativeDocumentEditionController(Controller):
    """
    Endpoints for Collaborative Edition API
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(CollaborativeDocumentEditionTokenSchema())
    def collaborative_document_edition_token(
        self, context: DefaultRootFactory, request: TracimRequest, hapic_data: HapicData = None
    ) -> CollaborativeDocumentEditionToken:
        app_config = request.registry.settings["CFG"]  # type: CFG
        collaborative_document_edition_lib = CollaborativeDocumentEditionFactory().get_lib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        access_token = request.current_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY)
        return collaborative_document_edition_lib.get_token(access_token=access_token)

    # File template infor
    @hapic.with_api_doc(tags=[SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS])
    @hapic.output_body(FileTemplateInfoSchema())
    def get_file_template_infos(
        self, context: DefaultRootFactory, request: TracimRequest, hapic_data: HapicData = None
    ) -> FileTemplateList:
        """
        Get file template list
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        collaborative_document_edition_api = CollaborativeDocumentEditionFactory().get_lib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        return collaborative_document_edition_api.get_file_template_list()

    @hapic.with_api_doc(tags=[SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UnallowedSubContent, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ParentNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(FileTemplateNotAvailable, HTTPStatus.BAD_REQUEST)
    @check_right(can_create_file)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(ContentDigestSchema())
    @hapic.input_body(FileCreateFromTemplateSchema())
    def create_file_from_template(
        self, context: DefaultRootFactory, request: TracimRequest, hapic_data: HapicData = None
    ) -> ContentInContext:
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        collaborative_document_edition_api = CollaborativeDocumentEditionFactory().get_lib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        collaborative_document_edition_api.check_template_available(hapic_data.body.template)
        parent = None  # type: typing.Optional['Content']
        if hapic_data.body.parent_id:
            try:
                parent = api.get_one(
                    content_id=hapic_data.body.parent_id, content_type=content_type_list.Any_SLUG
                )
            except ContentNotFound as exc:
                raise ParentNotFound(
                    "Parent with content_id {} not found".format(hapic_data.body.parent_id)
                ) from exc
        content = api.create(
            filename=hapic_data.body.filename,
            content_type_slug=FILE_TYPE,
            workspace=request.current_workspace,
            parent=parent,
        )
        api.save(content, ActionDescription.CREATION)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            collaborative_document_edition_api.update_content_from_template(
                content=content, template_filename=hapic_data.body.template
            )
        return api.get_content_in_context(content)

    def bind(self, configurator: Configurator) -> None:

        # Get file template info
        configurator.add_route(
            "file_template_info",
            "/{}/templates".format(COLLABORATIVE_DOCUMENT_EDITION_BASE),
            request_method="GET",
        )
        configurator.add_view(self.get_file_template_infos, route_name="file_template_info")

        # Create file from template
        configurator.add_route(
            "create_file_from_template",
            "/{}/".format(COLLABORATIVE_DOCUMENT_EDITION_BASE) + "workspaces/{workspace_id}/files",
            request_method="POST",
        )
        configurator.add_view(
            self.create_file_from_template, route_name="create_file_from_template"
        )

        # token
        configurator.add_route(
            "collaborative_document_edition_token",
            "/{}/token".format(COLLABORATIVE_DOCUMENT_EDITION_BASE),
            request_method="GET",
        )
        configurator.add_view(
            self.collaborative_document_edition_token,
            route_name="collaborative_document_edition_token",
        )
