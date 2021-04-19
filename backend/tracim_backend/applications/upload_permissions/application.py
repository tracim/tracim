import os

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.exceptions import ConfigurationError
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.translation import translator_marker as _


class UploadPermissionApp(TracimApplication):
    def load_content_types(self) -> None:
        pass

    def load_config(self, app_config: CFG) -> None:
        template_dir = app_config.here_macro_replace("%(here)s/tracim_backend/templates/mail")
        app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__TEMPLATE__HTML = app_config.get_raw_config(
            "email.notification.upload_permission_to_receiver.template.html",
            "{}/{}".format(template_dir, "upload_permission_to_receiver_body_html.mak"),
        )
        app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__SUBJECT = app_config.get_raw_config(
            "email.notification.upload_permission_to_receiver.subject",
            _('{emitter_name} invited you to upload files on "{website_title}"'),
        )
        app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__TEMPLATE__HTML = app_config.get_raw_config(
            "email.notification.upload_permission_to_emitter.template.html",
            "{}/{}".format(template_dir, "upload_permission_to_emitter_body_html.mak"),
        )
        app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__SUBJECT = app_config.get_raw_config(
            "email.notification.upload_permission_to_emitter.subject",
            _(
                '[{website_title}] You invited {nb_receivers} people to upload files on "{workspace_name}"'
            ),
        )
        app_config.EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__TEMPLATE__HTML = app_config.get_raw_config(
            "email.notification.new_upload_event.template.html",
            "{}/{}".format(template_dir, "new_upload_event_body_html.mak"),
        )
        app_config.EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__SUBJECT = app_config.get_raw_config(
            "email.notification.new_upload_event.subject",
            _(
                '[{website_title}] {uploader_username} shared {nb_uploaded_contents} files in "{workspace_name}"'
            ),
        )

    def check_config(self, app_config: CFG) -> None:
        # INFO - G.M - 2019-02-01 - check if template are available,
        # do not allow running with email_notification_activated
        # if templates needed are not available
        if app_config.EMAIL__NOTIFICATION__ACTIVATED:
            templates = {
                "upload_permission_to_emitter": app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__TEMPLATE__HTML,
                "upload_permission_to_receiver": app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__TEMPLATE__HTML,
                "new_upload_event": app_config.EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__TEMPLATE__HTML,
            }
            for template_description, template_path in templates.items():
                if not template_path or not os.path.isfile(template_path):
                    raise ConfigurationError(
                        "ERROR: email template for {template_description} "
                        'not found at "{template_path}".'.format(
                            template_description=template_description, template_path=template_path
                        )
                    )

    def load_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        from tracim_backend.applications.upload_permissions.controller import (
            UploadPermissionController,
        )

        upload_permission_controller = UploadPermissionController()
        configurator.include(upload_permission_controller.bind, route_prefix=route_prefix)


def create_app() -> TracimApplication:
    return UploadPermissionApp(
        label="Upload permission",
        slug="upload_permission",
        fa_icon="fas cloud-upload-alt",
        config={},
        main_route="",
    )
