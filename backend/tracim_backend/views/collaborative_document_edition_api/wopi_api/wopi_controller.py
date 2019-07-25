# coding=utf-8
from http import HTTPStatus

from depot.manager import DepotManager
from hapic.data import HapicFile
from pyramid.config import Configurator
from pyramid.response import Response
import transaction

from tracim_backend import CFG
from tracim_backend import TracimRequest
from tracim_backend import hapic
from tracim_backend.exceptions import TracimFileNotFound
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_current_content_contributor
from tracim_backend.lib.utils.authorization import is_current_content_reader
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.lib.wopi.wopi import WopiApi
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.collaborative_document_edition_api.collaborative_document_edition_controller import (
    COLLABORATIVE_DOCUMENT_EDITION_BASE,
)
from tracim_backend.views.collaborative_document_edition_api.collaborative_document_edition_controller import (
    SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS,
)
from tracim_backend.views.collaborative_document_edition_api.wopi_api.wopi_schema import (
    WOPICheckFileInfoSchema,
)
from tracim_backend.views.collaborative_document_edition_api.wopi_api.wopi_schema import (
    WopiPutHeadersSchema,
)
from tracim_backend.views.collaborative_document_edition_api.wopi_api.wopi_schema import (
    WopiPutResponse,
)
from tracim_backend.views.collaborative_document_edition_api.wopi_api.wopi_schema import (
    WOPITokenQuerySchema,
)
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentIdPathSchema

SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_WOPI_SECTION = "WOPI"
SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_WOPI_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_ENDPOINTS,
    SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_WOPI_SECTION,
)
WOPI_BASE = COLLABORATIVE_DOCUMENT_EDITION_BASE + "/wopi"
WOPI_FILES = WOPI_BASE + "/files/{content_id}"


class WOPIController(Controller):
    """
    Endpoints for WOPI API
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_WOPI_ENDPOINTS])
    @check_right(is_current_content_reader)
    @hapic.input_path(ContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    @hapic.output_file([])
    def get_content(self, context, request: TracimRequest, hapic_data=None):
        """
        WOPI GetFile endpoint :
        https://wopi.readthedocs.io/projects/wopirest/en/latest/files/GetFile.html#getfile
        """
        try:
            file_ = DepotManager.get().get(request.current_content.depot_file)
        except IOError as exc:
            raise TracimFileNotFound(
                "file related to revision {} of content {} not found in depot.".format(
                    request.current_content.revision_id, request.current_content.content_id
                )
            ) from exc
        return HapicFile(
            file_object=file_,
            mimetype=file_.content_type,
            filename=request.current_content.file_name,
            as_attachment=True,
            content_length=file_.content_length,
            last_modified=request.current_content.updated,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_WOPI_ENDPOINTS])
    @check_right(is_current_content_reader)
    @hapic.input_path(ContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    @hapic.output_body(WOPICheckFileInfoSchema())
    def check_file_info(self, context, request: TracimRequest, hapic_data=None):
        """
        WOPI CheckFileInfo endpoint
        https://wopi.readthedocs.io/projects/wopirest/en/latest/files/CheckFileInfo.html#checkfileinfo
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        return WopiApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        ).check_file_info(request.current_content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__COLLABORATIVE_DOCUMENT_EDITION_WOPI_ENDPOINTS])
    @check_right(is_current_content_contributor)
    @hapic.input_path(ContentIdPathSchema())
    @hapic.input_query(WOPITokenQuerySchema())
    @hapic.input_headers(WopiPutHeadersSchema())
    @hapic.output_body(WopiPutResponse())
    def put_content(self, context, request: TracimRequest, hapic_data=None):
        """
        WOPI PutRelativeFile endpoint
        https://wopi.readthedocs.io/projects/wopirest/en/latest/files/PutRelativeFile.html#putrelativefile
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        with new_revision(
            session=request.dbsession, tm=transaction.manager, content=request.current_content
        ):
            api.update_file_data(
                item=request.current_content,
                new_mimetype=request.current_content.type,
                new_filename=request.current_content.file_name,
                new_content=request.body,
            )
            api.save(request.current_content)
            api.execute_update_content_actions(request.current_content)

        return WopiApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        ).last_modified_time(request.current_content)

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
