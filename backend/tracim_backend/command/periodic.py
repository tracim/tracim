# -*- coding: utf-8 -*-
from abc import ABC
import argparse
from datetime import datetime
from datetime import timedelta
from mako.template import Template
from pyramid.scripting import AppEnvironment

from tracim_backend.command import AppContextCommand
from tracim_backend.config import CFG
from tracim_backend.lib.core.event import EventApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.mail_notifier.sender import EmailSender
from tracim_backend.lib.mail_notifier.utils import EST
from tracim_backend.lib.mail_notifier.utils import EmailAddress
from tracim_backend.lib.mail_notifier.utils import EmailNotificationMessage
from tracim_backend.lib.mail_notifier.utils import SmtpConfiguration
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.models.auth import AuthType
from tracim_backend.models.data import EmailNotificationType
from tracim_backend.models.event import EventTypeDatabaseParameters
from tracim_backend.models.event import ReadStatus


class SendMailSummariesCommand(AppContextCommand, ABC):
    @staticmethod
    def _render_template(config: CFG, context: dict, translator: Translator) -> str:
        template = Template(
            filename=config.EMAIL__NOTIFICATION__SUMMARY__TEMPLATE__HTML,
            default_filters=["html_escape"],
            imports=[
                "from mako.filters import html_escape",
                "from lxml.html.diff import htmldiff",
                "import humanize",
            ],
        )
        return template.render(
            _=translator.get_translation,
            config=config,
            lang=translator.default_lang,
            **context,
        )

    @staticmethod
    def _send_mail(
        config: CFG, translator: Translator, user_mail: str, user_lang: str, body: str
    ) -> None:
        _ = translator.get_translation

        smtp_config = SmtpConfiguration(
            config.EMAIL__NOTIFICATION__SMTP__SERVER,
            config.EMAIL__NOTIFICATION__SMTP__PORT,
            config.EMAIL__NOTIFICATION__SMTP__USER,
            config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
            config.EMAIL__NOTIFICATION__SMTP__ENCRYPTION,
            config.EMAIL__NOTIFICATION__SMTP__AUTHENTICATION,
        )
        sender = EmailSender(config, smtp_config, True)
        reply_to_address = config.EMAIL__NOTIFICATION__FROM__EMAIL.replace("{user_id}", "0")

        msg = EmailNotificationMessage(
            subject=_("[{website_title}] Your daily summary").replace(
                EST.WEBSITE_TITLE, config.WEBSITE__TITLE.__str__()
            ),
            from_header=EmailAddress(config.WEBSITE__TITLE, reply_to_address),
            to_header=EmailAddress("", user_mail),
            reply_to=EmailAddress(config.WEBSITE__TITLE, reply_to_address),
            lang=user_lang,
            body_html=body,
        )
        sender.send_mail(msg)
        sender.disconnect()
        print("Email sent")

    def get_description(self) -> str:
        return """Send a notification summary to every users"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)

        parser.add_argument(
            "--since",
            help="how much the summary should going back in time (in hour)",
            dest="since",
            required=False,
            default=24,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        session = app_context["request"].dbsession
        config: CFG = app_context["registry"].settings["CFG"]

        mail_sent = 0
        mail_not_sent = 0

        if not config.EMAIL__NOTIFICATION__ACTIVATED:
            print("Email notification are disabled")
            return

        created_after = datetime.utcnow() - timedelta(hours=int(parsed_args.since))

        event_api = EventApi(current_user=None, session=session, config=config)
        user_api = UserApi(current_user=None, session=session, config=config)

        for user in user_api.get_all():
            if (
                not user.email
                or not user.is_active
                or user.is_deleted
                or user.auth_type == AuthType.UNKNOWN
            ):
                continue

            mentions = event_api.get_messages_for_user(
                user.user_id,
                created_after=created_after,
                event_type=EventTypeDatabaseParameters.from_event_type("mention.created"),
                read_status=ReadStatus.UNREAD,
                email_notification_type=EmailNotificationType.SUMMARY,
            )
            notification_summary = event_api.get_unread_messages_summary(
                user.user_id,
                created_after=created_after,
            )

            if len(mentions) == 0 and len(notification_summary) == 0:
                continue

            try:
                context = {
                    "user": user,
                    "mentions": mentions,
                    "notification_summary": notification_summary,
                }
                translator = Translator(
                    app_config=config,
                    default_lang=user.lang,
                    fallback_lang=config.DEFAULT_LANG,
                )
                body = SendMailSummariesCommand._render_template(config, context, translator)
                SendMailSummariesCommand._send_mail(
                    config=config,
                    translator=translator,
                    user_mail=user.email,
                    user_lang=user.lang,
                    body=body,
                )
                mail_sent += 1
            except Exception:
                mail_not_sent += 1
                raise

        print(f"Sent {mail_sent} mails")
        print(f"Error on {mail_not_sent} mails")
