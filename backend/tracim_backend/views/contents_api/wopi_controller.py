# coding=utf-8
import requests
from defusedxml import ElementTree
from pyramid.config import Configurator
from pyramid.response import Response

from tracim_backend import TracimRequest, hapic
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import (
    WOPIDiscoverySchema,
    ContentIdPathSchema,
    WOPITokenQuerySchema,
    WOPICheckFileInfoSchema,
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
    @hapic.output_body(WOPIDiscoverySchema())
    def discovery(self, context, request: TracimRequest, hapic_data=None):
        response = requests.get("https://localhost:9980/hosting/discovery", verify=False)
        root = ElementTree.fromstring(response.text)
        actions = {}
        for xml_actions in root.findall("net-zone/app/action"):
            actions[xml_actions.get("ext")] = xml_actions.get("urlsrc")

        # TODO: H.D. 07/01/2019 : create model
        return {"urls": actions}

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @hapic.input_path(ContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    def get_content(self, context, request: TracimRequest, hapic_data=None):
        return Response(body="Hello world")

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_WOPI_ENDPOINTS])
    @hapic.input_path(ContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    @hapic.output_body(WOPICheckFileInfoSchema())
    def check_file_info(self, context, request: TracimRequest, hapic_data=None):
        # TODO: H.D. 07/01/2019 : create model
        return {"BaseFileName": "test.txt", "Size": 11}

    def bind(self, configurator: Configurator):
        # Discovery
        configurator.add_route("wopi_discovery", "/wopi/discovery", request_method="GET")
        configurator.add_view(self.discovery, route_name="wopi_discovery")

        # Get content
        configurator.add_route(
            "wopi_get_content", "/wopi/files/{content_id}/contents", request_method="GET"
        )
        configurator.add_view(self.get_content, route_name="wopi_get_content")

        # Check file info
        configurator.add_route(
            "wopi_check_file_info", "/wopi/files/{content_id}", request_method="GET"
        )
        configurator.add_view(self.check_file_info, route_name="wopi_check_file_info")
