# coding=utf-8
import os
import typing
import urllib.parse

from defusedxml import ElementTree
from depot.manager import DepotManager
from pyramid.config import Configurator
from pyramid.response import Response
import requests
import transaction

from tracim_backend import BASE_API_V2
from tracim_backend import CFG
from tracim_backend import ContentNotFound
from tracim_backend import TracimRequest
from tracim_backend import hapic
from tracim_backend.app_models.contents import FILE_TYPE
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import ParentNotFound
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import TEMPLATES
from tracim_backend.views.core_api.schemas import WOPICheckFileInfoSchema
from tracim_backend.views.core_api.schemas import WOPICreateFromTemplateSchema
from tracim_backend.views.core_api.schemas import WOPIDiscoverySchema
from tracim_backend.views.core_api.schemas import WOPIEditFileSchema
from tracim_backend.views.core_api.schemas import WOPILastModifiedTime
from tracim_backend.views.core_api.schemas import WOPITokenQuerySchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

SWAGGER_TAG__CONTENT_WOPI_SECTION = "WOPI"
SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_WOPI_SECTION
)
# FIXME - H.D. - 2019/07/03 - put in global tracim config
COLLABORA_URL = "http://localhost:9980"
WOPI_BASE = "workspaces/{workspace_id}/wopi"
WOPI_FILES = WOPI_BASE + "/files/{content_id}"


class WOPIController(Controller):
    """
    Endpoints for WOPI API
    """

    @staticmethod
    def _discover_collabora(request, workspace_id, content_id):
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
                    path=WOPI_FILES.format(workspace_id=workspace_id, content_id=content_id),
                )
            }
        )
        return actions, url_src

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(WOPIEditFileSchema())
    def edit_file(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type: CFG
        actions, url_src = self._discover_collabora(
            request, hapic_data.path.workspace_id, hapic_data.path.content_id
        )

        # FIXME - H.D. - 2019/07/02 - create model
        return {
            "extensions": list(actions.keys()),
            "urlsrc": url_src,
            "access_token": request.current_user.ensure_auth_token(
                app_config.USER__AUTH_TOKEN__VALIDITY
            ),
            "content_id": 1,
            "workspace_id": 1,
        }

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(WOPICreateFromTemplateSchema())
    @hapic.output_body(WOPIEditFileSchema())
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

        actions, url_src = self._discover_collabora(
            request, hapic_data.path.workspace_id, content.content_id
        )

        return {
            "extensions": list(actions.keys()),
            "urlsrc": url_src,
            "access_token": request.current_user.ensure_auth_token(
                app_config.USER__AUTH_TOKEN__VALIDITY
            ),
            "content_id": content.content_id,
            "workspace_id": content.workspace_id,
        }

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WOPIDiscoverySchema())
    def discovery(self, context, request: TracimRequest, hapic_data=None):
        actions, url_src = self._discover_collabora(
            request, hapic_data.path.workspace_id, "{content_id}"
        )

        # FIXME - H.D. - 2019/07/02 - create model
        return {"extensions": list(actions.keys()), "urlsrc": url_src}

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
        # Discovery
        configurator.add_route(
            "wopi_discovery", "/{}/discovery".format(WOPI_BASE), request_method="GET"
        )
        configurator.add_view(self.discovery, route_name="wopi_discovery")

        # Edit file
        configurator.add_route(
            "wopi_edit_file", "/{}/edit".format(WOPI_FILES), request_method="GET"
        )
        configurator.add_view(self.edit_file, route_name="wopi_edit_file")

        # Create file from template
        configurator.add_route(
            "wopi_create_file_from_template",
            "/{}/files/create".format(WOPI_BASE),
            request_method="POST",
        )
        configurator.add_view(
            self.create_from_template, route_name="wopi_create_file_from_template"
        )

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
