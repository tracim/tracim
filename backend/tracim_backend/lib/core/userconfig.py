from typing import Dict

from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.models.userconfig import UserConfig


class UserConfigApi:
    """Api to query user configuration"""

    def __init__(self, user: User, session: TracimSession):
        self._user = user
        self._session = session

    def get_config(self) -> UserConfig:
        query = self._session.query(UserConfig)
        return query.filter(UserConfig.user_id == self._user.user_id).one()

    def get_all_params(self) -> Dict:
        return self.get_config().fields

    def set_params(self, params: Dict) -> UserConfig:
        config = self.get_config()
        config.fields = {**config.fields, **params}
        self._session.add(config)
        self._session.flush()
        return config
