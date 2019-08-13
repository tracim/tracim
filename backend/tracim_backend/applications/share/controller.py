from http import HTTPStatus
import typing

from depot.manager import DepotManager
from hapic.data import HapicFile
from pyramid.config import Configurator

from tracim_backend.app_models.contents import FILE_TYPE
from tracim_backend.applications.share.lib import ShareLib
from tracim_backend.applications.share.models import ContentShare
from tracim_backend.applications.share.models_in_context import ContentShareInContext
from tracim_backend.applications.share.schema import ContentShareInfoSchema
from tracim_backend.applications.share.schema import ContentShareSchema
from tracim_backend.applications.share.schema import ShareCreationBodySchema
from tracim_backend.applications.share.schema import ShareIdPathSchema
from tracim_backend.applications.share.schema import ShareListQuerySchema
from tracim_backend.applications.share.schema import ShareTokenPathSchema
from tracim_backend.applications.share.schema import ShareTokenWithFilenamePathSchema
from tracim_backend.applications.share.schema import TracimSharePasswordHeaderSchema
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentShareNotFound
from tracim_backend.exceptions import ContentTypeNotAllowed
from tracim_backend.exceptions import TracimFileNotFound
from tracim_backend.exceptions import WrongSharePassword
from tracim_backend.extensions import hapic
from tracim_backend.lib.utils.authorization import ContentTypeChecker
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_content_manager
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

SWAGGER_TAG__CONTENT_SHARE_SECTION = "Share"
SWAGGER_TAG__CONTENT_FILE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_SHARE_SECTION
)
shareables_content_type = [FILE_TYPE]
is_shareable_content_type = ContentTypeChecker(shareables_content_type)


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str
) -> Configurator:
    share_controller = ShareController()
    configurator.include(share_controller.bind, route_prefix=route_prefix)
    return configurator


class ShareController(Controller):
    """
    Endpoints for Share Content
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @check_right(is_content_manager)
    @check_right(is_shareable_content_type)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(ShareCreationBodySchema())
    @hapic.output_body(ContentShareSchema(many=True))
    def add_content_share(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[ContentShareInContext]:
        """
        Allow to share this file to external person
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ShareLib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        shares_content = api.share_content(
            request.current_content,
            hapic_data.body.emails,
            hapic_data.body.password,
            do_notify=app_config.EMAIL__NOTIFICATION__ACTIVATED,
        )
        return api.get_content_shares_in_context(shares_content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @check_right(is_contributor)
    @check_right(is_shareable_content_type)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_query(ShareListQuerySchema())
    @hapic.output_body(ContentShareSchema(many=True))
    def get_content_shares(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[ContentShareInContext]:
        """
        Get all share related to a file
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ShareLib(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_disabled=hapic_data.query.show_disabled,
        )
        shares_content = api.get_content_shares(request.current_content)
        return api.get_content_shares_in_context(shares_content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @hapic.handle_exception(ContentShareNotFound, HTTPStatus.BAD_REQUEST)
    @check_right(is_content_manager)
    @check_right(is_shareable_content_type)
    @hapic.input_path(ShareIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def disable_content_share(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        remove a file share
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ShareLib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        api.disable_content_share(request.current_content, hapic_data.path.share_id)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @hapic.handle_exception(ContentShareNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(ShareTokenPathSchema())
    @hapic.output_body(ContentShareInfoSchema())
    def guest_download_info(
        self, context, request: TracimRequest, hapic_data=None
    ) -> ContentShareInContext:
        """
        get content file info
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ShareLib(current_user=None, session=request.dbsession, config=app_config)
        content_share = api.get_content_share_by_token(
            share_token=hapic_data.path.share_token
        )  # type: ContentShare

        # TODO - G.M - 2019-08-01 - verify in access to content share can be granted
        # we should considered do these check at decorator level
        if content_share.content.type not in shareables_content_type:
            raise ContentTypeNotAllowed()

        return api.get_content_share_in_context(content_share)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @hapic.handle_exception(ContentShareNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WrongSharePassword, HTTPStatus.FORBIDDEN)
    @hapic.input_path(ShareTokenWithFilenamePathSchema())
    @hapic.input_headers(TracimSharePasswordHeaderSchema())
    @hapic.output_file([])
    def guest_download_file(self, context, request: TracimRequest, hapic_data=None) -> HapicFile:
        """
        get file content
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ShareLib(current_user=None, session=request.dbsession, config=app_config)
        content_share = api.get_content_share_by_token(
            share_token=hapic_data.path.share_token
        )  # type: ContentShare

        # TODO - G.M - 2019-08-01 - verify in access to content share can be granted
        # we should considered do these check at decorator level
        api.check_password(content_share, password=hapic_data.headers.tracim_share_password)
        if content_share.content.type not in shareables_content_type:
            raise ContentTypeNotAllowed()

        try:
            file = DepotManager.get().get(content_share.content.depot_file)
        except IOError as exc:
            raise TracimFileNotFound(
                "file related to revision {} of content {} not found in depot.".format(
                    content_share.content.revision_id, content_share.content.content_id
                )
            ) from exc
        filename = hapic_data.path.filename

        # INFO - G.M - 2019-08-08 - use given filename in all case but none or
        # "raw", when filename returned will be original file one.
        if not filename or filename == "raw":
            filename = content_share.content.file_name
        return HapicFile(
            file_object=file,
            mimetype=file.content_type,
            filename=filename,
            as_attachment=True,
            content_length=file.content_length,
            last_modified=content_share.content.updated,
        )

    def bind(self, configurator: Configurator) -> None:
        """
        Add route to configurator.
        """

        # share file endpoint for tracim users
        configurator.add_route(
            "add_content_share",
            "/workspaces/{workspace_id}/contents/{content_id}/shares",
            request_method="PUT",
        )
        configurator.add_view(self.add_content_share, route_name="add_content_share")
        configurator.add_route(
            "get_content_shares",
            "/workspaces/{workspace_id}/contents/{content_id}/shares",
            request_method="GET",
        )
        configurator.add_view(self.get_content_shares, route_name="get_content_shares")
        configurator.add_route(
            "delete_content_share",
            "/workspaces/{workspace_id}/contents/{content_id}/shares/{share_id}",
            request_method="DELETE",
        )
        configurator.add_view(self.disable_content_share, route_name="delete_content_share")

        # public download api
        configurator.add_route(
            "guest_download_info", "/public/guest-download/{share_token}", request_method="GET"
        )
        configurator.add_view(self.guest_download_info, route_name="guest_download_info")

        configurator.add_route(
            "guest_download_file",
            "/public/guest-download/{share_token}/{filename}",
            request_method="GET",
        )
        configurator.add_view(self.guest_download_file, route_name="guest_download_file")
