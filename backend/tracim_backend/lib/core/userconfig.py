from typing import Any
from typing import Dict

from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.models.userconfig import UserConfig


class UserConfigApi:
    """Api to query user configuration"""

    def __init__(self, current_user: User, session: TracimSession):
        self._current_user = current_user
        self._session = session

    def get_config(self) -> UserConfig:
        query = self._session.query(UserConfig)
        return query.filter(UserConfig.user_id == self._current_user.user_id).one()

    def get_all_params(self) -> Dict[str, Any]:
        return self.get_config().fields

    def set_params(self, params: Dict[str, Any]) -> UserConfig:
        config = self.get_config()
        config.fields = {**config.fields, **params}
        self._session.add(config)
        self._session.flush()
        return config
