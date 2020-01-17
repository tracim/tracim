import datetime
import typing
from urllib.parse import urljoin

from tracim_backend.apps import COLLABORATIVE_DOCUMENT_EDITION__APP_SLUG
from tracim_backend.config import CFG
from tracim_backend.error import ErrorCode
from tracim_backend.extensions import app_list
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.models.context_models import AboutModel
from tracim_backend.models.context_models import ConfigModel
from tracim_backend.models.context_models import ErrorCodeModel


class SystemApi(object):
    def __init__(self, config: CFG):
        self._config = config

    def get_about(self) -> AboutModel:
        # TODO - G.M - 2018-09-26 - Set version correctly
        return AboutModel(
            name="Tracim",
            version="2.5.1",
            datetime=datetime.datetime.now(),
            website="https://www.tracim.fr",
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
            webdav_url=urljoin(self._config.WEBDAV__BASE_URL, self._config.WEBDAV__ROOT_PATH),
            collaborative_document_edition=collaborative_document_edition_config,
            content_length_file_size_limit=self._config.LIMITATION__CONTENT_LENGTH_FILE_SIZE,
            workspace_size_limit=self._config.LIMITATION__WORKSPACE_SIZE,
            workspaces_number_per_user_limit=self._config.LIMITATION__SHAREDSPACE_PER_USER,
        )

    def get_error_codes(self) -> typing.List[ErrorCodeModel]:
        error_codes = []
        for error_code in ErrorCode:
            error_codes.append(ErrorCodeModel(error_code))
        return error_codes
