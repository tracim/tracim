# coding=utf-8

from depot.manager import DepotManager
from pyramid.config import Configurator
from pyramid.response import Response
import transaction

from tracim_backend import CFG
from tracim_backend import TracimRequest
from tracim_backend import hapic
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import WOPICheckFileInfoSchema
from tracim_backend.views.core_api.schemas import WOPILastModifiedTime
from tracim_backend.views.core_api.schemas import WOPITokenQuerySchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

SWAGGER_TAG__CONTENT_WOPI_SECTION = "WOPI"
SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_WOPI_SECTION
)
WOPI_BASE = "workspaces/{workspace_id}/wopi"
WOPI_FILES = WOPI_BASE + "/files/{content_id}"


class WOPIController(Controller):
    """
    Endpoints for WOPI API
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    def get_content(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=content_type_list.Any_SLUG)
        file_ = DepotManager.get().get(content.depot_file)
        return Response(body=file_.read())

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    @hapic.output_body(WOPICheckFileInfoSchema())
    def check_file_info(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=content_type_list.Any_SLUG)
        file_ = DepotManager.get().get(content.depot_file)
        author = content.owner

        # FIXME - H.D. - 2019/07/02 - create model
        return {
            "BaseFileName": content.file_name,
            "Size": len(file_.read()),
            "OwnerId": author.user_id,
            "UserId": request.current_user.user_id,
            "UserFriendlyName": request.current_user.display_name,
            "UserCanWrite": request.current_workspace.get_user_role(request.current_user)
            >= WorkspaceRoles.CONTRIBUTOR.level,
            "Version": str(content.revision_id),
            "LastModifiedTime": content.updated,
        }

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    @hapic.output_body(WOPILastModifiedTime())
    def put_content(self, context, request: TracimRequest, hapic_data=None):
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
            api.update_file_data(
                item=content,
                new_mimetype=content.type,
                new_filename=content.file_name,
                new_content=request.body,
            )
            api.save(content)
            api.execute_update_content_actions(content)

        return {"LastModifiedTime": content.updated}

    def bind(self, configurator: Configurator):

        # Get content
        configurator.add_route(
            "wopi_get_content", "/{}/contents".format(WOPI_FILES), request_method="GET"
        )
        configurator.add_view(self.get_content, route_name="wopi_get_content")

        # Check file info
        configurator.add_route(
            "wopi_check_file_info", "/{}".format(WOPI_FILES), request_method="GET"
        )
        configurator.add_view(self.check_file_info, route_name="wopi_check_file_info")

        # Put file content
        configurator.add_route(
            "wopi_put_content", "/{}/contents".format(WOPI_FILES), request_method="POST"
        )
        configurator.add_view(self.put_content, route_name="wopi_put_content")
