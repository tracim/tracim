from datetime import datetime
from http import HTTPStatus
import typing

from pyramid.config import Configurator
import transaction

from tracim_backend import TracimRequest
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.upload_permissions.lib import UploadPermissionLib
from tracim_backend.applications.upload_permissions.models import UploadPermission
from tracim_backend.applications.upload_permissions.models_in_context import (
    UploadPermissionInContext,
)
from tracim_backend.applications.upload_permissions.schema import UploadDataFormSchema
from tracim_backend.applications.upload_permissions.schema import UploadFilesSchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionCreationBodySchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionIdPathSchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionListQuerySchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionSchema
from tracim_backend.applications.upload_permissions.schema import UploadPermissionTokenPath
from tracim_backend.config import CFG
from tracim_backend.exceptions import UploadPermissionNotFound
from tracim_backend.exceptions import WrongSharePassword
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_content_manager
from tracim_backend.lib.utils.translation import translator_marker as _
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.core_api.workspace_controller import SWAGGER_TAG__WORKSPACE_ENDPOINTS

SWAGGER_TAG__UPLOAD_PERMISSION_SECTION = "Upload Permission"
SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__WORKSPACE_ENDPOINTS, SWAGGER_TAG__UPLOAD_PERMISSION_SECTION
)


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str
) -> Configurator:
    upload_permission_controller = UploadPermissionController()
    configurator.include(upload_permission_controller.bind, route_prefix=route_prefix)
    return configurator


class UploadPermissionController(Controller):
    """
    Endpoints for Upload Permission
    """

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @check_right(is_content_manager)
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
            request.current_workspace, hapic_data.body.emails, hapic_data.body.password
        )
        return api.get_upload_permissions_in_context(upload_permission)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @check_right(is_content_manager)
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
        upload_permission = api.get_upload_permissions(request.current_workspace)
        return api.get_upload_permissions_in_context(upload_permission)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.handle_exception(UploadPermissionNotFound, HTTPStatus.BAD_REQUEST)
    @check_right(is_content_manager)
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
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_UPLOAD_PERMISSION_ENDPOINTS])
    @hapic.handle_exception(WrongSharePassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(UploadPermissionNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(UploadPermissionTokenPath())
    @hapic.input_forms(UploadDataFormSchema())
    @hapic.input_files(UploadFilesSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def guest_upload_file(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        upload a file as guest
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = UploadPermissionLib(current_user=None, session=request.dbsession, config=app_config)
        upload_permission = api.get_upload_permission_by_token(
            upload_permission_token=hapic_data.path.upload_permission_token
        )  # type: UploadPermission
        # TODO - G.M - 2019-08-01 - verify in access to upload_permission can be granted
        # we should considered do these check at decorator level
        api.check_password(upload_permission, password=hapic_data.forms.password)

        content_api = ContentApi(
            config=app_config, current_user=upload_permission.author, session=request.dbsession
        )

        label_name = _("Files uploaded by {username} on {date}").format(
            username=hapic_data.forms.username, date=datetime.now()
        )
        upload_folder = content_api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=upload_permission.workspace,
            label=label_name,
            do_notify=False,
            do_save=True,
            content_namespace=ContentNamespaces.UPLOAD,
        )
        created_contents = []
        for _file in hapic_data.files.files:
            content = content_api.create(
                filename=_file.filename,
                content_type_slug=content_type_list.File.slug,
                workspace=upload_permission.workspace,
                parent=upload_folder,
                do_notify=False,
                content_namespace=ContentNamespaces.UPLOAD,
            )
            content_api.save(content, ActionDescription.CREATION)
            with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
                content_api.update_file_data(
                    content,
                    new_filename=_file.filename,
                    new_mimetype=_file.type,
                    new_content=_file.file,
                )
            content_api.create_comment(
                parent=content,
                content=_("message from {username}: {message}").format(
                    username=hapic_data.forms.username, message=hapic_data.forms.message
                ),
                do_save=True,
                do_notify=False,
            )
            created_contents.append(content_api.get_content_in_context(content))
            content_api.execute_created_content_actions(content)
        if app_config.EMAIL__NOTIFICATION__ACTIVATED:
            api.notify_uploaded_contents(
                hapic_data.forms.username, upload_permission.workspace, created_contents
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
            "guest_upload_file",
            "/public/guest-upload/{upload_permission_token}",
            request_method="POST",
        )
        configurator.add_view(self.guest_upload_file, route_name="guest_upload_file")
