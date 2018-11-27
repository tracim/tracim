import datetime

from tracim_backend.config import CFG
from tracim_backend.models.context_models import AboutModel
from tracim_backend.models.context_models import ConfigModel


class SystemApi(object):

    def __init__(
            self,
            config: CFG,
    ):
        self._config = config

    def get_about(self) -> AboutModel:
        # TODO - G.M - 2018-09-26 - Set version correctly
        return AboutModel(
            name='Tracim',
            version=None,
            datetime=datetime.datetime.now(),
            website='https://www.tracim.fr'
        )

    def get_config(self) -> ConfigModel:
        return ConfigModel(
            email_notification_activated=self._config.EMAIL_NOTIFICATION_ACTIVATED,  # nopep8
            new_user_invitation_do_notify=self._config.NEW_USER_INVITATION_DO_NOTIFY,  # nopep8
        )
