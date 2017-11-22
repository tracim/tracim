# -*- coding: utf-8 -*-
import datetime
import typing

from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from lxml.html.diff import htmldiff

from mako.template import Template

from tracim.lib.base import logger
from tracim.lib.email import EmailSender
from tracim.lib.email import SmtpConfiguration
from tracim.lib.email import send_email_through
from tracim.lib.user import UserApi
from tracim.lib.utils import lazy_ugettext as l_
from tracim.lib.workspace import WorkspaceApi
from tracim.model.auth import User
from tracim.model.data import ActionDescription
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import UserRoleInWorkspace
from tracim.model.serializers import CTX
from tracim.model.serializers import Context
from tracim.model.serializers import DictLikeClass


class INotifier(object):
    """
    Interface for Notifier instances
    """
    def __init__(self, current_user: User=None):
        pass


    def notify_content_update(self, content: Content):
        raise NotImplementedError


class NotifierFactory(object):

    @classmethod
    def create(cls, current_user: User=None) -> INotifier:
        # TODO: Find a way to import properly without cyclic import
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()
        if not cfg.EMAIL_NOTIFICATION_ACTIVATED:
            return DummyNotifier(current_user)

        return RealNotifier(current_user)


class DummyNotifier(INotifier):
    send_count = 0

    def __init__(self, current_user: User=None):
        logger.info(self, 'Instantiating Dummy Notifier')

    def notify_content_update(self, content: Content):
        type(self).send_count += 1
        logger.info(self, 'Fake notifier, do not send email-notification for update of content {}'.format(content.content_id))


class RealNotifier(object):

    def __init__(self, current_user: User=None):
        """
        :param current_user: the user that has triggered the notification
        :return:
        """
        logger.info(self, 'Instantiating Real Notifier')
        # TODO: Find a way to import properly without cyclic import
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()

        self._user = current_user
        self._smtp_config = SmtpConfiguration(cfg.EMAIL_NOTIFICATION_SMTP_SERVER,
                                       cfg.EMAIL_NOTIFICATION_SMTP_PORT,
                                       cfg.EMAIL_NOTIFICATION_SMTP_USER,
                                       cfg.EMAIL_NOTIFICATION_SMTP_PASSWORD)

    def notify_content_update(self, content: Content):
        # TODO: Find a way to import properly without cyclic import
        from tracim.config.app_cfg import CFG
        global_config = CFG.get_instance()

        if content.get_last_action().id not \
                in global_config.EMAIL_NOTIFICATION_NOTIFIED_EVENTS:
            logger.info(
                self,
                'Skip email notification for update of content {}'
                'by user {} (the action is {})'.format(
                    content.content_id,
                    # below: 0 means "no user"
                    self._user.user_id if self._user else 0,
                    content.get_last_action().id
                )
            )
            return

        logger.info(self,
                    'About to email-notify update'
                    'of content {} by user {}'.format(
                        content.content_id,
                        # Below: 0 means "no user"
                        self._user.user_id if self._user else 0
                    )
        )

        if content.type not \
                in global_config.EMAIL_NOTIFICATION_NOTIFIED_CONTENTS:
            logger.info(
                self,
                'Skip email notification for update of content {}'
                'by user {} (the content type is {})'.format(
                    content.type,
                    # below: 0 means "no user"
                    self._user.user_id if self._user else 0,
                    content.get_last_action().id
                )
            )
            return

        logger.info(self,
                    'About to email-notify update'
                    'of content {} by user {}'.format(
                        content.content_id,
                        # Below: 0 means "no user"
                        self._user.user_id if self._user else 0
                    )
        )

        ####
        #
        # INFO - D.A. - 2014-11-05 - Emails are sent through asynchronous jobs.
        # For that reason, we do not give SQLAlchemy objects but ids only
        # (SQLA objects are related to a given thread/session)
        #
        try:
            if global_config.EMAIL_NOTIFICATION_PROCESSING_MODE.lower()==global_config.CST.ASYNC.lower():
                logger.info(self, 'Sending email in ASYNC mode')
                # TODO - D.A - 2014-11-06
                # This feature must be implemented in order to be able to scale to large communities
                raise NotImplementedError('Sending emails through ASYNC mode is not working yet')
            else:
                logger.info(self, 'Sending email in SYNC mode')
                EmailNotifier(self._smtp_config, global_config).notify_content_update(self._user.user_id, content.content_id)
        except Exception as e:
            logger.error(self, 'Exception catched during email notification: {}'.format(e.__str__()))

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

    def __init__(self, smtp_config: SmtpConfiguration, global_config):
        self._smtp_config = smtp_config
        self._global_config = global_config

    def _get_sender(self, user: User=None) -> str:
        """
        Return sender string like "Bob Dylan
            (via Tracim) <notification@mail.com>"
        :param user: user to extract display name
        :return: sender string
        """

        email_template = self._global_config.EMAIL_NOTIFICATION_FROM_EMAIL
        mail_sender_name = self._global_config.EMAIL_NOTIFICATION_FROM_DEFAULT_LABEL  # nopep8
        if user:
            mail_sender_name = '{name} via Tracim'.format(name=user.display_name)
            email_address = email_template.replace('{user_id}', str(user.user_id))
            # INFO - D.A. - 2017-08-04
            # We use email_template.replace() instead of .format() because this
            # method is more robust to errors in config file.
            #
            # For example, if the email is info+{userid}@tracim.fr
            # email.format(user_id='bob') will raise an exception
            # email.replace('{user_id}', 'bob') will just ignore {userid}
        else:
            email_address = email_template.replace('{user_id}', '0')

        return formataddr((mail_sender_name, email_address))

    @staticmethod
    def log_notification(
            action: str,
            recipient: typing.Optional[str],
            subject: typing.Optional[str],
    ) -> None:
        """Log notification metadata."""
        from tracim.config.app_cfg import CFG
        log_path = CFG.get_instance().EMAIL_NOTIFICATION_LOG_FILE_PATH
        if log_path:
            # TODO - A.P - 2017-09-06 - file logging inefficiency
            # Updating a document with 100 users to notify will leads to open
            # and close the file 100 times.
            with open(log_path, 'a') as log_file:
                print(
                    datetime.datetime.now(),
                    action,
                    recipient,
                    subject,
                    sep='|',
                    file=log_file,
                )

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
        main_content = content.parent if content.type==ContentType.Comment else content
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
            to_addr = formataddr((role.user.display_name, role.user.email))
            #
            # INFO - G.M - 2017-11-15 - set content_id in header to permit reply
            # references can have multiple values, but only one in this case.
            replyto_addr = self._global_config.EMAIL_NOTIFICATION_REPLY_TO_EMAIL.replace( # nopep8
                '{content_id}',str(content.content_id)
            )

            reference_addr = self._global_config.EMAIL_NOTIFICATION_REFERENCES_EMAIL.replace( #nopep8
                '{content_id}',str(content.content_id)
             )
            #
            #  INFO - D.A. - 2014-11-06
            # We do not use .format() here because the subject defined in the .ini file
            # may not include all required labels. In order to avoid partial format() (which result in an exception)
            # we do use replace and force the use of .__str__() in order to process LazyString objects
            #
            subject = self._global_config.EMAIL_NOTIFICATION_CONTENT_UPDATE_SUBJECT
            subject = subject.replace(EST.WEBSITE_TITLE, self._global_config.WEBSITE_TITLE.__str__())
            subject = subject.replace(EST.WORKSPACE_LABEL, main_content.workspace.label.__str__())
            subject = subject.replace(EST.CONTENT_LABEL, main_content.label.__str__())
            subject = subject.replace(EST.CONTENT_STATUS_LABEL, main_content.get_status().label.__str__())

            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = self._get_sender(user)
            message['To'] = to_addr
            message['Reply-to'] = formataddr(('',replyto_addr))
            # INFO - G.M - 2017-11-15
            # References can theorically have label, but in pratice, references
            # contains only message_id from parents post in thread.
            # To link this email to a content we create a virtual parent
            # in reference who contain the content_id.
            message['References'] = formataddr(('',reference_addr))
            body_text = self._build_email_body(self._global_config.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_TEXT, role, content, user)



            body_html = self._build_email_body(self._global_config.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_HTML, role, content, user)

            part1 = MIMEText(body_text, 'plain', 'utf-8')
            part2 = MIMEText(body_html, 'html', 'utf-8')
            # Attach parts into message container.
            # According to RFC 2046, the last part of a multipart message, in this case
            # the HTML message, is best and preferred.
            message.attach(part1)
            message.attach(part2)

            self.log_notification(
                action='CREATED',
                recipient=message['To'],
                subject=message['Subject'],
            )
            send_email_through(async_email_sender.send_mail, message)

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

        main_title = dictified_item.label
        content_intro = ''
        content_text = ''
        call_to_action_text = ''

        action = content.get_last_action().id
        if ActionDescription.COMMENT == action:
            content_intro = l_('<span id="content-intro-username">{}</span> added a comment:').format(actor.display_name)
            content_text = content.description
            call_to_action_text = l_('Answer')

        elif ActionDescription.CREATION == action:

            # Default values (if not overriden)
            content_text = content.description
            call_to_action_text = l_('View online')

            if ContentType.Thread == content.type:
                call_to_action_text = l_('Answer')
                content_intro = l_('<span id="content-intro-username">{}</span> started a thread entitled:').format(actor.display_name)
                content_text = '<p id="content-body-intro">{}</p>'.format(content.label) + \
                               content.get_last_comment_from(actor).description

            elif ContentType.File == content.type:
                content_intro = l_('<span id="content-intro-username">{}</span> added a file entitled:').format(actor.display_name)
                if content.description:
                    content_text = content.description
                else:
                    content_text = '<span id="content-body-only-title">{}</span>'.format(content.label)

            elif ContentType.Page == content.type:
                content_intro = l_('<span id="content-intro-username">{}</span> added a page entitled:').format(actor.display_name)
                content_text = '<span id="content-body-only-title">{}</span>'.format(content.label)

        elif ActionDescription.REVISION == action:
            content_text = content.description
            call_to_action_text = l_('View online')

            if ContentType.File == content.type:
                content_intro = l_('<span id="content-intro-username">{}</span> uploaded a new revision.').format(actor.display_name)
                content_text = ''

            elif ContentType.Page == content.type:
                content_intro = l_('<span id="content-intro-username">{}</span> updated this page.').format(actor.display_name)
                previous_revision = content.get_previous_revision()
                title_diff = ''
                if previous_revision.label != content.label:
                    title_diff = htmldiff(previous_revision.label, content.label)
                content_text = str(l_('<p id="content-body-intro">Here is an overview of the changes:</p>'))+ \
                    title_diff + \
                    htmldiff(previous_revision.description, content.description)

            elif ContentType.Thread == content.type:
                content_intro = l_('<span id="content-intro-username">{}</span> updated the thread description.').format(actor.display_name)
                previous_revision = content.get_previous_revision()
                title_diff = ''
                if previous_revision.label != content.label:
                    title_diff = htmldiff(previous_revision.label, content.label)
                content_text = str(l_('<p id="content-body-intro">Here is an overview of the changes:</p>'))+ \
                    title_diff + \
                    htmldiff(previous_revision.description, content.description)

            # elif ContentType.Thread == content.type:
            #     content_intro = l_('<span id="content-intro-username">{}</span> updated this page.').format(actor.display_name)
            #     previous_revision = content.get_previous_revision()
            #     content_text = l_('<p id="content-body-intro">Here is an overview of the changes:</p>')+ \
            #         htmldiff(previous_revision.description, content.description)

        elif ActionDescription.EDITION == action:
            call_to_action_text = l_('View online')

            if ContentType.File == content.type:
                content_intro = l_('<span id="content-intro-username">{}</span> updated the file description.').format(actor.display_name)
                content_text = '<p id="content-body-intro">{}</p>'.format(content.get_label()) + \
                    content.description

        elif ActionDescription.STATUS_UPDATE == action:
            call_to_action_text = l_('View online')
            intro_user_msg = l_(
                '<span id="content-intro-username">{}</span> '
                'updated the following status:'
            )
            content_intro = intro_user_msg.format(actor.display_name)
            intro_body_msg = '<p id="content-body-intro">{}: {}</p>'
            content_text = intro_body_msg.format(
                content.get_label(),
                content.get_status().label,
            )

        if '' == content_intro and content_text == '':
            # Skip notification, but it's not normal
            logger.error(
                self, 'A notification is being sent but no content. '
                      'Here are some debug informations: [content_id: {cid}]'
                      '[action: {act}][author: {actor}]'.format(
                    cid=content.content_id, act=action, actor=actor
                )
            )
            raise ValueError('Unexpected empty notification')

        # Import done here because cyclic import
        from tracim.config.app_cfg import CFG
        body_content = template.render(
            base_url=self._global_config.WEBSITE_BASE_URL,
            _=l_,
            h=helpers,
            user_display_name=role.user.display_name,
            user_role_label=role.role_as_label(),
            workspace_label=role.workspace.label,
            content_intro=content_intro,
            content_text=content_text,
            main_title=main_title,
            call_to_action_text=call_to_action_text,
            result = DictLikeClass(item=dictified_item, actor=dictified_actor),
            CFG=CFG.get_instance(),
        )

        return body_content
