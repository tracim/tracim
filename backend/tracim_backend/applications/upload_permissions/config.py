import os

from tracim_backend import CFG
from tracim_backend.exceptions import ConfigurationError
from tracim_backend.lib.utils.translation import translator_marker as _


def load_config(app_config: CFG) -> CFG:
    app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__TEMPLATE__HTML = app_config.get_raw_config(
        "email.notification.upload_permission_to_receiver.template.html"
    )
    app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__SUBJECT = app_config.get_raw_config(
        "email.notification.upload_permission_to_receiver.subject",
        _(
            "[{website_title}] {emitter_name} give you access to upload content into {workspace_name} share space"
        ),
    )
    app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__TEMPLATE__HTML = app_config.get_raw_config(
        "email.notification.upload_permission_to_emitter.template.html"
    )
    app_config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__SUBJECT = app_config.get_raw_config(
        "email.notification.upload_permission_to_emitter.subject",
        _(
            "[{website_title}] you give upload permission on {workspace_name} to {nb_receivers} users"
        ),
    )
    app_config.EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__TEMPLATE__HTML = app_config.get_raw_config(
        "email.notification.new_upload_event.template.html"
    )
    app_config.EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__SUBJECT = app_config.get_raw_config(
        "email.notification.new_upload_event.subject",
        _(
            "[{website_title}] {uploader_username} uploaded {nb_uploaded_contents} contents into {workspace_name} share space"
        ),
    )
    return app_config


def check_config(app_config: CFG) -> CFG:
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
    return app_config
