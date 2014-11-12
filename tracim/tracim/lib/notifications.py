# -*- coding: utf-8 -*-

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


from mako.template import Template

from tg.i18n import lazy_ugettext as l_
from tg.i18n import ugettext as _

from tracim.config.app_cfg import CFG

from tracim.lib.base import logger
from tracim.lib.email import SmtpConfiguration
from tracim.lib.email import EmailSender
from tracim.lib.user import UserApi
from tracim.lib.workspace import WorkspaceApi

from tracim.model.serializers import Context
from tracim.model.serializers import CTX
from tracim.model.serializers import DictLikeClass

from tracim.model.data import Content, UserRoleInWorkspace, ContentType
from tracim.model.auth import User


from tgext.asyncjob import asyncjob_perform

class Notifier(object):

    def __init__(self, current_user: User=None):
        """

        :param current_user: the user that has triggered the notification
        :return:
        """
        cfg = CFG.get_instance()

        self._user = current_user
        self._smtp_config = SmtpConfiguration(cfg.EMAIL_NOTIFICATION_SMTP_SERVER,
                                       cfg.EMAIL_NOTIFICATION_SMTP_PORT,
                                       cfg.EMAIL_NOTIFICATION_SMTP_USER,
                                       cfg.EMAIL_NOTIFICATION_SMTP_PASSWORD)

    def notify_content_update(self, content: Content):
        logger.info(self, 'About to email-notify update of content {} by user {}'.format(content.content_id, self._user.user_id))

        global_config = CFG.get_instance()

        ####
        #
        # INFO - D.A. - 2014-11-05 - Emails are sent through asynchronous jobs. For that reason, we do not
        # give SQLAlchemy objects but ids only (SQLA objects are related to a given thread/session)
        #
        if global_config.EMAIL_NOTIFICATION_PROCESSING_MODE.lower()==global_config.CST.ASYNC.lower():
            logger.info(self, 'Sending email in ASYNC mode')
            # TODO - D.A - 2014-11-06
            # This feature must be implemented in order to be able to scale to large communities
            raise NotImplementedError('Sending emails through ASYNC mode is not working yet')
            asyncjob_perform(EmailNotifier(self._smtp_config, global_config).notify_content_update, self._user.user_id, content.content_id)
        else:
            logger.info(self, 'Sending email in SYNC mode')
            EmailNotifier(self._smtp_config, global_config).notify_content_update(self._user.user_id, content.content_id)

class EST(object):
    """
    EST = Email Subject Tags - this is a convenient class - no business logic here
    This class is intended to agregate all dynamic content that may be included in email subjects
    """

    WEBSITE_TITLE = '{website_title}'
    WORKSPACE_LABEL = '{workspace_label}'
    CONTENT_LABEL = '{content_label}'
    CONTENT_STATUS_LABEL = '{content_status_label}'

    @classmethod
    def all(cls):
        return [
            cls.CONTENT_LABEL,
            cls.CONTENT_STATUS_LABEL,
            cls.WEBSITE_TITLE,
            cls.WORKSPACE_LABEL
        ]

class EmailNotifier(object):

    """
    Compared to Notifier, this class is independant from the HTTP request thread

    TODO: Do this class really independant (but it means to get as parameter the user language
    and other stuff related to the turbogears environment)
    """

    def __init__(self, smtp_config: SmtpConfiguration, global_config: CFG):
        self._smtp_config = smtp_config
        self._global_config = global_config


    def notify_content_update(self, event_actor_id: int, event_content_id: int):
        """
        Look for all users to be notified about the new content and send them an individual email
        :param event_actor_id: id of the user that has triggered the event
        :param event_content_id: related content_id
        :return:
        """
        # FIXME - D.A. - 2014-11-05
        # Dirty import. It's here in order to avoid circular import
        from tracim.lib.content import ContentApi

        user = UserApi(None).get_one(event_actor_id)
        logger.debug(self, 'Content: {}'.format(event_content_id))

        content = ContentApi(user, show_archived=True, show_deleted=True).get_one(event_content_id, ContentType.Any) # TODO - use a system user instead of the user that has triggered the event
        content = content.parent if content.type==ContentType.Comment else content
        notifiable_roles = WorkspaceApi(user).get_notifiable_roles(content.workspace)

        if len(notifiable_roles)<=0:
            logger.info(self, 'Skipping notification as nobody subscribed to in workspace {}'.format(content.workspace.label))
            return

        logger.info(self, 'Sending asynchronous emails to {} user(s)'.format(len(notifiable_roles)))
        # INFO - D.A. - 2014-11-06
        # The following email sender will send emails in the async task queue
        # This allow to build all mails through current thread but really send them (including SMTP connection)
        # In the other thread.
        #
        # This way, the webserver will return sooner (actually before notification emails are sent
        async_email_sender = EmailSender(self._smtp_config, self._global_config.EMAIL_NOTIFICATION_ACTIVATED)

        for role in notifiable_roles:
            logger.info(self, 'Sending email to {}'.format(role.user.email))
            to_addr = '{name} <{email}>'.format(name=role.user.display_name, email=role.user.email)

            #
            #  INFO - D.A. - 2014-11-06
            # We do not use .format() here because the subject defined in the .ini file
            # may not include all required labels. In order to avoid partial format() (which result in an exception)
            # we do use replace and force the use of .__str__() in order to process LazyString objects
            #
            subject = self._global_config.EMAIL_NOTIFICATION_CONTENT_UPDATE_SUBJECT
            subject = subject.replace(EST.WEBSITE_TITLE, self._global_config.WEBSITE_TITLE.__str__())
            subject = subject.replace(EST.WORKSPACE_LABEL, content.workspace.label.__str__())
            subject = subject.replace(EST.CONTENT_LABEL, content.label.__str__() if content.label else content.file_name.__str__())
            subject = subject.replace(EST.CONTENT_STATUS_LABEL, content.get_status().label.__str__())

            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = self._global_config.EMAIL_NOTIFICATION_FROM
            message['To'] = to_addr

            body_text = self._build_email_body(self._global_config.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_TEXT, role, content, user)
            body_html = self._build_email_body(self._global_config.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_HTML, role, content, user)
            part1 = MIMEText(body_text, 'plain', 'utf-8')
            part2 = MIMEText(body_html, 'html', 'utf-8')
            # Attach parts into message container.
            # According to RFC 2046, the last part of a multipart message, in this case
            # the HTML message, is best and preferred.
            message.attach(part1)
            message.attach(part2)

            message_str = message.as_string()
            asyncjob_perform(async_email_sender.send_mail, message)
            # s.send_message(message)

        # Note: The following action allow to close the SMTP connection.
        # This will work only if the async jobs are done in the right order
        asyncjob_perform(async_email_sender.disconnect)


    def _build_email_body(self, mako_template_filepath: str, role: UserRoleInWorkspace, content: Content, actor: User) -> str:
        """
        Build an email body and return it as a string
        :param mako_template_filepath: the absolute path to the mako template to be used for email body building
        :param role: the role related to user to whom the email must be sent. The role is required (and not the user only) in order to show in the mail why the user receive the notification
        :param content: the content item related to the notification
        :param actor: the user at the origin of the action / notification (for example the one who wrote a comment
        :param config: the global configuration
        :return: the built email body as string. In case of multipart email, this method must be called one time for text and one time for html
        """
        logger.debug(self, 'Building email content from MAKO template {}'.format(mako_template_filepath))

        template = Template(filename=mako_template_filepath)
        # TODO - D.A. - 2014-11-06 - move this
        # Import is here for circular import problem
        import tracim.lib.helpers as helpers

        dictified_item = Context(CTX.EMAIL_NOTIFICATION, self._global_config.WEBSITE_BASE_URL).toDict(content)
        dictified_actor = Context(CTX.DEFAULT).toDict(actor)

        body_content = template.render(base_url=self._global_config.WEBSITE_BASE_URL,
                               _=_,
                               h=helpers,
                               user_display_name=role.user.display_name,
                               user_role_label=role.role_as_label(),
                               workspace_label=role.workspace.label,
                               result = DictLikeClass(item=dictified_item, actor=dictified_actor))

        return body_content
