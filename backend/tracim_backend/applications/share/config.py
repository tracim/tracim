import os

from tracim_backend import CFG
from tracim_backend.exceptions import ConfigurationError
from tracim_backend.lib.utils.translation import translator_marker as _


def load_config(app_config: CFG) -> CFG:
    # share content email
    app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__TEMPLATE__HTML = app_config.get_raw_config(
        "email.notification.share_content_to_receiver.template.html"
    )
    app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__SUBJECT = app_config.get_raw_config(
        "email.notification.share_content_to_receiver.subject",
        _("[{website_title}] {emitter_name} shared content {content_filename} with you"),
    )
    app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__TEMPLATE__HTML = app_config.get_raw_config(
        "email.notification.share_content_to_emitter.template.html"
    )
    app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__SUBJECT = app_config.get_raw_config(
        "email.notification.share_content_to_emitter.subject",
        _("[{website_title}] you shared {content_filename} to {nb_receivers} users"),
    )
    return app_config


def check_config(app_config: CFG):
    # INFO - G.M - 2019-02-01 - check if template are available,
    # do not allow running with email_notification_activated
    # if templates needed are not available
    if app_config.EMAIL__NOTIFICATION__ACTIVATED:
        templates = {
            "share_content_to_emitter": app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__TEMPLATE__HTML,
            "share_content_to_receiver": app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__TEMPLATE__HTML,
        }
        for template_description, template_path in templates.items():
            if not template_path or not os.path.isfile(template_path):
                raise ConfigurationError(
                    "ERROR: email template for {template_description} "
                    'not found at "{template_path}."'.format(
                        template_description=template_description, template_path=template_path
                    )
                )
