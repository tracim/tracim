import typing
from typing import Any
from typing import Dict

from tracim_backend.config import CFG
from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.models.user_custom_properties import UserCustomProperties


class UserCustomPropertiesApi:
    """Api to query user custom properties"""

    def __init__(self, current_user: User, session: TracimSession, app_config: CFG):
        self._current_user = current_user
        self._session = session
        self._config = app_config

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

    def _translate_schema(self, schema: Dict) -> Dict:
        return schema

    def get_json_schema(self) -> typing.Dict:
        return {
            "json_schema": self._translate_schema(self._config.USER__CUSTOM_PROPERTIES__JSON_SCHEMA)
        }

    def get_ui_schema(self) -> typing.Dict:
        return {
            "ui_schema": self._translate_schema(self._config.USER__CUSTOM_PROPERTIES__UI_SCHEMA)
        }
