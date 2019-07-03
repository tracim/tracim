# coding=utf-8
import urllib.parse

import requests
import transaction
from defusedxml import ElementTree
from pyramid.config import Configurator
from pyramid.response import Response
from depot.manager import DepotManager

from tracim_backend import TracimRequest, hapic, BASE_API_V2
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.lib.core.content import ContentApi
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
# FIXME - H.D. - 2019/07/03 - put in global tracim config
COLLABORA_URL = "http://localhost:9980"
WOPI_BASE = "workspaces/{workspace_id}/wopi/files/{content_id}"


class WOPIController(Controller):
    """
    Endpoints for WOPI API
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(WOPIDiscoverySchema())
    def discovery(self, context, request: TracimRequest, hapic_data=None):
        response = requests.get(COLLABORA_URL + "/hosting/discovery")
        root = ElementTree.fromstring(response.text)
        actions = {}
        for xml_actions in root.findall("net-zone/app/action"):
            actions[xml_actions.get("ext")] = xml_actions.get("urlsrc")

        url_src = actions["odt"] + urllib.parse.urlencode(
            {
                "WOPISrc": "http://{host}{api_base}{path}".format(
                    host=request.host,
                    api_base=BASE_API_V2,
                    path=WOPI_BASE.format(
                        workspace_id=hapic_data.path.workspace_id,
                        content_id=hapic_data.path.content_id,
                    ),
                )
            }
        )

        # FIXME - H.D. - 2019/07/02 - create model
        return {
            "extensions": list(actions.keys()),
            "urlsrc": url_src,
            "access_token": request.cookies.get("session_key"),
        }

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
        file = DepotManager.get().get(content.depot_file)
        return Response(body=file.read())

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
        file = DepotManager.get().get(content.depot_file)
        author = content.owner

        # FIXME - H.D. - 2019/07/02 - create model
        return {
            "BaseFileName": content.file_name,
            "Size": len(file.read()),
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
    @hapic.output_body(NoContentSchema())
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

        return

    def bind(self, configurator: Configurator):
        # Discovery
        configurator.add_route(
            "wopi_discovery",
            "/{wopi_base}/discovery".format(wopi_base=WOPI_BASE),
            request_method="GET",
        )
        configurator.add_view(self.discovery, route_name="wopi_discovery")

        # Get content
        configurator.add_route(
            "wopi_get_content",
            "/{wopi_base}/contents".format(wopi_base=WOPI_BASE),
            request_method="GET",
        )
        configurator.add_view(self.get_content, route_name="wopi_get_content")

        # Check file info
        configurator.add_route(
            "wopi_check_file_info", "/{wopi_base}".format(wopi_base=WOPI_BASE), request_method="GET"
        )
        configurator.add_view(self.check_file_info, route_name="wopi_check_file_info")

        # Put file content
        configurator.add_route(
            "wopi_put_content",
            "/{wopi_base}/contents".format(wopi_base=WOPI_BASE),
            request_method="POST",
        )
        configurator.add_view(self.put_content, route_name="wopi_put_content")
