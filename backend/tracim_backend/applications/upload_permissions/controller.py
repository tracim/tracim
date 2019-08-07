from http import HTTPStatus

from pyramid.config import Configurator

from tracim_backend import TracimRequest
from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.workspace_controller import SWAGGER_TAG__WORKSPACE_ENDPOINTS

SWAGGER_TAG__UPLOAD_PERMISSION_SECTION = "Upload Permission"
SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__WORKSPACE_ENDPOINTS, SWAGGER_TAG__UPLOAD_PERMISSION_SECTION
)


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str
) -> Configurator:
    share_controller = UploadPermissionController()
    configurator.include(share_controller.bind, route_prefix=route_prefix)
    return configurator


class UploadPermissionController(Controller):
    """
    Endpoints for Share Content
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    def add_upload_permission(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Allow to add permission for upload to external person
        """
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    def get_upload_permission(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Get all upload permission of this workspace
        """
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def disable_upload_permission(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        remove a file share
        """
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    def guest_upload_info(self, context, request: TracimRequest, hapic_data=None) -> None:
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    def guest_upload_file(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        upload a file as guest
        """
        return

    def bind(self, configurator: Configurator) -> None:
        # allow external person to upload file
        configurator.add_route(
            "add_upload_permission",
            "/workspaces/{workspace_id}/upload_permissions",
            request_method="PUT",
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
            "guest_upload_info", "/public/guest-upload/{share_token}", request_method="GET"
        )
        configurator.add_view(self.guest_upload_info, route_name="guest_upload_info")

        configurator.add_route(
            "guest_upload_file", "/public/guest-upload/{share_token}", request_method="POST"
        )
        configurator.add_view(self.guest_upload_file, route_name="guest_upload_file")
