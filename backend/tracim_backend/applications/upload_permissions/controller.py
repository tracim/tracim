from http import HTTPStatus
import typing

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend import TracimRequest
from tracim_backend.applications.upload_permissions.authorization import has_public_upload_enabled
from tracim_backend.applications.upload_permissions.lib import UploadPermissionLib
from tracim_backend.applications.upload_permissions.models import UploadPermission
from tracim_backend.applications.upload_permissions.models_in_context import (
    UploadPermissionInContext,
)
from tracim_backend.applications.upload_permissions.schema import UploadDataFormSchema
from tracim_backend.applications.upload_permissions.schema import UploadFiles
from tracim_backend.applications.upload_permissions.schema import UploadFileSchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionCreationBodySchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionIdPathSchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionListQuerySchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionPasswordBodySchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionPublicInfoSchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionSchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionTokenPath
from tracim_backend.config import CFG
from tracim_backend.exceptions import FileSizeOverOwnerEmptySpace
from tracim_backend.exceptions import FileSizeOverWorkspaceEmptySpace
from tracim_backend.exceptions import NoFileValidationError
from tracim_backend.exceptions import UploadPermissionNotFound
from tracim_backend.exceptions import WorkspacePublicUploadDisabledException
from tracim_backend.exceptions import WrongSharePassword
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_content_manager
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.core_api.workspace_controller import SWAGGER_TAG__WORKSPACE_ENDPOINTS

SWAGGER_TAG__UPLOAD_PERMISSION_SECTION = "Upload Permission"
SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__WORKSPACE_ENDPOINTS, SWAGGER_TAG__UPLOAD_PERMISSION_SECTION
)


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str, context: PyramidContext
) -> Configurator:
    upload_permission_controller = UploadPermissionController()
    configurator.include(upload_permission_controller.bind, route_prefix=route_prefix)
    return configurator


class UploadPermissionController(Controller):
    """
    Endpoints for Upload Permission
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.handle_exception(WorkspacePublicUploadDisabledException, HTTPStatus.BAD_REQUEST)
    @check_right(is_content_manager)
    @check_right(has_public_upload_enabled)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(UploadPermissionCreationBodySchema())
    @hapic.output_body(UploadPermissionSchema(many=True))
    def add_upload_permission(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[UploadPermissionInContext]:
        """
        Allow to add permission for upload to external person
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = UploadPermissionLib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        upload_permission = api.add_permission_to_workspace(
            request.current_workspace,
            hapic_data.body.emails,
            hapic_data.body.password,
            do_notify=app_config.EMAIL__NOTIFICATION__ACTIVATED,
        )
        return api.get_upload_permissions_in_context(upload_permission)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.handle_exception(WorkspacePublicUploadDisabledException, HTTPStatus.BAD_REQUEST)
    @check_right(is_content_manager)
    @check_right(has_public_upload_enabled)
    @hapic.input_query(UploadPermissionListQuerySchema())
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(UploadPermissionSchema(many=True))
    def get_upload_permission(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[UploadPermissionInContext]:
        """
        Get all upload permission of this workspace
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = UploadPermissionLib(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_disabled=hapic_data.query.show_disabled,
        )
        upload_permissions = api.get_upload_permissions(request.current_workspace)
        return api.get_upload_permissions_in_context(upload_permissions)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.handle_exception(WorkspacePublicUploadDisabledException, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UploadPermissionNotFound, HTTPStatus.BAD_REQUEST)
    @check_right(is_content_manager)
    @check_right(has_public_upload_enabled)
    @hapic.input_path(UploadPermissionIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def disable_upload_permission(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        remove an upload permission
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = UploadPermissionLib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        api.disable_upload_permission(
            request.current_workspace, hapic_data.path.upload_permission_id
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.handle_exception(WorkspacePublicUploadDisabledException, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UploadPermissionNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(UploadPermissionTokenPath())
    @hapic.output_body(UploadPermissionPublicInfoSchema())
    def guest_upload_info(
        self, context, request: TracimRequest, hapic_data=None
    ) -> UploadPermissionInContext:
        """
        get somes informations about upload permission
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = UploadPermissionLib(current_user=None, session=request.dbsession, config=app_config)
        upload_permission = api.get_upload_permission_by_token(
            upload_permission_token=hapic_data.path.upload_permission_token
        )  # type: UploadPermission
        workspace_api = WorkspaceApi(
            current_user=None, session=request.dbsession, config=app_config
        )
        workspace = workspace_api.get_one(upload_permission.workspace_id)
        workspace_api.check_public_upload_enabled(workspace)
        return api.get_upload_permission_in_context(upload_permission)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.handle_exception(WrongSharePassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(UploadPermissionNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WorkspacePublicUploadDisabledException, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(UploadPermissionTokenPath())
    @hapic.input_body(UploadPermissionPasswordBodySchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def guest_upload_check(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        check upload password and token validity
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = UploadPermissionLib(current_user=None, session=request.dbsession, config=app_config)
        upload_permission = api.get_upload_permission_by_token(
            upload_permission_token=hapic_data.path.upload_permission_token
        )  # type: UploadPermission
        # TODO - G.M - 2019-08-01 - verify in access to upload_permission can be granted
        # we should considered do these check at decorator level
        workspace_api = WorkspaceApi(
            current_user=None, session=request.dbsession, config=app_config
        )
        workspace = workspace_api.get_one(upload_permission.workspace_id)
        workspace_api.check_public_upload_enabled(workspace)
        api.check_password(upload_permission, password=hapic_data.body.password)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.handle_exception(WrongSharePassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(UploadPermissionNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(NoFileValidationError, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WorkspacePublicUploadDisabledException, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(FileSizeOverWorkspaceEmptySpace, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(FileSizeOverOwnerEmptySpace, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(UploadPermissionTokenPath())
    @hapic.input_forms(UploadDataFormSchema())
    @hapic.input_files(UploadFileSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def guest_upload_file(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        upload files as guest
        """
        # TODO - G.M - 2019-08-14 - replace UploadFiles Object hack to proper hapic support
        # see
        upload_files = UploadFiles(request, prefix_pattern="file_")
        # INFO - G.M - 2019-09-03 - check validation of file here, because hapic can't
        # handle them. verify if almost one file as been given.
        if len(upload_files.files) < 1:
            raise NoFileValidationError("No files given at input, validation failed.")
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = UploadPermissionLib(current_user=None, session=request.dbsession, config=app_config)
        upload_permission = api.get_upload_permission_by_token(
            upload_permission_token=hapic_data.path.upload_permission_token
        )  # type: UploadPermission
        # TODO - G.M - 2019-08-01 - verify in access to upload_permission can be granted
        # we should considered do these check at decorator level
        workspace_api = WorkspaceApi(
            current_user=None, session=request.dbsession, config=app_config
        )
        workspace = workspace_api.get_one(upload_permission.workspace_id)
        workspace_api.check_public_upload_enabled(workspace)
        api.check_password(upload_permission, password=hapic_data.forms.password)
        content_api = ContentApi(current_user=None, session=request.dbsession, config=app_config)
        content_api.check_workspace_size_limitation(
            content_length=request.content_length, workspace=workspace
        )
        content_api.check_owner_size_limitation(
            content_length=request.content_length, workspace=workspace
        )
        api.upload_files(
            upload_permission=upload_permission,
            uploader_username=hapic_data.forms.username,
            message=hapic_data.forms.message,
            files=upload_files.files,
            do_notify=app_config.EMAIL__NOTIFICATION__ACTIVATED,
        )
        return

    def bind(self, configurator: Configurator) -> None:
        # allow external person to upload file
        configurator.add_route(
            "add_upload_permission",
            "/workspaces/{workspace_id}/upload_permissions",
            request_method="POST",
        )
        configurator.add_view(self.add_upload_permission, route_name="add_upload_permission")
        configurator.add_route(
            "get_upload_permissions",
            "/workspaces/{workspace_id}/upload_permissions",
            request_method="GET",
        )
        configurator.add_view(self.get_upload_permission, route_name="get_upload_permissions")
        configurator.add_route(
            "delete_upload_permission",
            "/workspaces/{workspace_id}/upload_permissions/{upload_permission_id}",
            request_method="DELETE",
        )
        configurator.add_view(self.disable_upload_permission, route_name="delete_upload_permission")

        # public upload api
        configurator.add_route(
            "guest_upload_check",
            "/public/guest-upload/{upload_permission_token}/check",
            request_method="POST",
        )
        configurator.add_view(self.guest_upload_check, route_name="guest_upload_check")
        configurator.add_route(
            "guest_upload_file",
            "/public/guest-upload/{upload_permission_token}",
            request_method="POST",
        )
        configurator.add_view(self.guest_upload_file, route_name="guest_upload_file")
        configurator.add_route(
            "guest_upload_info",
            "/public/guest-upload/{upload_permission_token}",
            request_method="GET",
        )
        configurator.add_view(self.guest_upload_info, route_name="guest_upload_info")
