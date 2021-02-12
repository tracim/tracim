# -*- coding: utf-8 -*-
from enum import Enum
import json
import os
import typing

from depot.manager import DepotManager
from jsonschema import SchemaError
from jsonschema.validators import validator_for
from paste.deploy.converters import asbool

from tracim_backend.app_models.validator import update_validators
from tracim_backend.apps import load_apps
from tracim_backend.exceptions import ConfigCodeError
from tracim_backend.exceptions import ConfigurationError
from tracim_backend.exceptions import NotAFileError
from tracim_backend.exceptions import NotReadableDirectory
from tracim_backend.exceptions import NotReadableFile
from tracim_backend.exceptions import NotWritableDirectory
from tracim_backend.extensions import app_list
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import DEFAULT_FALLBACK_LANG
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.lib.utils.translation import translator_marker as _
from tracim_backend.lib.utils.utils import get_build_version
from tracim_backend.lib.utils.utils import get_cache_token
from tracim_backend.lib.utils.utils import is_dir_exist
from tracim_backend.lib.utils.utils import is_dir_readable
from tracim_backend.lib.utils.utils import is_dir_writable
from tracim_backend.lib.utils.utils import is_file_exist
from tracim_backend.lib.utils.utils import is_file_readable
from tracim_backend.lib.utils.utils import string_to_unique_item_list
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import WorkspaceAccessType

ENV_VAR_PREFIX = "TRACIM_"
CONFIG_LOG_TEMPLATE = (
    "CONFIG: [ {config_source: <15} | {config_name} | {config_value} | {config_name_source} ]"
)
ID_SOURCE_ENV_VAR = "SOURCE_ENV_VAR"
ID_SOURCE_CONFIG = "SOURCE_CONFIG"
ID_SOURCE_DEFAULT = "SOURCE_DEFAULT"

DEPOT_LOCAL_STORAGE_BACKEND = "depot.io.local.LocalFileStorage"
DEPOT_S3_STORAGE_BACKEND = "depot.io.boto3.S3Storage"
DEPOT_MEMORY_STORAGE_BACKEND = "depot.io.memory.MemoryFileStorage"
DEPOT_CONTENT_CONF_PREFIX = "uploaded_files"


class DepotFileStorageType(Enum):
    LOCAL = ("local", "depot.io.local.LocalFileStorage")
    S3 = ("s3", "depot.io.boto3.S3Storage")
    MEMORY = ("memory", "depot.io.memory.MemoryFileStorage")

    def __init__(self, slug: str, depot_storage_backend: str):
        self.slug = slug
        self.depot_storage_backend = depot_storage_backend


class ConfigParam(object):
    def __init__(
        self,
        config_file_name: str,
        secret: bool,
        default_value: typing.Optional[str],
        settings: typing.Dict[str, str],
        deprecated: bool,
        deprecated_extended_information: str,
    ):
        """
        :param config_file_name: name of the parameter in config file
        :param secret: is the parameter secret
        :param default_value: default value in code for parameter
        :param settings: settings dict of config file
        :param deprecated: is the parameter deprecated
        :param deprecated_extended_information: more information about deprecation.
        """
        self.config_file_name = config_file_name
        self.default_value = default_value
        self.secret = secret
        self.config_name = self._get_associated_config_name(config_file_name)
        self.env_var_name = self._get_associated_env_var_name(self.config_name)
        self._config_file_value = settings.get(self.config_file_name)
        self._env_var_value = os.environ.get(self.env_var_name)
        self.deprecated = deprecated
        self.deprecated_extended_information = deprecated_extended_information
        self.show_secret = False
        if self._env_var_value:
            self._config_value = self._env_var_value
            self.config_source = ID_SOURCE_ENV_VAR
            self.config_name_source = self.env_var_name
        elif self._config_file_value:
            self._config_value = self._config_file_value
            self.config_source = ID_SOURCE_CONFIG
            self.config_name_source = self.config_file_name
        else:
            self._config_value = self.default_value
            self.config_source = ID_SOURCE_DEFAULT
            self.config_name_source = None

    @property
    def config_file_value(self):
        return self._get_protected_value(value=self._config_file_value, secret=self.secret)

    @property
    def env_var_value(self):
        return self._get_protected_value(value=self._env_var_value, secret=self.secret)

    @property
    def config_value(self):
        return self._get_protected_value(value=self._config_value, secret=self.secret)

    @property
    def real_config_value(self):
        return self._config_value

    def _get_associated_env_var_name(self, config_name: str) -> str:
        """
        Get associated env var name of any config_name.
        example: APP_ENABLED become TRACIM_APP_ENABLED
        """
        return "{env_var_prefix}{config_name}".format(
            env_var_prefix=ENV_VAR_PREFIX, config_name=config_name
        )

    def _get_associated_config_name(self, config_name: str) -> str:
        """
        Get associated config_name to config_file_name
        example: app.enabled become APP__ENABLED
        """
        return config_name.replace(".", "__").replace("-", "_").upper()

    def _get_protected_value(self, value: str, secret: bool) -> str:
        if secret and not self.show_secret and value:
            return "<value not shown>"
        else:
            return value


class CFG(object):
    """Object used for easy access to config file parameters."""

    def __init__(self, settings: typing.Dict[str, typing.Any]):
        # INFO - G.M - 2019-12-02 - Store own settings original dict, with copy
        # to avoid issue when serializing CFG object. settings dict is completed
        # with object in some context
        self.settings = settings.copy()
        self.config_info = []  # type: typing.List[ConfigParam]
        logger.debug(self, "CONFIG_PROCESS:1: load enabled apps")
        self.load_enabled_apps()
        logger.debug(self, "CONFIG_PROCESS:3: load config from settings")
        self.load_config()
        logger.debug(self, "CONFIG_PROCESS:4: check validity of config given")
        self._check_consistency()
        self.check_config_validity()
        logger.debug(self, "CONFIG_PROCESS:5: End of config process")

        app_lib = ApplicationApi(app_list=app_list, show_inactive=True)
        for app in app_lib.get_all():
            logger.info(
                self,
                "LOADED_APP:{state}:{slug}:{label}".format(
                    state="ENABLED" if app.is_active else "DISABLED",
                    slug=app.slug,
                    label=app.label,
                ),
            )

    # INFO - G.M - 2019-04-05 - Utils Methods

    def deprecate_parameter(
        self, parameter_name: str, parameter_value: typing.Any, extended_information: str,
    ) -> None:
        """

        :param parameter_name: name of the parameter, etc : "CALDAV_ENABLED"
        :param parameter_value: value of the parameter.
        :param extended_information: add some more information about deprecation
        :return: None
        """

    def get_raw_config(
        self,
        config_file_name: str,
        default_value: typing.Optional[str] = None,
        secret: bool = False,
        deprecated: bool = False,
        deprecated_extended_information: str = "",
    ) -> str:
        """
        Get config parameter according to a config name.
        Priority:
         - 1: Environement variable
         - 2: Config file data (stored in CFG.settings dict)
         - 3: default_value
        :param config_file_name: name of the config parameter name
        :param default_value: default value if not setted value found
        :param secret: is the value of the parameter secret ? (if true, it will not be printed)
        :param deprecated: is the parameter deprecated ?
        :param deprecated_extended_information: some more information about deprecated parameter
        :return:
        """
        param = ConfigParam(
            config_file_name=config_file_name,
            secret=secret,
            default_value=default_value,
            settings=self.settings,
            deprecated=deprecated,
            deprecated_extended_information=deprecated_extended_information,
        )
        self.config_info.append(param)
        logger.info(
            self,
            CONFIG_LOG_TEMPLATE.format(
                config_value=param.config_value,
                config_source=param.config_source,
                config_name=param.config_name,
                config_name_source=param.config_name_source,
            ),
        )
        if param.deprecated and param.config_value:
            logger.warning(
                self,
                "{parameter_name} parameter is deprecated. {extended_information}".format(
                    parameter_name=param.config_name,
                    extended_information=param.deprecated_extended_information,
                ),
            )
        return param.real_config_value

    # INFO - G.M - 2019-04-05 - load of enabled app
    def load_enabled_apps(self) -> None:
        self._load_enabled_apps_config()
        loaded_apps = load_apps()
        self._load_enabled_app(self.APP__ENABLED, loaded_apps)

    def _load_enabled_apps_config(self) -> None:
        self.log_config_header("App Enabled config parameters:")
        default_enabled_app = (
            "contents/thread,"
            "contents/file,"
            "contents/html-document,"
            "contents/folder,"
            "agenda,"
            "share_content,"
            "upload_permission,"
            "gallery"
        )
        extend_apps = ""
        default_enabled_app = default_enabled_app.format(extend_apps=extend_apps)
        self.APP__ENABLED = string_to_unique_item_list(
            self.get_raw_config("app.enabled", default_enabled_app),
            separator=",",
            cast_func=str,
            do_strip=True,
        )

    def _load_enabled_app(
        self,
        enabled_app_slug_list: typing.List[str],
        loaded_apps: typing.Dict[str, TracimApplication],
    ) -> None:

        # TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
        # of tracim_backend, Be careful app_list is a global_var
        app_list.clear()
        # FIXME - G.M - 2020-01-27 - force specific order of apps
        # see issue https://github.com/tracim/tracim/issues/2326
        default_app_order = (
            "contents/thread",
            "contents/file",
            "contents/html-document",
            "contents/folder",
            "agenda",
            "collaborative_document_edition",
            "share_content",
            "upload_permission",
            "gallery",
        )
        for app_name in default_app_order:
            app = loaded_apps.get(app_name)
            if app:
                if app_name in enabled_app_slug_list:
                    app.load_content_types()
                    app.is_active = True
                app_list.append(app)

        # FIXME - G.M - 2020-01-27 - Ordering: add unordered app at the end of the list.
        # see issue https://github.com/tracim/tracim/issues/2326
        for app in loaded_apps.values():
            if app not in app_list:
                app_list.append(app)

        # TODO - G.M - 2018-08-08 - We need to update validators each time
        # app_list is updated.
        update_validators()

    def log_config_header(self, title: str) -> None:
        logger.info(self, title)
        logger.info(
            self,
            CONFIG_LOG_TEMPLATE.format(
                config_value="<config_value>",
                config_source="<config_source>",
                config_name="<config_name>",
                config_name_source="<config_name_source>",
            ),
        )

    # INFO - G.M - 2019-04-05 - Config loading methods
    def load_config(self) -> None:
        """Parse configuration file and env variables"""
        self.log_config_header("Global config parameters:")
        self._load_global_config()
        self.log_config_header("uploaded files config parameters:")
        self.__load_uploaded_files_config()
        self.log_config_header("Limitation config parameters:")
        self._load_limitation_config()
        self.log_config_header("Jobs config parameters:")
        self._load_jobs_config()
        self.log_config_header("Live Messages Config parameters:")
        self._load_live_messages_config()
        self.log_config_header("Email config parameters:")
        self._load_email_config()
        self.log_config_header("LDAP config parameters:")
        self._load_ldap_config()
        self.log_config_header("Webdav config parameters:")
        self._load_webdav_config()
        self.log_config_header("Search config parameters:")
        self._load_search_config()
        self.log_config_header("Content Security Policy parameters:")
        self._load_content_security_policy_config()

        app_lib = ApplicationApi(app_list=app_list)
        for app in app_lib.get_all():
            self.log_config_header('"{label}" app config parameters:'.format(label=app.label))
            app.load_config(self)

    def here_macro_replace(self, value: str) -> str:
        """
        "replace "%(here)s" by localisation of the config file.
        """
        if "TRACIM_HERE_PATH" in os.environ:
            return value.replace("%(here)s", os.environ["TRACIM_HERE_PATH"])

        return value.replace("%(here)s", self.settings["here"])

    def _load_global_config(self) -> None:
        """
        Load generic config
        """
        ###
        # General
        ###
        default_sqlalchemy_url = self.here_macro_replace("sqlite:///%(here)s/tracim.sqlite")
        self.SQLALCHEMY__URL = self.get_raw_config("sqlalchemy.url", default_sqlalchemy_url)
        self.DEFAULT_LANG = self.get_raw_config("default_lang", DEFAULT_FALLBACK_LANG)
        backend_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        tracim_folder = os.path.dirname(backend_folder)
        default_color_config_file_path = os.path.join(tracim_folder, "color.json")
        self.COLOR__CONFIG_FILE_PATH = self.get_raw_config(
            "color.config_file_path", default_color_config_file_path
        )
        default_preview_cache_dir = self.here_macro_replace("%(here)s/previews")
        self.PREVIEW_CACHE_DIR = self.get_raw_config("preview_cache_dir", default_preview_cache_dir)

        self.AUTH_TYPES = string_to_unique_item_list(
            self.get_raw_config("auth_types", "internal"),
            separator=",",
            cast_func=AuthType,
            do_strip=True,
        )
        self.REMOTE_USER_HEADER = self.get_raw_config("remote_user_header", None)

        self.API__KEY = self.get_raw_config("api.key", "", secret=True)
        default_session_data_dir = self.here_macro_replace("%(here)s/sessions_data")
        default_session_lock_dir = self.here_macro_replace("%(here)s/sessions_lock")
        self.SESSION__TYPE = self.get_raw_config("session.type", "file")
        self.SESSION__URL = self.get_raw_config("session.url")
        self.SESSION__DATA_DIR = self.get_raw_config("session.data_dir", default_session_data_dir)
        self.SESSION__LOCK_DIR = self.get_raw_config("session.lock_dir", default_session_lock_dir)
        self.SESSION__HTTPONLY = asbool(self.get_raw_config("session.httponly", "True"))
        self.SESSION__SECURE = asbool(self.get_raw_config("session.secure", "False"))
        self.WEBSITE__TITLE = self.get_raw_config("website.title", "Tracim")
        self.WEB__NOTIFICATIONS__EXCLUDED = self.get_raw_config(
            "web.notifications.excluded",
            "user.created,user.modified,user.deleted,user.undeleted,workspace.modified,workspace.deleted,workspace.undeleted,workspace_member.modified,content.modified",
        )

        # base url of the frontend
        self.WEBSITE__BASE_URL = self.get_raw_config("website.base_url", "http://localhost:7999")

        self.API__BASE_URL = self.get_raw_config("api.base_url", self.WEBSITE__BASE_URL)

        if self.API__BASE_URL != self.WEBSITE__BASE_URL:
            default_cors_allowed_origin = "{},{}".format(self.WEBSITE__BASE_URL, self.API__BASE_URL)
        else:
            default_cors_allowed_origin = self.WEBSITE__BASE_URL

        self.CORS__ACCESS_CONTROL_ALLOWED_ORIGIN = string_to_unique_item_list(
            self.get_raw_config("cors.access-control-allowed-origin", default_cors_allowed_origin),
            separator=",",
            cast_func=str,
            do_strip=True,
        )
        self.DEFAULT_ANONYMIZED_USER_DISPLAY_NAME = self.get_raw_config(
            "default_anonymized_user_display_name", "Deleted user"
        )

        self.USER__AUTH_TOKEN__VALIDITY = int(
            self.get_raw_config("user.auth_token.validity", "604800")
        )

        # TODO - G.M - 2019-03-14 - retrocompat code,
        # will be deleted in the future (https://github.com/tracim/tracim/issues/1483)
        defaut_reset_password_validity = "900"

        self.USER__RESET_PASSWORD__TOKEN_LIFETIME = int(
            self.get_raw_config(
                "user.reset_password.token_lifetime", defaut_reset_password_validity
            )
        )
        self.USER__DEFAULT_PROFILE = self.get_raw_config("user.default_profile", Profile.USER.slug)

        default_user_custom_properties_path = self.here_macro_replace(
            "%(here)s/tracim_backend/templates/user_custom_properties/default/"
        )

        self.USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH = self.get_raw_config(
            "user.custom_properties.json_schema_file_path",
            default_user_custom_properties_path + "schema.json",
        )
        self.USER__CUSTOM_PROPERTIES__UI_SCHEMA_FILE_PATH = self.get_raw_config(
            "user.custom_properties.ui_schema_file_path",
            default_user_custom_properties_path + "ui.json",
        )
        self.USER__CUSTOM_PROPERTIES__TRANSLATIONS_DIR_PATH = self.get_raw_config(
            "user.custom_properties.translations_dir_path",
            default_user_custom_properties_path + "locale",
        )

        self.WORKSPACE__ALLOWED_ACCESS_TYPES = string_to_unique_item_list(
            self.get_raw_config("workspace.allowed_access_types", "confidential,on_request,open"),
            separator=",",
            cast_func=WorkspaceAccessType,
            do_strip=True,
        )
        self.WORKSPACE__JOIN__MAX_MESSAGES_HISTORY_COUNT = int(
            self.get_raw_config("workspace.join.max_messages_history_count", "-1")
        )
        self.KNOWN_MEMBERS__FILTER = asbool(self.get_raw_config("known_members.filter", "True"))
        self.DEBUG = asbool(self.get_raw_config("debug", "False"))
        self.BUILD_VERSION = self.get_raw_config(
            "build_version", get_build_version(os.path.abspath(__file__))
        )
        self.PREVIEW__JPG__RESTRICTED_DIMS = asbool(
            self.get_raw_config("preview.jpg.restricted_dims", "False")
        )
        self.PREVIEW__JPG__ALLOWED_DIMS = string_to_unique_item_list(
            self.get_raw_config("preview.jpg.allowed_dims", "256x256"),
            cast_func=PreviewDim.from_string,
            separator=",",
        )

        self.FRONTEND__SERVE = asbool(self.get_raw_config("frontend.serve", "True"))
        # INFO - G.M - 2018-08-06 - we pretend that frontend_dist_folder
        # is probably in frontend subfolder
        # of tracim parent of both backend and frontend
        backend_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        tracim_folder = os.path.dirname(backend_folder)
        backend_i18n_folder = os.path.join(backend_folder, "tracim_backend", "locale")

        self.FRONTEND__CACHE_TOKEN = self.get_raw_config(
            "frontend.cache_token", get_cache_token(os.path.abspath(__file__))
        )

        self.BACKEND__I18N_FOLDER_PATH = self.get_raw_config(
            "backend.i18n_folder_path", backend_i18n_folder
        )

        frontend_dist_folder = os.path.join(tracim_folder, "frontend", "dist")
        self.FRONTEND__DIST_FOLDER_PATH = self.get_raw_config(
            "frontend.dist_folder_path", frontend_dist_folder
        )
        default_plugin_folder_path = self.here_macro_replace("%(here)s/plugins")
        self.PLUGIN__FOLDER_PATH = self.get_raw_config(
            "plugin.folder_path", default_plugin_folder_path
        )

        self.FRONTEND__CUSTOM_TOOLBOX_FOLDER_PATH = self.get_raw_config(
            "frontend.custom_toolbox_folder_path", None
        )

    def __load_uploaded_files_config(self) -> None:
        default_depot_storage_path = self.here_macro_replace("%(here)s/depot")
        self.DEPOT_STORAGE_DIR = self.get_raw_config(
            "depot_storage_dir", default_depot_storage_path, deprecated=True
        )
        self.DEPOT_STORAGE_NAME = self.get_raw_config(
            "depot_storage_name", "tracim", deprecated=True
        )
        self.UPLOADED_FILES__STORAGE__STORAGE_NAME = self.get_raw_config(
            "uploaded_files.storage.storage_name", self.DEPOT_STORAGE_NAME
        )
        self.UPLOADED_FILES__STORAGE__STORAGE_TYPE = self.get_raw_config(
            "uploaded_files.storage.storage_type", "local"
        )
        # Local file parameters
        self.UPLOADED_FILES__STORAGE__LOCAL__STORAGE_PATH = self.get_raw_config(
            "uploaded_files.storage.local.storage_path", self.DEPOT_STORAGE_DIR
        )
        # S3 parameters
        self.UPLOADED_FILES__STORAGE__S3__ACCESS_KEY_ID = self.get_raw_config(
            "uploaded_files.storage.s3.access_key_id", secret=True
        )
        self.UPLOADED_FILES__STORAGE__S3__SECRET_ACCESS_KEY = self.get_raw_config(
            "uploaded_files.storage.s3.secret_access_key", secret=True
        )
        self.UPLOADED_FILES__STORAGE__S3__POLICY = self.get_raw_config(
            "uploaded_files.storage.s3.policy"
        )
        self.UPLOADED_FILES__STORAGE__S3__ENDPOINT_URL = self.get_raw_config(
            "uploaded_files.storage.s3.endpoint_url"
        )
        self.UPLOADED_FILES__STORAGE__S3__BUCKET = self.get_raw_config(
            "uploaded_files.storage.s3.bucket"
        )
        self.UPLOADED_FILES__STORAGE__S3__REGION_NAME = self.get_raw_config(
            "uploaded_files.storage.s3.region_name"
        )
        self.UPLOADED_FILES__STORAGE__S3__STORAGE_CLASS = self.get_raw_config(
            "uploaded_files.storage.s3.storage_class"
        )

    def _load_live_messages_config(self) -> None:
        self.LIVE_MESSAGES__CONTROL_ZMQ_URI = self.get_raw_config(
            "live_messages.control_zmq_uri", "tcp://localhost:5563"
        )
        async_processing = str(self.JOBS__PROCESSING_MODE == self.CST.ASYNC)
        self.LIVE_MESSAGES__BLOCKING_PUBLISH = asbool(
            self.get_raw_config("live_messages.blocking_publish", async_processing)
        )

    def _load_limitation_config(self) -> None:
        self.LIMITATION__SHAREDSPACE_PER_USER = int(
            self.get_raw_config("limitation.sharedspace_per_user", "0")
        )
        self.LIMITATION__CONTENT_LENGTH_FILE_SIZE = int(
            self.get_raw_config("limitation.content_length_file_size", "0")
        )
        self.LIMITATION__WORKSPACE_SIZE = int(self.get_raw_config("limitation.workspace_size", "0"))
        self.LIMITATION__USER_DEFAULT_ALLOWED_SPACE = int(
            self.get_raw_config("limitation.user_default_allowed_space", "0")
        )

    def _load_email_config(self) -> None:
        """
        Load config for email related stuff
        """
        # TODO - G.M - 27-03-2018 - [Email] Restore email config
        ###
        # EMAIL related stuff (notification, reply)
        ##
        self.EMAIL__NOTIFICATION__ENABLED_ON_INVITATION = asbool(
            self.get_raw_config("email.notification.enabled_on_invitation", "True")
        )

        # TODO - G.M - 2019-04-05 - keep as parameters
        # or set it as constant,
        # see https://github.com/tracim/tracim/issues/1569
        self.EMAIL__NOTIFICATION__NOTIFIED_EVENTS = [
            ActionDescription.COMMENT,
            ActionDescription.CREATION,
            ActionDescription.EDITION,
            ActionDescription.REVISION,
            ActionDescription.STATUS_UPDATE,
        ]
        # TODO - G.M - 2019-04-04 - need to be better handled:
        # dynamic default value and allow user to set this value.
        # see :https://github.com/tracim/tracim/issues/1555
        self.EMAIL__NOTIFICATION__NOTIFIED_CONTENTS = [
            "html-document",
            "thread",
            "file",
            "comment",
            # 'folder' --folder is skipped
        ]

        self.EMAIL__NOTIFICATION__FROM__EMAIL = self.get_raw_config("email.notification.from.email")

        self.EMAIL__NOTIFICATION__FROM__DEFAULT_LABEL = self.get_raw_config(
            "email.notification.from.default_label", "Tracim Notifications"
        )
        self.EMAIL__NOTIFICATION__REPLY_TO__EMAIL = self.get_raw_config(
            "email.notification.reply_to.email"
        )
        self.EMAIL__NOTIFICATION__REFERENCES__EMAIL = self.get_raw_config(
            "email.notification.references.email"
        )
        # Content update notification
        template_dir = self.here_macro_replace("%(here)s/tracim_backend/templates/mail")
        self.EMAIL__NOTIFICATION__CONTENT_UPDATE__TEMPLATE__HTML = self.get_raw_config(
            "email.notification.content_update.template.html",
            "{}/{}".format(template_dir, "content_update_body_html.mak"),
        )

        self.EMAIL__NOTIFICATION__CONTENT_UPDATE__SUBJECT = self.get_raw_config(
            "email.notification.content_update.subject",
            _("[{website_title}] [{workspace_label}] {content_label} ({content_status_label})"),
        )
        # Created account notification
        self.EMAIL__NOTIFICATION__CREATED_ACCOUNT__TEMPLATE__HTML = self.get_raw_config(
            "email.notification.created_account.template.html",
            "{}/{}".format(template_dir, "created_account_body_html.mak"),
        )
        self.EMAIL__NOTIFICATION__CREATED_ACCOUNT__SUBJECT = self.get_raw_config(
            "email.notification.created_account.subject",
            _("[{website_title}] Someone created an account for you"),
        )

        # Reset password notification
        self.EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__TEMPLATE__HTML = self.get_raw_config(
            "email.notification.reset_password_request.template.html",
            "{}/{}".format(template_dir, "reset_password_body_html.mak"),
        )
        self.EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__SUBJECT = self.get_raw_config(
            "email.notification.reset_password_request.subject",
            _("[{website_title}] A password reset has been requested"),
        )

        # TODO - G.M - 2019-01-22 - add feature to process notification email
        # asynchronously see issue https://github.com/tracim/tracim/issues/1345
        self.EMAIL__NOTIFICATION__ACTIVATED = asbool(
            self.get_raw_config("email.notification.activated", "False")
        )

        self.EMAIL__NOTIFICATION__SMTP__SERVER = self.get_raw_config(
            "email.notification.smtp.server"
        )
        self.EMAIL__NOTIFICATION__SMTP__PORT = self.get_raw_config("email.notification.smtp.port")
        self.EMAIL__NOTIFICATION__SMTP__USER = self.get_raw_config("email.notification.smtp.user")
        self.EMAIL__NOTIFICATION__SMTP__PASSWORD = self.get_raw_config(
            "email.notification.smtp.password", secret=True
        )
        self.EMAIL__NOTIFICATION__SMTP__USE_IMPLICIT_SSL = asbool(
            self.get_raw_config("email.notification.smtp.use_implicit_ssl", "false")
        )

        self.EMAIL__REPLY__ACTIVATED = asbool(self.get_raw_config("email.reply.activated", "False"))

        self.EMAIL__REPLY__IMAP__SERVER = self.get_raw_config("email.reply.imap.server")
        self.EMAIL__REPLY__IMAP__PORT = self.get_raw_config("email.reply.imap.port")
        self.EMAIL__REPLY__IMAP__USER = self.get_raw_config("email.reply.imap.user")
        self.EMAIL__REPLY__IMAP__PASSWORD = self.get_raw_config(
            "email.reply.imap.password", secret=True
        )
        self.EMAIL__REPLY__IMAP__FOLDER = self.get_raw_config("email.reply.imap.folder", "INBOX")
        self.EMAIL__REPLY__CHECK__HEARTBEAT = int(
            self.get_raw_config("email.reply.check.heartbeat", "60")
        )
        self.EMAIL__REPLY__IMAP__USE_SSL = asbool(
            self.get_raw_config("email.reply.imap.use_ssl", "True")
        )
        self.EMAIL__REPLY__IMAP__USE_IDLE = asbool(
            self.get_raw_config("email.reply.imap.use_idle", "False")
        )
        self.EMAIL__REPLY__CONNECTION__MAX_LIFETIME = int(
            self.get_raw_config("email.reply.connection.max_lifetime", "600")  # 10 minutes
        )
        self.EMAIL__REPLY__USE_HTML_PARSING = asbool(
            self.get_raw_config("email.reply.use_html_parsing", "True")
        )
        self.EMAIL__REPLY__USE_TXT_PARSING = asbool(
            self.get_raw_config("email.reply.use_txt_parsing", "True")
        )
        self.EMAIL__REPLY__LOCKFILE_PATH = self.get_raw_config(
            "email.reply.lockfile_path", self.here_macro_replace("%(here)s/email_fetcher.lock"),
        )
        self.NEW_USER__INVITATION__DO_NOTIFY = asbool(
            self.get_raw_config("new_user.invitation.do_notify", "True")
        )

        self.NEW_USER__INVITATION__MINIMAL_PROFILE = self.get_raw_config(
            "new_user.invitation.minimal_profile", Profile.TRUSTED_USER.slug
        )

        self.EMAIL__REQUIRED = asbool(self.get_raw_config("email.required", "True"))

    def _load_webdav_config(self) -> None:
        """
        load config for webdav related stuff
        """
        tracim_website = "http://tracim.fr/"
        tracim_name = "Tracim"
        wsgidav_website = "https://github.com/mar10/wsgidav/"
        wsgidav_name = "WsgiDAV"

        self.WEBDAV__UI__ENABLED = asbool(self.get_raw_config("webdav.ui.enabled", "True"))
        self.WEBDAV__BASE_URL = self.get_raw_config("webdav.base_url", "http://localhost:3030")
        self.WEBDAV__VERBOSE__LEVEL = int(self.get_raw_config("webdav.verbose.level", "1"))
        self.WEBDAV__ROOT_PATH = self.get_raw_config("webdav.root_path", "/")
        self.WEBDAV__BLOCK_SIZE = int(self.get_raw_config("webdav.block_size", "8192"))
        self.WEBDAV__DIR_BROWSER__ENABLED = asbool(
            self.get_raw_config("webdav.dir_browser.enabled", "True")
        )
        default_webdav_footnote = (
            '<a href="{instance_url}">{instance_name}</a>.'
            " This Webdav is serve by"
            ' <a href="{tracim_website}">{tracim_name} software</a> using'
            ' <a href="{wsgidav_website}">{wsgidav_name}</a>.'.format(
                instance_name=self.WEBSITE__TITLE,
                instance_url=self.WEBSITE__BASE_URL,
                tracim_name=tracim_name,
                tracim_website=tracim_website,
                wsgidav_name=wsgidav_name,
                wsgidav_website=wsgidav_website,
            )
        )
        self.WEBDAV__DIR_BROWSER__FOOTER = self.get_raw_config(
            "webdav.dir_browser.footer", default_webdav_footnote
        )
        # TODO : check if tweaking those param does work

        # TODO - G.M - 2019-04-05 - keep as parameters
        # or set it as constant,
        # see https://github.com/tracim/tracim/issues/1569
        self.WEBDAV_MANAGE_LOCK = True

    def _load_ldap_config(self) -> None:
        """
        Load config for ldap related stuff
        """
        self.LDAP_URL = self.get_raw_config("ldap_url", "ldap://localhost:389")
        self.LDAP_BIND_DN = self.get_raw_config("ldap_bind_dn")
        self.LDAP_BIND_PASS = self.get_raw_config("ldap_bind_pass", secret=True)
        self.LDAP_TLS = asbool(self.get_raw_config("ldap_tls", "False"))
        self.LDAP_USER_BASE_DN = self.get_raw_config("ldap_user_base_dn")
        self.LDAP_LOGIN_ATTRIBUTE = self.get_raw_config("ldap_login_attribute", "mail")
        # TODO - G.M - 16-11-2018 - Those prams are only use at account creation
        self.LDAP_NAME_ATTRIBUTE = self.get_raw_config("ldap_name_attribute", "givenName")
        # TODO - G.M - 2018-12-05 - [ldap_profile]
        # support for profile attribute disabled
        # Should be reenabled later probably with a better code
        # self.LDAP_PROFILE_ATTR = self.get_raw_config('ldap_profile_attribute')

        # TODO - G.M - 2019-04-05 - keep as parameters
        # or set it as constant,
        # see https://github.com/tracim/tracim/issues/1569
        self.LDAP_USER_FILTER = "({}=%(login)s)".format(self.LDAP_LOGIN_ATTRIBUTE)
        self.LDAP_USE_POOL = True
        self.LDAP_POOL_SIZE = 10 if self.LDAP_USE_POOL else None
        self.LDAP_POOL_LIFETIME = 3600 if self.LDAP_USE_POOL else None
        self.LDAP_GET_INFO = None

    def _load_search_config(self):
        self.SEARCH__ENGINE = self.get_raw_config("search.engine", "simple")
        self.SEARCH__ELASTICSEARCH__INDEX_ALIAS_PREFIX = self.get_raw_config(
            "search.elasticsearch.index_alias_prefix"
        )
        default_index_documents_pattern_template = "{index_alias}-{date}"
        self.SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE = self.get_raw_config(
            "search.elasticsearch.index_pattern_template", default_index_documents_pattern_template,
        )
        self.SEARCH__ELASTICSEARCH__USE_INGEST = asbool(
            self.get_raw_config("search.elasticsearch.use_ingest", "False")
        )
        # FIXME - G.M - 2019-05-31 - limit default allowed mimetype to useful list instead of
        allowed_ingest_default_mimetype = ""
        self.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST = string_to_unique_item_list(
            self.get_raw_config(
                "search.elasticsearch.ingest.mimetype_whitelist", allowed_ingest_default_mimetype,
            ),
            separator=",",
            cast_func=str,
            do_strip=True,
        )
        self.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_BLACKLIST = string_to_unique_item_list(
            self.get_raw_config("search.elasticsearch.ingest.mimetype_blacklist", ""),
            separator=",",
            cast_func=str,
            do_strip=True,
        )
        self.SEARCH__ELASTICSEARCH__INGEST__SIZE_LIMIT = int(
            self.get_raw_config("search.elasticsearch.ingest.size_limit", "52428800")
        )
        self.SEARCH__ELASTICSEARCH__HOST = self.get_raw_config(
            "search.elasticsearch.host", "localhost"
        )
        self.SEARCH__ELASTICSEARCH__PORT = int(
            self.get_raw_config("search.elasticsearch.port", "9200")
        )
        self.SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT = int(
            self.get_raw_config("search.elasticsearch.request_timeout", "60")
        )

    def _load_jobs_config(self) -> None:
        self.JOBS__PROCESSING_MODE = self.get_raw_config("jobs.processing_mode", "sync").upper()
        self.JOBS__ASYNC__REDIS__HOST = self.get_raw_config("jobs.async.redis.host", "localhost")
        self.JOBS__ASYNC__REDIS__PORT = int(self.get_raw_config("jobs.async.redis.port", "6379"))
        self.JOBS__ASYNC__REDIS__DB = int(self.get_raw_config("jobs.async.redis.db", "0"))

    def _load_content_security_policy_config(self) -> None:
        prefix = "content_security_policy"
        self.CONTENT_SECURITY_POLICY__ENABLED = asbool(
            self.get_raw_config("{}.enabled".format(prefix), "True")
        )
        self.CONTENT_SECURITY_POLICY__REPORT_URI = self.get_raw_config(
            "{}.report_uri".format(prefix), None
        )
        self.CONTENT_SECURITY_POLICY__REPORT_ONLY = asbool(
            self.get_raw_config("{}.report_only".format(prefix), "False")
        )
        self.CONTENT_SECURITY_POLICY__ADDITIONAL_DIRECTIVES = self.get_raw_config(
            "{}.additional_directives".format(prefix), ""
        )

    # INFO - G.M - 2019-04-05 - Config validation methods

    def check_config_validity(self) -> None:
        """
        Check if config setted is correct
        """
        self._check_global_config_validity()
        self._check_uploaded_files_config_validity()
        self._check_live_messages_config_validity()
        self._check_jobs_config_validity()
        self._check_email_config_validity()
        self._check_ldap_config_validity()
        self._check_search_config_validity()
        self._check_webdav_config_validity()
        self._check_content_security_policy_validity()

        app_lib = ApplicationApi(app_list=app_list)
        for app in app_lib.get_all():
            app.check_config(self)

        self.configure_translations()

    def _check_global_config_validity(self) -> None:
        """
        Check config for global stuff
        """
        self.check_mandatory_param("SQLALCHEMY__URL", self.SQLALCHEMY__URL)
        self.check_mandatory_param("SESSION__TYPE", self.SESSION__TYPE)
        if self.SESSION__TYPE == "file":
            self.check_mandatory_param(
                "SESSION__DATA_DIR", self.SESSION__DATA_DIR, when_str="if session type is file",
            )
            self.check_directory_path_param(
                "SESSION__DATA_DIR", self.SESSION__DATA_DIR, writable=True
            )
        elif self.SESSION__TYPE in [
            "ext:database",
            "ext:mongodb",
            "ext:redis",
            "ext:memcached",
        ]:
            self.check_mandatory_param(
                "SESSION__URL",
                self.SESSION__URL,
                when_str="if session type is {}".format(self.SESSION__TYPE),
            )
        self.check_mandatory_param("SESSION__LOCK_DIR", self.SESSION__LOCK_DIR)
        self.check_directory_path_param("SESSION__LOCK_DIR", self.SESSION__LOCK_DIR, writable=True)

        if not self.SESSION__SECURE and self.API__BASE_URL.startswith("https://"):
            logger.warning(
                self,
                "session.secure option not enabled but api base url is using HTTPS, we strongly recommend you to activate this "
                "options if you are using HTTPS".format(),
            )
        if not self.SESSION__HTTPONLY:
            logger.warning(
                self,
                '"session.httponly" parameter disabled, this is unsafe. We strongly recommend to enable it.',
            )
        # INFO - G.M - 2019-04-03 - check color file validity
        self.check_mandatory_param("COLOR__CONFIG_FILE_PATH", self.COLOR__CONFIG_FILE_PATH)
        self.check_file_path_param(
            "COLOR__CONFIG_FILE_PATH", self.COLOR__CONFIG_FILE_PATH, readable=True
        )
        self.APPS_COLORS = self.load_and_check_json_file_path_param(
            "COLOR__CONFIG_FILE_PATH", self.COLOR__CONFIG_FILE_PATH,
        )

        try:
            self.APPS_COLORS["primary"]
        except KeyError as e:
            raise ConfigurationError(
                "Error: primary color is required in {} file".format(self.COLOR__CONFIG_FILE_PATH)
            ) from e

        self.check_mandatory_param("PREVIEW_CACHE_DIR", self.PREVIEW_CACHE_DIR)
        self.check_directory_path_param("PREVIEW_CACHE_DIR", self.PREVIEW_CACHE_DIR, writable=True)

        if AuthType.REMOTE is self.AUTH_TYPES:
            raise ConfigurationError(
                'ERROR: "remote" auth not allowed in auth_types'
                " list, use remote_user_header instead"
            )

        self.check_mandatory_param("WEBSITE__BASE_URL", self.WEBSITE__BASE_URL)
        self.check_https_url_path("WEBSITE__BASE_URL", self.WEBSITE__BASE_URL)
        self.check_mandatory_param("API__BASE_URL", self.API__BASE_URL)
        self.check_https_url_path("API__BASE_URL", self.API__BASE_URL)
        self.check_mandatory_param("BACKEND__I18N_FOLDER_PATH", self.BACKEND__I18N_FOLDER_PATH)
        self.check_directory_path_param(
            "BACKEND__I18N_FOLDER_PATH", self.BACKEND__I18N_FOLDER_PATH, readable=True
        )

        # INFO - G.M - 2018-08-06 - We check dist folder existence
        if self.FRONTEND__SERVE:
            self.check_mandatory_param(
                "FRONTEND__DIST_FOLDER_PATH",
                self.FRONTEND__DIST_FOLDER_PATH,
                when_str="if frontend serving is activated",
            )
            self.check_directory_path_param(
                "FRONTEND__DIST_FOLDER_PATH", self.FRONTEND__DIST_FOLDER_PATH
            )

        if self.USER__DEFAULT_PROFILE not in Profile.get_all_valid_slugs():
            profile_str_list = ", ".join(
                ['"{}"'.format(profile_name) for profile_name in Profile.get_all_valid_slugs()]
            )
            raise ConfigurationError(
                'ERROR user.default_profile given "{}" is invalid,'
                "valids values are {}.".format(self.USER__DEFAULT_PROFILE, profile_str_list)
            )

        json_schema = {}
        ui_schema = {}
        if self.USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH:
            self.check_file_path_param(
                "USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH",
                self.USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH,
                readable=True,
            )
            json_schema = self.load_and_check_json_file_path_param(
                "USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH",
                self.USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH,
            )
            try:
                # INFO - G.M - 2021-01-13 Check here schema with jsonschema meta-schema to:
                # - prevent an invalid json-schema
                # - ensure that validation of content will not failed due to invalid schema.
                cls = validator_for(json_schema)
                cls.check_schema(json_schema)
            except SchemaError as exc:
                raise ConfigurationError(
                    'ERROR  "{}" is not a valid JSONSchema : {}'.format(
                        "USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH", str(exc)
                    )
                ) from exc

        if self.USER__CUSTOM_PROPERTIES__UI_SCHEMA_FILE_PATH:
            self.check_file_path_param(
                "USER__CUSTOM_PROPERTIES__UI_SCHEMA_FILE_PATH",
                self.USER__CUSTOM_PROPERTIES__UI_SCHEMA_FILE_PATH,
                readable=True,
            )
            ui_schema = self.load_and_check_json_file_path_param(
                "USER__CUSTOM_PROPERTIES__UI_SCHEMA_FILE_PATH",
                self.USER__CUSTOM_PROPERTIES__UI_SCHEMA_FILE_PATH,
            )

        if self.USER__CUSTOM_PROPERTIES__TRANSLATIONS_DIR_PATH:
            self.check_directory_path_param(
                "USER__CUSTOM_PROPERTIES__TRANSLATIONS_DIR_PATH",
                self.USER__CUSTOM_PROPERTIES__TRANSLATIONS_DIR_PATH,
                readable=True,
                writable=False,
            )

        self.USER__CUSTOM_PROPERTIES__JSON_SCHEMA = json_schema
        self.USER__CUSTOM_PROPERTIES__UI_SCHEMA = ui_schema

    def _check_uploaded_files_config_validity(self) -> None:
        self.check_mandatory_param(
            "UPLOADED_FILES__STORAGE__STORAGE_NAME", self.UPLOADED_FILES__STORAGE__STORAGE_NAME
        )
        self.check_mandatory_param(
            "UPLOADED_FILES__STORAGE__STORAGE_TYPE", self.UPLOADED_FILES__STORAGE__STORAGE_TYPE
        )
        file_storage_type_slugs = [file_storage.slug for file_storage in list(DepotFileStorageType)]
        if self.UPLOADED_FILES__STORAGE__STORAGE_TYPE not in file_storage_type_slugs:
            file_storage_str_list = ", ".join(
                ['"{}"'.format(slug) for slug in file_storage_type_slugs]
            )
            raise ConfigurationError(
                'ERROR uploaded_files.storage.storage_type given "{}" is invalid,'
                "valids values are {}.".format(
                    self.UPLOADED_FILES__STORAGE__STORAGE_TYPE, file_storage_str_list
                )
            )
        if self.UPLOADED_FILES__STORAGE__STORAGE_TYPE == DepotFileStorageType.LOCAL.slug:
            self.check_mandatory_param(
                "UPLOADED_FILES__STORAGE__STORAGE_PATH",
                self.UPLOADED_FILES__STORAGE__LOCAL__STORAGE_PATH,
                when_str='if storage type is "{}"'.format(
                    self.UPLOADED_FILES__STORAGE__STORAGE_TYPE
                ),
            )
            self.check_directory_path_param(
                "UPLOADED_FILES__STORAGE__LOCAL__STORAGE_PATH",
                self.UPLOADED_FILES__STORAGE__LOCAL__STORAGE_PATH,
                writable=True,
            )
        if self.UPLOADED_FILES__STORAGE__STORAGE_TYPE == DepotFileStorageType.S3.slug:
            self.check_mandatory_param(
                "UPLOADED_FILES__STORAGE__S3__ACCESS_KEY_ID",
                self.UPLOADED_FILES__STORAGE__S3__ACCESS_KEY_ID,
                when_str='if storage type is "{}"'.format(
                    self.UPLOADED_FILES__STORAGE__STORAGE_TYPE
                ),
            )
            self.check_mandatory_param(
                "UPLOADED_FILES__STORAGE__S3__SECRET_ACCESS_KEY",
                self.UPLOADED_FILES__STORAGE__S3__SECRET_ACCESS_KEY,
                when_str='if storage type is "{}"'.format(
                    self.UPLOADED_FILES__STORAGE__STORAGE_TYPE
                ),
            )

    def _check_live_messages_config_validity(self) -> None:
        self.check_mandatory_param(
            "LIVE_MESSAGES__CONTROL_ZMQ_URI", self.LIVE_MESSAGES__CONTROL_ZMQ_URI
        )

    def _check_email_config_validity(self) -> None:
        """
        Check if config is correctly setted for email features
        """
        if not self.EMAIL__NOTIFICATION__ACTIVATED:
            logger.warning(
                self,
                "Notification by email mechanism is disabled! "
                "Notification and mail invitation mechanisms will not work.",
            )

        if not self.EMAIL__REPLY__LOCKFILE_PATH and self.EMAIL__REPLY__ACTIVATED:
            self.check_mandatory_param(
                "EMAIL__REPLY__LOCKFILE_PATH",
                self.EMAIL__REPLY__LOCKFILE_PATH,
                when_str="when email reply is activated",
            )

        if self.EMAIL__REPLY__ACTIVATED:
            # INFO - G.M - 2019-12-10 - check imap config provided
            self.check_mandatory_param(
                "EMAIL__REPLY__IMAP__SERVER",
                self.EMAIL__REPLY__IMAP__SERVER,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__REPLY__IMAP__PORT",
                self.EMAIL__REPLY__IMAP__PORT,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__REPLY__IMAP__USER",
                self.EMAIL__REPLY__IMAP__USER,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__REPLY__IMAP__PASSWORD",
                self.EMAIL__REPLY__IMAP__PASSWORD,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__REPLY__IMAP__FOLDER",
                self.EMAIL__REPLY__IMAP__FOLDER,
                when_str="when email notification is activated",
            )

        if self.EMAIL__NOTIFICATION__ACTIVATED:
            # INFO - G.M - 2019-12-10 - check smtp config provided
            self.check_mandatory_param(
                "EMAIL__NOTIFICATION__SMTP__SERVER",
                self.EMAIL__NOTIFICATION__SMTP__SERVER,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__NOTIFICATION__SMTP__PORT",
                self.EMAIL__NOTIFICATION__SMTP__PORT,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__NOTIFICATION__SMTP__USER",
                self.EMAIL__NOTIFICATION__SMTP__USER,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__NOTIFICATION__SMTP__PASSWORD",
                self.EMAIL__NOTIFICATION__SMTP__PASSWORD,
                when_str="when email notification is activated",
            )
            # INFO - G.M - 2019-12-10 - check value provided for headers
            self.check_mandatory_param(
                "EMAIL__NOTIFICATION__FROM__EMAIL",
                self.EMAIL__NOTIFICATION__FROM__EMAIL,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__NOTIFICATION__FROM__DEFAULT_LABEL",
                self.EMAIL__NOTIFICATION__FROM__DEFAULT_LABEL,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__NOTIFICATION__REPLY_TO__EMAIL",
                self.EMAIL__NOTIFICATION__REPLY_TO__EMAIL,
                when_str="when email notification is activated",
            )
            self.check_mandatory_param(
                "EMAIL__NOTIFICATION__REFERENCES__EMAIL",
                self.EMAIL__NOTIFICATION__REFERENCES__EMAIL,
                when_str="when email notification is activated",
            )
            # INFO - G.M - 2019-02-01 - check if template are available,
            # do not allow running with email_notification_activated
            # if templates needed are not available
            templates = {
                "content_update notification": self.EMAIL__NOTIFICATION__CONTENT_UPDATE__TEMPLATE__HTML,
                "created account": self.EMAIL__NOTIFICATION__CREATED_ACCOUNT__TEMPLATE__HTML,
                "password reset": self.EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__TEMPLATE__HTML,
            }
            for template_description, template_path in templates.items():
                if not template_path or not os.path.isfile(template_path):
                    raise ConfigurationError(
                        "ERROR: email template for {template_description} "
                        'not found at "{template_path}."'.format(
                            template_description=template_description, template_path=template_path,
                        )
                    )

    def _check_jobs_config_validity(self) -> None:
        if self.JOBS__PROCESSING_MODE not in (self.CST.ASYNC, self.CST.SYNC):
            raise Exception(
                "JOBS__PROCESSING_MODE "
                "can "
                'be "{}" or "{}", not "{}"'.format(
                    self.CST.ASYNC, self.CST.SYNC, self.JOBS__PROCESSING_MODE
                )
            )

    def _check_ldap_config_validity(self):
        if AuthType.LDAP in self.AUTH_TYPES:
            self.check_mandatory_param(
                "LDAP_URL", self.LDAP_URL, when_str="when ldap is in available auth method",
            )
            self.check_mandatory_param(
                "LDAP_BIND_DN", self.LDAP_BIND_DN, when_str="when ldap is in available auth method",
            )
            self.check_mandatory_param(
                "LDAP_BIND_PASS",
                self.LDAP_BIND_PASS,
                when_str="when ldap is in available auth method",
            )
            self.check_mandatory_param(
                "LDAP_USER_BASE_DN",
                self.LDAP_USER_BASE_DN,
                when_str="when ldap is in available auth method",
            )
            self.check_mandatory_param(
                "LDAP_LOGIN_ATTRIBUTE",
                self.LDAP_LOGIN_ATTRIBUTE,
                when_str="when ldap is in available auth method",
            )
            self.check_mandatory_param(
                "LDAP_NAME_ATTRIBUTE",
                self.LDAP_NAME_ATTRIBUTE,
                when_str="when ldap is in available auth method",
            )

    def _check_search_config_validity(self):
        search_engine_valid = ["elasticsearch", "simple"]
        if self.SEARCH__ENGINE not in search_engine_valid:

            search_engine_list_str = ", ".join(
                '"{}"'.format(engine) for engine in search_engine_valid
            )
            raise ConfigurationError(
                "ERROR: SEARCH__ENGINE valid values are {}.".format(search_engine_list_str)
            )
        # FIXME - G.M - 2019-06-07 - hack to force index document alias check validity
        # see https://github.com/tracim/tracim/issues/1835
        if self.SEARCH__ENGINE == "elasticsearch":
            self.check_mandatory_param(
                "SEARCH__ELASTICSEARCH__INDEX_ALIAS_PREFIX",
                self.SEARCH__ELASTICSEARCH__INDEX_ALIAS_PREFIX,
                when_str="if elasticsearch search feature is enabled",
            )

    def _check_webdav_config_validity(self):
        self.check_mandatory_param("WEBDAV__BASE_URL", self.WEBDAV__BASE_URL)
        self.check_https_url_path("WEBDAV__BASE_URL", self.WEBDAV__BASE_URL)

    def _check_content_security_policy_validity(self) -> None:
        if self.CONTENT_SECURITY_POLICY__ENABLED and self.CONTENT_SECURITY_POLICY__REPORT_ONLY:
            self.check_mandatory_param(
                "CONTENT_SECURITY_POLICY__REPORT_URI",
                self.CONTENT_SECURITY_POLICY__REPORT_URI,
                when_str="if content_security_policy.report_only is enabled",
            )

    # INFO - G.M - 2019-04-05 - Others methods
    def _check_consistency(self):
        """
        Verify all config_name_attribute are correctly associated with
        a true cfg attribute. Will raise AttributeError if not.
        """
        for config_param in self.config_info:
            try:
                getattr(self, config_param.config_name)
            except AttributeError:
                raise ConfigCodeError(
                    "config file source code is not correct (see config.py file)"
                    " When using self.get_raw_config in CFG, you should use proper"
                    " naming between config file param and config param.\n"
                    "use : self.{} = self.get_raw_config({})".format(
                        config_param.config_name, config_param.config_file_name
                    )
                )

    def configure_translations(self):
        self.TRANSLATIONS = {}
        Translator.init_translations(self)

    def configure_filedepot(self) -> None:

        # TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
        # of tracim_backend, Be careful DepotManager is a Singleton!

        if self.UPLOADED_FILES__STORAGE__STORAGE_TYPE == DepotFileStorageType.LOCAL.slug:
            uploaded_files_settings = {
                "depot.backend": DepotFileStorageType.LOCAL.depot_storage_backend,
                "depot.storage_path": self.UPLOADED_FILES__STORAGE__LOCAL__STORAGE_PATH,
            }
        elif self.UPLOADED_FILES__STORAGE__STORAGE_TYPE == DepotFileStorageType.S3.slug:
            uploaded_files_settings = {
                "depot.backend": DepotFileStorageType.S3.depot_storage_backend,
                "depot.access_key_id": self.UPLOADED_FILES__STORAGE__S3__ACCESS_KEY_ID,
                "depot.secret_access_key": self.UPLOADED_FILES__STORAGE__S3__SECRET_ACCESS_KEY,
                "depot.policy": self.UPLOADED_FILES__STORAGE__S3__POLICY,
                "depot.endpoint_url": self.UPLOADED_FILES__STORAGE__S3__ENDPOINT_URL,
                "depot.bucket": self.UPLOADED_FILES__STORAGE__S3__BUCKET,
                "depot.region_name": self.UPLOADED_FILES__STORAGE__S3__REGION_NAME,
                "depot.storage_class": self.UPLOADED_FILES__STORAGE__S3__STORAGE_CLASS,
            }
        else:
            uploaded_files_settings = {
                "depot.backend": DepotFileStorageType.MEMORY.depot_storage_backend
            }

        DepotManager.configure(
            name=self.UPLOADED_FILES__STORAGE__STORAGE_NAME,
            config=uploaded_files_settings,
            prefix="depot.",
        )

    class CST(object):
        ASYNC = "ASYNC"
        SYNC = "SYNC"

    def check_mandatory_param(self, param_name: str, value: typing.Any, when_str: str = "") -> None:
        """
        Check if param value is not falsy value, if falsy, raise ConfigurationError
        :param param_name: name of the parameter
        :param value: value to check for parameter
        :param when_str: condition string to explain when parameter is mandatory
        """
        if not value:
            raise ConfigurationError(
                'ERROR: "{}" configuration is mandatory {when_str}.'
                "Set it before continuing.".format(param_name, when_str=when_str)
            )

    def check_https_url_path(
        self, param_name: str, value: typing.Any, extended_str: str = ""
    ) -> None:
        if not isinstance(value, str) or not value.startswith("https://"):
            logger.warning(
                self,
                'parameter "{}"  value "{}" is not set with an https url, this either mean a mistake '
                "or a that you are running tracim with an unsafe configuration. HTTPS is strongly recommended "
                "for tracim for security reasons.{}".format(param_name, value, extended_str),
            )

    def load_and_check_json_file_path_param(self, param_name: str, path: str,) -> dict:
        """
        Check if path is valid json file and load it
        :param param_name: name of parameter to check
        :param path: path (value of parameter) which is check as a file path
        :return: json content as dictionnary
        """
        try:
            with open(path) as json_file:
                return json.load(json_file)
        except json.JSONDecodeError as exc:
            not_a_valid_json_file_msg = (
                'ERROR: "{}" is not a valid json file path, '
                'change "{}" content '
                "to a valid json content."
            )
            raise ConfigurationError(not_a_valid_json_file_msg.format(path, param_name)) from exc

    def check_file_path_param(self, param_name: str, path: str, readable: bool = True,) -> None:
        """
        Check if path exist and if it is a readable file.
        if check fail, raise ConfigurationError
        :param param_name: name of parameter to check
        :param path: path (value of parameter) which is check as a file path
        :param readable: check if directory(according to path) is readable
        """
        try:
            is_file_exist(path)
            if readable:
                is_file_readable(path)
        except NotAFileError as exc:
            not_a_file_msg = (
                'ERROR: "{}" is not a valid file path, '
                'create it or change "{}" value in config '
                "to a valid file path."
            )
            raise ConfigurationError(not_a_file_msg.format(path, param_name)) from exc
        except NotReadableFile as exc:
            file_not_writable_msg = (
                "ERROR: current user as not enough right to read and/or open"
                ' "{}" file.'
                " Change permission of current user on this file,"
                " change user running this code or change"
                ' file path of parameter in config "{}" to solve this.'
            )
            raise ConfigurationError(file_not_writable_msg.format(path, param_name)) from exc

    def check_directory_path_param(
        self, param_name: str, path: str, writable: bool = False, readable: bool = True
    ) -> None:
        """
        Check if path exist, if it is a directory and if it is readable/writable.
        if check fail, raise ConfigurationError
        :param param_name: name of parameter to check
        :param path: path (value of parameter) which is check as a directory path
        :param writable: check if directory(according to path) is writable
        :param readable: check if directory(according to path) is readable
        """
        try:
            is_dir_exist(path)
            if writable:
                is_dir_writable(path)
            if readable:
                is_dir_readable(path)
        except NotADirectoryError as exc:
            not_a_directory_msg = (
                'ERROR: "{}" is not a valid directory path, '
                'create it or change "{}" value in config '
                "to a valid directory path."
            )
            raise ConfigurationError(not_a_directory_msg.format(path, param_name)) from exc
        except NotWritableDirectory as exc:
            directory_not_writable_msg = (
                "ERROR: current user as not enough right to write and create file"
                ' into "{}" directory.'
                " Change permission of current user on this directory,"
                " change user running this code or change"
                ' directory path of parameter in config "{}" to solve this.'
            )
            raise ConfigurationError(directory_not_writable_msg.format(path, param_name)) from exc
        except NotReadableDirectory as exc:
            directory_not_writable_msg = (
                "ERROR: current user as not enough right to read and/or open"
                ' "{}" directory.'
                " Change permission of current user on this directory,"
                " change user running this code or change"
                ' directory path of parameter in config "{}" to solve this.'
            )
            raise ConfigurationError(directory_not_writable_msg.format(path, param_name)) from exc


class PreviewDim(object):
    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height

    @classmethod
    def from_string(cls, dim: str) -> "PreviewDim":
        """
        Alternative initialisation method, instead of setting width and height
        directly, we can give a valid [width]x[height] string to create
        a PreviewDim object
        """
        parts = dim.split("x")
        assert len(parts) == 2
        width, height = parts
        assert width.isdecimal()
        assert height.isdecimal()
        return PreviewDim(int(width), int(height))

    def __repr__(self):
        return "<PreviewDim width:{width} height:{height}>".format(
            width=self.width, height=self.height
        )
