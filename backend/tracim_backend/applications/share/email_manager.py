import email
from email.message import Message
import typing

from tracim_backend.applications.share.models_in_context import ContentShareInContext
from tracim_backend.lib.mail_notifier.notifier import EmailManager
from tracim_backend.lib.mail_notifier.sender import EmailSender
from tracim_backend.lib.mail_notifier.sender import send_email_through
from tracim_backend.lib.mail_notifier.utils import EmailAddress
from tracim_backend.lib.mail_notifier.utils import EmailNotificationMessage
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.lib.utils.utils import EmailUser
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext


class ShareEmailManager(EmailManager):
    def notify__share__content(
        self,
        emitter: User,
        shared_content: ContentInContext,
        content_share_receivers: typing.List[ContentShareInContext],
        share_password: str,
    ) -> None:
        """
        Send mails to notify users for sharing content
        :param emitter: User emitter of the sharing
        :param shared_content: content that is now shared
        :param content_share_receivers: list of content share
        :param share_password: cleartext password of the sharing
        """

        email_sender = EmailSender(
            self.config, self._smtp_config, self.config.EMAIL__NOTIFICATION__ACTIVATED
        )
        share_password_enabled = False
        if share_password:
            share_password_enabled = True
        translator = Translator(self.config, default_lang=emitter.lang)
        message = self._notify_emitter(
            emitter=emitter,
            shared_content=shared_content,
            content_share_receivers=content_share_receivers,
            share_password=share_password,
            translator=translator,
        )
        send_email_through(
            config=self.config, sendmail_callable=email_sender.send_mail, message=message
        )
        for content_share in content_share_receivers:
            emails_receivers_list = [
                share_content.email for share_content in content_share_receivers
            ]
            logger.info(
                self,
                'Generating share mail from user "{}" to "{}"'.format(
                    emitter.user_id, "".join(emails_receivers_list)
                ),
            )
            message = self._notify_receiver(
                emitter=emitter,
                shared_content=shared_content,
                content_share=content_share,
                share_password_enabled=share_password_enabled,
                translator=translator,
            )
            send_email_through(
                config=self.config, sendmail_callable=email_sender.send_mail, message=message
            )

    def _notify_emitter(
        self,
        emitter: User,
        shared_content: ContentInContext,
        content_share_receivers: typing.List[ContentShareInContext],
        share_password: str,
        translator: Translator,
    ) -> Message:
        logger.info(
            self,
            'preparing email to user "{}" about share on content "{}" info created'.format(
                emitter.user_id, shared_content.content_id
            ),
        )
        translated_subject = translator.get_translation(
            self.config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__SUBJECT
        )
        subject = translated_subject.format(
            website_title=self.config.WEBSITE__TITLE,
            content_filename=shared_content.filename,
            nb_receivers=len(content_share_receivers),
        )
        from_header = self._get_sender()
        to_header = EmailAddress(emitter.display_name, emitter.email)
        html_template_file_path = (
            self.config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__TEMPLATE__HTML
        )
        context = {
            "emitter": emitter,
            "shared_content": shared_content,
            "content_share_receivers": content_share_receivers,
            "share_password": share_password,
        }
        body_html = self._render_template(
            mako_template_filepath=html_template_file_path, context=context, translator=translator
        )
        message = EmailNotificationMessage(
            subject=subject,
            from_header=from_header,
            to_header=to_header,
            body_html=body_html,
            lang=translator.default_lang,
        )

        return message

    def _notify_receiver(
        self,
        emitter: User,
        shared_content: ContentInContext,
        content_share: ContentShareInContext,
        share_password_enabled: bool,
        translator: Translator,
    ) -> Message:
        logger.info(
            self,
            'preparing email from user "{}" for the share on content "{}" to "{}"'.format(
                emitter.user_id, shared_content.content_id, content_share.email
            ),
        )
        translated_subject = translator.get_translation(
            self.config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__SUBJECT
        )
        subject = translated_subject.format(
            website_title=self.config.WEBSITE__TITLE,
            content_filename=shared_content.filename,
            emitter_name=emitter.display_name,
        )
        from_header = self._get_sender(emitter)
        to_header = EmailAddress.from_rfc_email_address(content_share.email)
        username, address = email.utils.parseaddr(content_share.email)
        html_template_file_path = (
            self.config.EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__TEMPLATE__HTML
        )
        receiver = EmailUser(user_email=content_share.email)
        context = {
            "emitter": emitter,
            "shared_content": shared_content,
            "content_share": content_share,
            "share_password_enabled": share_password_enabled,
            "receiver": receiver,
        }
        body_html = self._render_template(
            mako_template_filepath=html_template_file_path, context=context, translator=translator
        )

        message = EmailNotificationMessage(
            subject=subject,
            from_header=from_header,
            to_header=to_header,
            body_html=body_html,
            lang=translator.default_lang,
        )
        return message
