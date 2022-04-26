# -*- coding: utf-8 -*-
import logging
import typing

from mako.template import Template
from sqlalchemy.orm import Session

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import EmailTemplateError
from tracim_backend.lib.core.notifications import INotifier
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.mail_notifier.sender import EmailSender
from tracim_backend.lib.mail_notifier.sender import send_email_through
from tracim_backend.lib.mail_notifier.utils import EST
from tracim_backend.lib.mail_notifier.utils import EmailAddress
from tracim_backend.lib.mail_notifier.utils import EmailNotificationMessage
from tracim_backend.lib.mail_notifier.utils import SmtpConfiguration
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.lib.utils.utils import get_email_logo_frontend_url
from tracim_backend.lib.utils.utils import get_login_frontend_url
from tracim_backend.lib.utils.utils import get_reset_password_frontend_url
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import WorkspaceInContext
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace


class EmailNotifier(INotifier):
    """
    EmailNotifier, this class will decide how to notify by mail
    in order to let a EmailManager create email
    """

    def __init__(self, config: CFG, session: Session, current_user: User = None):
        """
        :param current_user: the user that has triggered the notification
        :return:
        """
        INotifier.__init__(self, config, session, current_user)
        logger.info(self, "Instantiating Email Notifier")

        self._user = current_user
        self.session = session
        self.config = config
        self._smtp_config = SmtpConfiguration(
            self.config.EMAIL__NOTIFICATION__SMTP__SERVER,
            self.config.EMAIL__NOTIFICATION__SMTP__PORT,
            self.config.EMAIL__NOTIFICATION__SMTP__USER,
            self.config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
            self.config.EMAIL__NOTIFICATION__SMTP__ENCRYPTION,
            self.config.EMAIL__NOTIFICATION__SMTP__AUTHENTICATION,
        )

    def notify_content_update(self, content: Content):

        if content.get_last_action().id not in self.config.EMAIL__NOTIFICATION__NOTIFIED_EVENTS:
            logger.info(
                self,
                "Skip email notification for update of content {}"
                "by user {} (the action is {})".format(
                    content.content_id,
                    # below: 0 means "no user"
                    self._user.user_id if self._user else 0,
                    content.get_last_action().id,
                ),
            )
            return

        logger.info(
            self,
            "About to email-notify update"
            "of content {} by user {}".format(
                content.content_id,
                # Below: 0 means "no user"
                self._user.user_id if self._user else 0,
            ),
        )

        if content.type not in self.config.EMAIL__NOTIFICATION__NOTIFIED_CONTENTS:
            logger.info(
                self,
                "Skip email notification for update of content {}"
                "by user {} (the content type is {})".format(
                    content.type,
                    # below: 0 means "no user"
                    self._user.user_id if self._user else 0,
                    content.get_last_action().id,
                ),
            )
            return

        logger.info(
            self,
            "About to email-notify update"
            "of content {} by user {}".format(
                content.content_id,
                # Below: 0 means "no user"
                self._user.user_id if self._user else 0,
            ),
        )

        ####
        #
        # INFO - D.A. - 2014-11-05 - Emails are sent through asynchronous jobs.
        # For that reason, we do not give SQLAlchemy objects but ids only
        # (SQLA objects are related to a given thread/session)
        #
        try:
            # TODO - D.A - 2014-11-06
            # This feature must be implemented in order to be able to scale to large communities
            if self.config.JOBS__PROCESSING_MODE == self.config.CST.ASYNC:
                logger.warning(self, "Creating mails in SYNC mode as ASYNC is not supported yet.")
            else:
                logger.info(self, "Creating email in SYNC mode")
            EmailManager(self._smtp_config, self.config, self.session).notify_content_update(
                self._user.user_id, content.content_id
            )
        except Exception:
            logger.exception(self, "Exception catched during email notification")


class EmailManager(object):
    """
    Compared to Notifier, this class is independant from the HTTP request thread
    This class will build Email and send it for both created account and content
    update
    """

    def __init__(self, smtp_config: SmtpConfiguration, config: CFG, session: Session) -> None:
        self._smtp_config = smtp_config
        self.config = config
        self.session = session
        # FIXME - G.M - We need to have a session for the emailNotifier

        # if not self.session:
        #     engine = get_engine(settings)
        #     session_factory = get_session_factory(engine)
        #     app_config = CFG(settings)

    def _get_sender(self, user: User = None) -> EmailAddress:
        """
        Return sender EmailAdress object, which permit to get rfc compliant address:
        "Bob Dylan (via Tracim) <notification@mail.com>"
        :param user: user to extract display name
        :return: sender string
        """

        email_template = self.config.EMAIL__NOTIFICATION__FROM__EMAIL
        mail_sender_name = self.config.EMAIL__NOTIFICATION__FROM__DEFAULT_LABEL
        if user:
            mail_sender_name = "{name} via Tracim".format(name=user.display_name)
            email_address = email_template.replace("{user_id}", str(user.user_id))
            # INFO - D.A. - 2017-08-04
            # We use email_template.replace() instead of .format() because this
            # method is more robust to errors in config file.
            #
            # For example, if the email is info+{userid}@tracim.fr
            # email.format(user_id='bob') will raise an exception
            # email.replace('{user_id}', 'bob') will just ignore {userid}
        else:
            email_address = email_template.replace("{user_id}", "0")

        return EmailAddress(label=mail_sender_name, email=email_address)

    # Content Notification

    @staticmethod
    def log_email_notification(
        config: CFG,
        msg: str,
        action: str,
        email_recipient: typing.Optional[str],
        email_subject: typing.Optional[str],
    ) -> None:
        """Log notification metadata."""

        infos = {
            "action": action,
            "recipient": email_recipient,
            "subject": email_subject,
            "network": "email",
        }
        email_notification_logger = logging.getLogger("tracim_email_notification")
        email_notification_logger.info(msg=msg, extra=infos)

    def notify_content_update(self, event_actor_id: int, event_content_id: int) -> None:
        """
        Look for all users to be notified about the new content and send them an
        individual email
        :param event_actor_id: id of the user that has triggered the event
        :param event_content_id: related content_id
        :return:
        """
        # FIXME - D.A. - 2014-11-05
        # Dirty import. It's here in order to avoid circular import
        from tracim_backend.lib.core.content import ContentApi
        from tracim_backend.lib.core.user import UserApi

        user = UserApi(None, config=self.config, session=self.session).get_one(event_actor_id)
        logger.debug(self, "Content: {}".format(event_content_id))
        content_api = ContentApi(current_user=user, session=self.session, config=self.config)
        content = ContentApi(
            session=self.session,
            current_user=user,
            # TODO - G.M - 2019-04-24 - use a system user instead of the user that has triggered the event
            config=self.config,
            show_archived=True,
            show_deleted=True,
        ).get_one(event_content_id, content_type_list.Any_SLUG)
        workspace_api = WorkspaceApi(session=self.session, current_user=user, config=self.config)
        workpace_in_context = workspace_api.get_workspace_with_context(
            workspace_api.get_one(content.workspace_id)
        )
        main_content = content.parent if content.type == content_type_list.Comment.slug else content
        notifiable_roles = WorkspaceApi(
            current_user=user, session=self.session, config=self.config
        ).get_notifiable_roles(content.workspace)

        if len(notifiable_roles) <= 0:
            logger.info(
                self,
                "Skipping notification as nobody subscribed to in workspace {}".format(
                    content.workspace.label
                ),
            )
            return

        logger.info(
            self,
            "Generating content {} notification email for {} user(s)".format(
                content.content_id, len(notifiable_roles)
            ),
        )
        # INFO - D.A. - 2014-11-06
        # The following email sender will send emails in the async task queue
        # This allow to build all mails through current thread but really send them (including SMTP connection)
        # In the other thread.
        #
        # This way, the webserver will return sooner (actually before notification emails are sent
        email_sender = EmailSender(
            self.config, self._smtp_config, self.config.EMAIL__NOTIFICATION__ACTIVATED
        )
        for role in notifiable_roles:
            logger.info(
                self,
                "Generating content {} notification email to {}".format(
                    content.content_id, role.user.email
                ),
            )
            translator = Translator(app_config=self.config, default_lang=role.user.lang)
            _ = translator.get_translation
            # INFO - G.M - 2017-11-15 - set content_id in header to permit reply
            # references can have multiple values, but only one in this case.
            replyto_addr = self.config.EMAIL__NOTIFICATION__REPLY_TO__EMAIL.replace(
                "{content_id}", str(main_content.content_id)
            )

            reference_addr = self.config.EMAIL__NOTIFICATION__REFERENCES__EMAIL.replace(
                "{content_id}", str(main_content.content_id)
            )
            #
            #  INFO - D.A. - 2014-11-06
            # We do not use .format() here because the subject defined in the .ini file
            # may not include all required labels. In order to avoid partial format() (which result in an exception)
            # we do use replace and force the use of .__str__() in order to process LazyString objects
            #
            content_status = translator.get_translation(main_content.get_status().label)
            translated_subject = translator.get_translation(
                self.config.EMAIL__NOTIFICATION__CONTENT_UPDATE__SUBJECT
            )
            subject = translated_subject.replace(
                EST.WEBSITE_TITLE, self.config.WEBSITE__TITLE.__str__()
            )
            subject = subject.replace(EST.WORKSPACE_LABEL, main_content.workspace.label.__str__())
            subject = subject.replace(EST.CONTENT_LABEL, main_content.label.__str__())
            subject = subject.replace(EST.CONTENT_STATUS_LABEL, content_status)
            reply_to_label = _("{username} & all members of {workspace}").format(
                username=user.display_name, workspace=main_content.workspace.label
            )

            content_in_context = content_api.get_content_in_context(content)
            parent_in_context = None
            if content.parent_id:
                parent_in_context = content_api.get_content_in_context(content.parent)

            body_html = self._build_email_body_for_content(
                self.config.EMAIL__NOTIFICATION__CONTENT_UPDATE__TEMPLATE__HTML,
                role,
                content_in_context,
                parent_in_context,
                workpace_in_context,
                user,
                translator,
            )

            message = EmailNotificationMessage(
                subject=subject,
                from_header=self._get_sender(user),
                to_header=EmailAddress(role.user.display_name, role.user.email),
                reply_to=EmailAddress(reply_to_label, replyto_addr),
                # INFO - G.M - 2017-11-15
                # References can theorically have label, but in pratice, references
                # contains only message_id from parents post in thread.
                # To link this email to a content we create a virtual parent
                # in reference who contain the content_id.
                # INFO - G.M - 2020-04-03 - Enforce angle bracket in references header
                # we need that to ensure best software compatibility
                # compat from parsing software
                references=EmailAddress("", reference_addr, force_angle_bracket=True),
                body_html=body_html,
                lang=translator.default_lang,
            )

            self.log_email_notification(
                msg="an email was created to {}".format(message["To"]),
                action="{:8s}".format("CREATED"),
                email_recipient=message["To"],
                email_subject=message["Subject"],
                config=self.config,
            )

            send_email_through(self.config, email_sender.send_mail, message)

    def notify_created_account(
        self, user: User, password: typing.Optional[str], origin_user: typing.Optional[User] = None
    ) -> None:
        """
        Send created account email to given user.

        :param password: chosen password
        :param user: user to notify
        """
        logger.info(self, "Generating created account mail to {}".format(user.email))

        email_sender = EmailSender(
            self.config, self._smtp_config, self.config.EMAIL__NOTIFICATION__ACTIVATED
        )
        translator = Translator(self.config, default_lang=user.lang)
        translated_subject = translator.get_translation(
            self.config.EMAIL__NOTIFICATION__CREATED_ACCOUNT__SUBJECT
        )
        subject = translated_subject.replace(EST.WEBSITE_TITLE, str(self.config.WEBSITE__TITLE))
        from_header = self._get_sender(origin_user)
        to_header = EmailAddress(user.get_display_name(), user.email)
        html_template_file_path = self.config.EMAIL__NOTIFICATION__CREATED_ACCOUNT__TEMPLATE__HTML

        context = {
            "origin_user": origin_user,
            "user": user,
            "password": password,
            "logo_url": get_email_logo_frontend_url(self.config),
            "login_url": get_login_frontend_url(self.config),
        }
        translator = Translator(self.config, default_lang=user.lang)
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

        send_email_through(
            config=self.config, sendmail_callable=email_sender.send_mail, message=message
        )

    def notify_reset_password(self, user: User, reset_password_token: str) -> None:
        """
        Reset password link for user
        :param user: user to notify
        :param reset_password_token: token for resetting password
        """
        logger.debug(self, "user: {}".format(user.user_id))
        logger.info(self, "Generating reset password email to {}".format(user.email))
        translator = Translator(self.config, default_lang=user.lang)
        email_sender = EmailSender(
            self.config, self._smtp_config, self.config.EMAIL__NOTIFICATION__ACTIVATED
        )
        translated_subject = translator.get_translation(
            self.config.EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__SUBJECT
        )
        subject = translated_subject.replace(EST.WEBSITE_TITLE, str(self.config.WEBSITE__TITLE))
        from_header = self._get_sender()
        to_header = EmailAddress(user.get_display_name(), user.email)

        html_template_file_path = (
            self.config.EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__TEMPLATE__HTML
        )
        # TODO - G.M - 2018-08-17 - Generate token
        context = {
            "user": user,
            "logo_url": get_email_logo_frontend_url(self.config),
            "reset_password_url": get_reset_password_frontend_url(
                self.config, token=reset_password_token, email=user.email
            ),
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
        send_email_through(
            config=self.config, sendmail_callable=email_sender.send_mail, message=message
        )

    def _render_template(
        self, mako_template_filepath: str, context: dict, translator: Translator
    ) -> str:
        """
        Render mako template with all needed current variables.

        :param mako_template_filepath: file path of mako template
        :param context: dict with template context
        :return: template rendered string
        """
        try:
            template = Template(
                filename=mako_template_filepath,
                default_filters=["html_escape"],
                imports=[
                    "from mako.filters import html_escape",
                    "from lxml.html.diff import htmldiff",
                    "import humanize",
                ],
            )
            return template.render(
                _=translator.get_translation,
                config=self.config,
                lang=translator.default_lang,
                **context
            )
        except Exception:
            logger.exception(self, "Failed to render email template")
            raise EmailTemplateError("Failed to render email template")

    def _build_context_for_content_update(
        self,
        role: UserRoleInWorkspace,
        content_in_context: ContentInContext,
        parent_in_context: typing.Optional[ContentInContext],
        workspace_in_context: WorkspaceInContext,
        actor: User,
        translator: Translator,
    ):

        _ = translator.get_translation
        content = content_in_context.content
        action = content.get_last_action().id
        previous_revision = content.get_previous_revision()
        new_status = _(content.get_status().label)
        workspace_url = workspace_in_context.frontend_url
        role_label = role.role_as_label()
        logo_url = get_email_logo_frontend_url(self.config)

        # FIXME: remove/readapt assert to debug easily broken case
        # assert user
        # assert workspace
        # assert main_title
        # assert status_label
        # # assert status_icon_url
        # assert role_label
        # # assert content_intro
        # assert content_text or content_text == content.description
        # assert logo_url

        return {
            "user": role.user,
            "actor": actor,
            "action": action,
            "workspace": role.workspace,
            "ActionDescription": ActionDescription,
            "parent_in_context": parent_in_context,
            "content_in_context": content_in_context,
            "workspace_url": workspace_url,
            "previous_revision": previous_revision,
            "new_status": new_status,
            "role_label": role_label,
            "logo_url": logo_url,
        }

    def _build_email_body_for_content(
        self,
        mako_template_filepath: str,
        role: UserRoleInWorkspace,
        content_in_context: ContentInContext,
        parent_in_context: typing.Optional[ContentInContext],
        workspace_in_context: WorkspaceInContext,
        actor: User,
        translator: Translator,
    ) -> str:
        """
        Build an email body and return it as a string
        :param mako_template_filepath: the absolute path to the mako template
        to be used for email body building
        :param role: the role related to user to whom the email must be sent.
        The role is required (and not the user only) in order to show in the
         mail why the user receive the notification
        :param content_in_context: the content item related to the notification
        :param parent_in_context: parent of the content item related to the
        notification
        :param actor: the user at the origin of the action / notification
        (for example the one who wrote a comment
        :return: the built email body as string. In case of multipart email,
         this method must be called one time for text and one time for html
        """
        logger.debug(
            self, "Building email content from MAKO template {}".format(mako_template_filepath)
        )
        context = self._build_context_for_content_update(
            role=role,
            content_in_context=content_in_context,
            parent_in_context=parent_in_context,
            workspace_in_context=workspace_in_context,
            actor=actor,
            translator=translator,
        )
        body_content = self._render_template(
            mako_template_filepath=mako_template_filepath, context=context, translator=translator
        )
        return body_content


def get_email_manager(config: CFG, session: Session):
    """
    :return: EmailManager instance
    """
    #  TODO: Find a way to import properly without cyclic import

    smtp_config = SmtpConfiguration(
        config.EMAIL__NOTIFICATION__SMTP__SERVER,
        config.EMAIL__NOTIFICATION__SMTP__PORT,
        config.EMAIL__NOTIFICATION__SMTP__USER,
        config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
        config.EMAIL__NOTIFICATION__SMTP__ENCRYPTION,
        config.EMAIL__NOTIFICATION__SMTP__AUTHENTICATION,
    )

    return EmailManager(config=config, smtp_config=smtp_config, session=session)
