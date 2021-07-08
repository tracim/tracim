import datetime
from pathlib import PurePath
import typing
from urllib.parse import quote
from urllib.parse import urljoin

from importlib_metadata import metadata
from sqlalchemy.orm import Session

from tracim_backend.apps import COLLABORATIVE_DOCUMENT_EDITION__APP_SLUG
from tracim_backend.config import CFG
from tracim_backend.error import ErrorCode
from tracim_backend.exceptions import InvalidUsernameFormat
from tracim_backend.exceptions import ReservedUsernameError
from tracim_backend.exceptions import UsernameAlreadyExists
from tracim_backend.extensions import app_list
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.context_models import AboutModel
from tracim_backend.models.context_models import ConfigModel
from tracim_backend.models.context_models import ErrorCodeModel
from tracim_backend.models.context_models import UsageConditionModel


class SystemApi(object):
    def __init__(
        self, config: CFG, session: Session,
    ):
        self._config = config
        self._session = session

    def get_about(self) -> AboutModel:
        # TODO - G.M - 2018-09-26 - Set version correctly
        return AboutModel(
            name="Tracim",
            version=metadata("tracim_backend")["Version"],
            build_version=self._config.BUILD_VERSION,
            datetime=datetime.datetime.now(),
            website=metadata("tracim_backend")["Home-page"],
        )

    def get_config(self) -> ConfigModel:
        collaborative_document_edition_config = None
        app_lib = ApplicationApi(app_list=app_list)
        if app_lib.exist(COLLABORATIVE_DOCUMENT_EDITION__APP_SLUG):
            from tracim_backend.applications.collaborative_document_edition.factory import (
                CollaborativeDocumentEditionFactory,
            )

            collaborative_document_edition_api = CollaborativeDocumentEditionFactory().get_lib(
                session=None, current_user=None, config=self._config
            )
            collaborative_document_edition_config = collaborative_document_edition_api.get_config()

        return ConfigModel(
            email_notification_activated=self._config.EMAIL__NOTIFICATION__ACTIVATED,
            new_user_invitation_do_notify=self._config.NEW_USER__INVITATION__DO_NOTIFY,
            webdav_enabled=self._config.WEBDAV__UI__ENABLED,
            translation_service__enabled=self._config.TRANSLATION_SERVICE__ENABLED,
            webdav_url=urljoin(self._config.WEBDAV__BASE_URL, self._config.WEBDAV__ROOT_PATH),
            collaborative_document_edition=collaborative_document_edition_config,
            content_length_file_size_limit=self._config.LIMITATION__CONTENT_LENGTH_FILE_SIZE,
            workspace_size_limit=self._config.LIMITATION__WORKSPACE_SIZE,
            workspaces_number_per_user_limit=self._config.LIMITATION__SHAREDSPACE_PER_USER,
            instance_name=self._config.WEBSITE__TITLE,
            email_required=self._config.EMAIL__REQUIRED,
            search_engine=self._config.SEARCH__ENGINE,
            translation_service__target_languages=self._config.TRANSLATION_SERVICE__TARGET_LANGUAGES,
            user__self_registration__enabled=self._config.USER__SELF_REGISTRATION__ENABLED,
            ui__spaces__creation__parent_space_choice__visible=self._config.UI__SPACES__CREATION__PARENT_SPACE_CHOICE__VISIBLE,
            limitation__maximum_online_users_message=self._config.LIMITATION__MAXIMUM_ONLINE_USERS_MESSAGE,
        )

    def get_usage_conditions_files(self) -> typing.List[UsageConditionModel]:
        usages_conditions_files = []
        for file_name in self._config.WEBSITE__USAGE_CONDITIONS:
            label = PurePath(file_name).stem
            usages_conditions_files.append(
                UsageConditionModel(
                    title=label,
                    url=str(
                        "{base_url}/assets/branding/{condition_file_name}".format(
                            base_url=self._config.WEBSITE__BASE_URL,
                            condition_file_name=quote(file_name),
                        )
                    ),
                )
            )
        return usages_conditions_files

    def get_error_codes(self) -> typing.List[ErrorCodeModel]:
        error_codes = []
        for error_code in ErrorCode:
            error_codes.append(ErrorCodeModel(error_code))
        return error_codes

    def get_username_availability(self, username: str) -> bool:
        uapi = UserApi(None, session=self._session, config=self._config)
        try:
            uapi.check_username(username)
            return True
        except (InvalidUsernameFormat, UsernameAlreadyExists, ReservedUsernameError):
            return False

    def get_reserved_usernames(self) -> typing.Tuple[str, ...]:
        uapi = UserApi(None, session=self._session, config=self._config)
        return uapi.get_reserved_usernames()
