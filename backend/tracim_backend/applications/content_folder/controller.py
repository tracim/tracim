# coding=utf-8
import typing

from pyramid.config import Configurator
import transaction

from tracim_backend.app_models.contents import FOLDER_TYPE
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import ContentTypeChecker
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import RevisionInContext
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import FolderContentModifySchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import SetContentStatusSchema
from tracim_backend.views.core_api.schemas import TextBasedContentSchema
from tracim_backend.views.core_api.schemas import TextBasedRevisionSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__CONTENT_FOLDER_SECTION = "Folders"
SWAGGER_TAG__CONTENT_FOLDER_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_FOLDER_SECTION
)
is_folder_content = ContentTypeChecker([FOLDER_TYPE])


class FolderController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FOLDER_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_folder_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(TextBasedContentSchema())
    def get_folder(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:
        """
        Get folder info
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=content_type_list.Any_SLUG)
        return api.get_content_in_context(content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FOLDER_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @check_right(is_folder_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(FolderContentModifySchema())
    @hapic.output_body(TextBasedContentSchema())
    def update_folder(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:
        """
        update folder
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=content_type_list.Any_SLUG)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.update_container_content(
                item=content,
                new_label=hapic_data.body.label,
                new_description=hapic_data.body.raw_content,
                allowed_content_type_slug_list=hapic_data.body.sub_content_types,
            )
            api.save(content)
            api.execute_update_content_actions(content)
        return api.get_content_in_context(content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FOLDER_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_folder_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(TextBasedRevisionSchema(many=True))
    def get_folder_revisions(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[RevisionInContext]:
        """
        get folder revisions
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=content_type_list.Any_SLUG)
        revisions = content.revisions
        return [api.get_revision_in_context(revision) for revision in revisions]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FOLDER_ENDPOINTS])
    @check_right(is_contributor)
    @check_right(is_folder_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetContentStatusSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_folder_status(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        set folder status
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=content_type_list.Any_SLUG)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.set_status(content, hapic_data.body.status)
            api.save(content)
            api.execute_update_content_actions(content)
        return

    def bind(self, configurator: Configurator) -> None:
        # Get folder
        configurator.add_route(
            "folder", "/workspaces/{workspace_id}/folders/{content_id}", request_method="GET"
        )
        configurator.add_view(self.get_folder, route_name="folder")

        # update folder
        configurator.add_route(
            "update_folder", "/workspaces/{workspace_id}/folders/{content_id}", request_method="PUT"
        )
        configurator.add_view(self.update_folder, route_name="update_folder")

        # get folder revisions
        configurator.add_route(
            "folder_revisions",
            "/workspaces/{workspace_id}/folders/{content_id}/revisions",
            request_method="GET",
        )
        configurator.add_view(self.get_folder_revisions, route_name="folder_revisions")

        # get folder revisions
        configurator.add_route(
            "set_folder_status",
            "/workspaces/{workspace_id}/folders/{content_id}/status",
            request_method="PUT",
        )
        configurator.add_view(self.set_folder_status, route_name="set_folder_status")
