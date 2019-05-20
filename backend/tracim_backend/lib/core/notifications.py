# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content


class INotifier(object):
    """
    Interface for Notifier instances
    """

    def __init__(self, config: CFG, session: Session, current_user: User = None) -> None:
        pass

    def notify_content_update(self, content: Content):
        raise NotImplementedError


class NotifierFactory(object):
    @classmethod
    def create(cls, config: CFG, session, current_user: User = None) -> INotifier:
        if not config.EMAIL__NOTIFICATION__ACTIVATED:
            return DummyNotifier(config, session, current_user)
        from tracim_backend.lib.mail_notifier.notifier import EmailNotifier

        return EmailNotifier(config, session, current_user)


class DummyNotifier(INotifier):
    send_count = 0

    def __init__(self, config: CFG, session: Session, current_user: User = None) -> None:
        INotifier.__init__(self, config, session, current_user)
        logger.info(self, "Instantiating Dummy Notifier")

    def notify_content_update(self, content: Content):
        type(self).send_count += 1
        logger.info(
            self,
            "Fake notifier, do not send notification for update of content {}".format(
                content.content_id
            ),
        )
