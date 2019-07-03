# coding=utf-8
import requests
import transaction
from defusedxml import ElementTree
from pyramid.config import Configurator
from pyramid.response import Response

from tracim_backend import TracimRequest, hapic
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import check_right, is_reader, is_contributor
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import (
    WOPIDiscoverySchema,
    WOPITokenQuerySchema,
    WOPICheckFileInfoSchema,
    WorkspaceAndContentIdPathSchema,
    WorkspaceIdPathSchema,
    NoContentSchema,
)
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__CONTENT_WOPI_SECTION = "WOPI"
SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_WOPI_SECTION
)


class WOPIController(Controller):
    """
    Endpoints for WOPI API
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WOPIDiscoverySchema())
    def discovery(self, context, request: TracimRequest, hapic_data=None):
        response = requests.get("https://localhost:9980/hosting/discovery", verify=False)
        root = ElementTree.fromstring(response.text)
        actions = {}
        for xml_actions in root.findall("net-zone/app/action"):
            actions[xml_actions.get("ext")] = xml_actions.get("urlsrc")

        # FIXME - H.D. - 2019/07/02 - create model
        return {"urls": actions}

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
        actual_file = api.get_content_in_context(content)
        return Response(body=actual_file.raw_content)

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
        actual_file = api.get_content_in_context(content)
        author = actual_file.author

        # FIXME - H.D. - 2019/07/02 - create model
        return {
            "BaseFileName": actual_file.filename,
            "Size": len(actual_file.raw_content),
            "OwnerId": author.user_id,
            "UserId": request.current_user.user_id,
            "UserFriendlyName": request.current_user.display_name,
            "UserCanWrite": request.current_workspace.get_user_role(request.current_user)
            >= WorkspaceRoles.CONTRIBUTOR.level,
            "Version": str(content.revision_id),
        }

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
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
            api.update_content(item=content, new_label=content.label, new_content=request.body)
            api.save(content)
            api.execute_update_content_actions(content)

        return

    def bind(self, configurator: Configurator):
        # Discovery
        configurator.add_route(
            "wopi_discovery", "/workspaces/{workspace_id}/wopi/discovery", request_method="GET"
        )
        configurator.add_view(self.discovery, route_name="wopi_discovery")

        # Get content
        configurator.add_route(
            "wopi_get_content",
            "/workspaces/{workspace_id}/wopi/files/{content_id}/contents",
            request_method="GET",
        )
        configurator.add_view(self.get_content, route_name="wopi_get_content")

        # Check file info
        configurator.add_route(
            "wopi_check_file_info",
            "/workspaces/{workspace_id}/wopi/files/{content_id}",
            request_method="GET",
        )
        configurator.add_view(self.check_file_info, route_name="wopi_check_file_info")

        # Put file content
        configurator.add_route(
            "wopi_put_content",
            "/workspaces/{workspace_id}/wopi/files/{content_id}/contents",
            request_method="PUT",
        )
        configurator.add_view(self.put_content, route_name="wopi_put_content")
