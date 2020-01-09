import os

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.applications.share.controller import ShareController
from tracim_backend.config import CFG
from tracim_backend.exceptions import ConfigurationError
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.translation import translator_marker as _


class ShareApp(TracimApplication):
    def load_config(self, app_config: CFG) -> None:
        # share content email
        app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__TEMPLATE__HTML = app_config.get_raw_config(
            "email.notification.share_content_to_receiver.template.html"
        )
        app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__SUBJECT = app_config.get_raw_config(
            "email.notification.share_content_to_receiver.subject",
            _('[{website_title}] {emitter_name} shared the file "{content_filename}" with you'),
        )
        app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__TEMPLATE__HTML = app_config.get_raw_config(
            "email.notification.share_content_to_emitter.template.html"
        )
        app_config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__SUBJECT = app_config.get_raw_config(
            "email.notification.share_content_to_emitter.subject",
            _('[{website_title}] You shared "{content_filename}" with {nb_receivers} people'),
        )

    def check_config(self, app_config: CFG) -> None:
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

    def import_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        share_controller = ShareController()
        configurator.include(share_controller.bind, route_prefix=route_prefix)


application = ShareApp(
    label="Share Content",
    slug="share_content",
    fa_icon="share",
    is_active=True,
    config={},
    main_route="",
)
