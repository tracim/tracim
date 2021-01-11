import typing
from typing import Any
from typing import Dict

from tracim_backend.config import CFG
from tracim_backend.lib.utils.dict_parsing import get_translation_key_from_dict
from tracim_backend.lib.utils.dict_parsing import translate_dict
from tracim_backend.lib.utils.translation import TranslationSource
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.models.user_custom_properties import UserCustomProperties

# JSONSchema field useful to be translated.
# note: enumNames is not standard but supported
# see: https://react-jsonschema-form.readthedocs.io/en/latest/usage/single/#custom-labels-for-enum-fields
JSON_SCHEMA_KEYS_TO_TRANSLATE = ["enumNames", "title", "description"]
# INFO - G.M - 2020-01-11 - UISchema field useful to be translated
# see https://react-jsonschema-form.readthedocs.io/en/latest/api-reference/uiSchema/
UI_SCHEMA_KEYS_TO_TRANSLATE = ["title", "description", "placeholder", "help"]
UI_SCHEMA_KEYS_TO_TRANSLATE += ["ui:{}".format(key) for key in UI_SCHEMA_KEYS_TO_TRANSLATE]


class UserCustomPropertiesApi:
    """Api to query user custom properties"""

    def __init__(self, current_user: User, session: TracimSession, app_config: CFG):
        self._current_user = current_user
        self._session = session
        self._config = app_config
        self._translator = Translator(
            app_config=self._config,
            default_lang=self._current_user.lang if self._current_user else None,
            fallback_lang=self._config.DEFAULT_LANG,
            default_source=TranslationSource.CUSTOM_PROPERTIES,
        )

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

    def get_json_schema(self) -> typing.Dict:
        return {
            "json_schema": translate_dict(
                self._config.USER__CUSTOM_PROPERTIES__JSON_SCHEMA,
                keys_to_check=JSON_SCHEMA_KEYS_TO_TRANSLATE,
                translation_method=self._translator.get_translation,
            )
        }

    def get_ui_schema(self) -> typing.Dict:
        return {
            "ui_schema": translate_dict(
                self._config.USER__CUSTOM_PROPERTIES__UI_SCHEMA,
                keys_to_check=UI_SCHEMA_KEYS_TO_TRANSLATE,
                translation_method=self._translator.get_translation,
            )
        }

    def get_translation_template(self) -> typing.Dict:
        """
        Get translation template for current user custom properties
        """
        ui_translation_dict = get_translation_key_from_dict(
            self._config.USER__CUSTOM_PROPERTIES__UI_SCHEMA,
            keys_to_check=UI_SCHEMA_KEYS_TO_TRANSLATE,
        )
        json_translation_dict = get_translation_key_from_dict(
            self._config.USER__CUSTOM_PROPERTIES__JSON_SCHEMA,
            keys_to_check=JSON_SCHEMA_KEYS_TO_TRANSLATE,
        )
        json_translation_dict.update(ui_translation_dict)
        return json_translation_dict
