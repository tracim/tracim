# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session

from tracim import CFG
from tracim.lib.utils.logger import logger
from tracim.models.auth import User
from tracim.models.data import Content


class INotifier(object):
    """
    Interface for Notifier instances
    """
    def __init__(self,
                 config: CFG,
                 session: Session,
                 current_user: User=None,
    ) -> None:
        pass

    def notify_content_update(self, content: Content):
        raise NotImplementedError


class NotifierFactory(object):

    @classmethod
    def create(cls, config, session, current_user: User=None) -> INotifier:
        if not config.EMAIL_NOTIFICATION_ACTIVATED:
            return DummyNotifier(config, session, current_user)
        from tracim.lib.mail_notifier.notifier import EmailNotifier
        return EmailNotifier(config, session, current_user)


class DummyNotifier(INotifier):
    send_count = 0

    def __init__(
            self,
            config: CFG,
            session: Session,
            current_user: User=None
    ) -> None:
        INotifier.__init__(
            self,
            config,
            session,
            current_user,
        )
        logger.info(self, 'Instantiating Dummy Notifier')

    def notify_content_update(self, content: Content):
        type(self).send_count += 1
        logger.info(
            self,
            'Fake notifier, do not send notification for update of content {}'.format(content.content_id)  # nopep8
        )
