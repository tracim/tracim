from typing import Any
from typing import Dict

from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.models.user_custom_properties import UserCustomProperties


class UserCustomPropertiesApi:
    """Api to query user custom properties"""

    def __init__(self, current_user: User, session: TracimSession):
        self._current_user = current_user
        self._session = session

    def get_custom_properties(self) -> UserCustomProperties:
        query = self._session.query(UserCustomProperties)
        return query.filter(UserCustomProperties.user_id == self._current_user.user_id).one()

    def get_all_params(self) -> Dict[str, Any]:
        return self.get_custom_properties().fields

    def set_params(self, params: Dict[str, Any]) -> UserCustomProperties:
        custom_properties = self.get_custom_properties()
        custom_properties.fields = {**custom_properties.fields, **params}
        self._session.add(custom_properties)
        self._session.flush()
        return custom_properties
