from http import HTTPStatus
import typing

from hapic.data import HapicFile
from pyramid.config import Configurator

from tracim_backend.app_models.contents import FILE_TYPE
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.share.authorization import has_public_download_enabled
from tracim_backend.applications.share.lib import ShareLib
from tracim_backend.applications.share.models import ContentShare
from tracim_backend.applications.share.models_in_context import ContentShareInContext
from tracim_backend.applications.share.schema import ContentShareInfoSchema
from tracim_backend.applications.share.schema import ContentShareSchema
from tracim_backend.applications.share.schema import ShareCreationBodySchema
from tracim_backend.applications.share.schema import ShareIdPathSchema
from tracim_backend.applications.share.schema import ShareListQuerySchema
from tracim_backend.applications.share.schema import SharePasswordBodySchema
from tracim_backend.applications.share.schema import SharePasswordFormSchema
from tracim_backend.applications.share.schema import ShareTokenPathSchema
from tracim_backend.applications.share.schema import ShareTokenWithFilenamePathSchema
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentShareNotFound
from tracim_backend.exceptions import ContentTypeNotAllowed
from tracim_backend.exceptions import TracimFileNotFound
from tracim_backend.exceptions import WorkspacePublicDownloadDisabledException
from tracim_backend.exceptions import WrongSharePassword
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.depot import StorageLib
from tracim_backend.lib.core.workspace import WorkspaceApi
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


class ShareController(Controller):
    """
    Endpoints for Share Content
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @hapic.handle_exception(WorkspacePublicDownloadDisabledException, HTTPStatus.BAD_REQUEST)
    @check_right(is_content_manager)
    @check_right(is_shareable_content_type)
    @check_right(has_public_download_enabled)
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
    @hapic.handle_exception(WorkspacePublicDownloadDisabledException, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @check_right(is_shareable_content_type)
    @check_right(has_public_download_enabled)
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
    @hapic.handle_exception(WorkspacePublicDownloadDisabledException, HTTPStatus.BAD_REQUEST)
    @check_right(is_content_manager)
    @check_right(is_shareable_content_type)
    @check_right(has_public_download_enabled)
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
    @hapic.handle_exception(WorkspacePublicDownloadDisabledException, HTTPStatus.BAD_REQUEST)
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
        content = ContentApi(
            current_user=None, session=request.dbsession, config=app_config
        ).get_one(content_share.content_id, content_type=content_type_list.Any_SLUG)
        workspace_api = WorkspaceApi(
            current_user=None, session=request.dbsession, config=app_config
        )
        workspace = workspace_api.get_one(content.workspace_id)
        workspace_api.check_public_download_enabled(workspace)
        if content.type not in shareables_content_type:
            raise ContentTypeNotAllowed()
        return api.get_content_share_in_context(content_share)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @hapic.handle_exception(WorkspacePublicDownloadDisabledException, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentShareNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WrongSharePassword, HTTPStatus.FORBIDDEN)
    @hapic.input_path(ShareTokenPathSchema())
    @hapic.input_body(SharePasswordBodySchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def guest_download_check(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Check if share token is correct and password given valid
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ShareLib(current_user=None, session=request.dbsession, config=app_config)
        content_share = api.get_content_share_by_token(
            share_token=hapic_data.path.share_token
        )  # type: ContentShare

        # TODO - G.M - 2019-08-01 - verify in access to content share can be granted
        # we should considered do these check at decorator level
        api.check_password(content_share, password=hapic_data.body.password)
        content = ContentApi(
            current_user=None, session=request.dbsession, config=app_config
        ).get_one(content_share.content_id, content_type=content_type_list.Any_SLUG)
        workspace_api = WorkspaceApi(
            current_user=None, session=request.dbsession, config=app_config
        )
        workspace = workspace_api.get_one(content.workspace_id)
        workspace_api.check_public_download_enabled(workspace)
        if content.type not in shareables_content_type:
            raise ContentTypeNotAllowed()

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @hapic.handle_exception(WorkspacePublicDownloadDisabledException, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentShareNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WrongSharePassword, HTTPStatus.FORBIDDEN)
    @hapic.input_path(ShareTokenWithFilenamePathSchema())
    @hapic.output_file([])
    def guest_download_file_get(
        self, context, request: TracimRequest, hapic_data=None
    ) -> HapicFile:
        """
        get file content
        """
        return self.guest_download_file(context, request, hapic_data)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_FILE_ENDPOINTS])
    @hapic.handle_exception(WorkspacePublicDownloadDisabledException, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentShareNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WrongSharePassword, HTTPStatus.FORBIDDEN)
    @hapic.input_path(ShareTokenWithFilenamePathSchema())
    @hapic.input_forms(SharePasswordFormSchema())
    @hapic.output_file([])
    def guest_download_file_post(
        self, context, request: TracimRequest, hapic_data=None
    ) -> HapicFile:
        """
        get file content with password
        """
        return self.guest_download_file(context, request, hapic_data)

    def guest_download_file(self, context, request: TracimRequest, hapic_data=None) -> HapicFile:
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ShareLib(current_user=None, session=request.dbsession, config=app_config)
        content_share = api.get_content_share_by_token(
            share_token=hapic_data.path.share_token
        )  # type: ContentShare

        # TODO - G.M - 2019-08-01 - verify in access to content share can be granted
        # we should considered do these check at decorator level
        if hapic_data.forms:
            password = hapic_data.forms.password
        else:
            password = None
        api.check_password(content_share, password=password)
        content = ContentApi(
            current_user=None, session=request.dbsession, config=app_config
        ).get_one(content_share.content_id, content_type=content_type_list.Any_SLUG)
        workspace_api = WorkspaceApi(
            current_user=None, session=request.dbsession, config=app_config
        )
        workspace = workspace_api.get_one(content.workspace_id)
        workspace_api.check_public_download_enabled(workspace)
        if content.type not in shareables_content_type:
            raise ContentTypeNotAllowed()

        try:
            return StorageLib(request.app_config).get_raw_file(
                depot_file=content.depot_file,
                filename=hapic_data.path.filename,
                default_filename=content.file_name,
                force_download=True,
                last_modified=content.updated,
            )
        except IOError as exc:
            raise TracimFileNotFound(
                "file related to revision {} of content {} not found in depot.".format(
                    content.cached_revision_id, content.content_id
                )
            ) from exc

    def bind(self, configurator: Configurator) -> None:
        """
        Add route to configurator.
        """

        # share file endpoint for tracim users
        configurator.add_route(
            "add_content_share",
            "/workspaces/{workspace_id}/contents/{content_id}/shares",
            request_method="POST",
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
            "guest_download_check",
            "/public/guest-download/{share_token}/check",
            request_method="POST",
        )
        configurator.add_view(self.guest_download_check, route_name="guest_download_check")

        configurator.add_route(
            "guest_download_file_get",
            "/public/guest-download/{share_token}/{filename}",
            request_method="GET",
        )
        configurator.add_view(self.guest_download_file_get, route_name="guest_download_file_get")

        configurator.add_route(
            "guest_download_file_post",
            "/public/guest-download/{share_token}/{filename}",
            request_method="POST",
        )
        configurator.add_view(self.guest_download_file_post, route_name="guest_download_file_post")
