# -*- coding: utf-8 -*-

from tracim.lib.utils.logger import logger
from tracim.models.auth import User
from tracim.models.data import Content


class INotifier(object):
    """
    Interface for Notifier instances
    """
    def __init__(self, config, current_user: User=None):
        pass

    def notify_content_update(self, content: Content):
        raise NotImplementedError


class NotifierFactory(object):

    @classmethod
    def create(cls, config, current_user: User=None) -> INotifier:
        if not config.EMAIL_NOTIFICATION_ACTIVATED:
            return DummyNotifier(config, current_user)
        return EmailNotifier(config, current_user)


class DummyNotifier(INotifier):
    send_count = 0

    def __init__(self, config, current_user: User=None):
        INotifier.__init__(config, current_user)
        logger.info(self, 'Instantiating Dummy Notifier')

    def notify_content_update(self, content: Content):
        type(self).send_count += 1
        logger.info(
            self,
            'Fake notifier, do not send notification for update of content {}'.format(content.content_id)  # nopep8
        )


class EmailNotifier(INotifier):
    # TODO - G.M [emailNotif] move and restore Email Notifier in another file.
    pass
