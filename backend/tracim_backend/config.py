# -*- coding: utf-8 -*-
from collections import OrderedDict
import importlib
import json
import os
import typing

from depot.manager import DepotManager
from paste.deploy.converters import asbool

from tracim_backend.app_models.validator import update_validators
from tracim_backend.exceptions import ConfigCodeError
from tracim_backend.exceptions import ConfigurationError
from tracim_backend.exceptions import NotReadableDirectory
from tracim_backend.exceptions import NotWritableDirectory
from tracim_backend.extensions import app_list
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import DEFAULT_FALLBACK_LANG
from tracim_backend.lib.utils.translation import translator_marker as _
from tracim_backend.lib.utils.utils import find_direct_submodule_path
from tracim_backend.lib.utils.utils import is_dir_exist
from tracim_backend.lib.utils.utils import is_dir_readable
from tracim_backend.lib.utils.utils import is_dir_writable
from tracim_backend.lib.utils.utils import string_to_list
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Group
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import ActionDescription

ENV_VAR_PREFIX = "TRACIM_"
CONFIG_LOG_TEMPLATE = (
    "CONFIG: [ {config_source: <15} | {config_name} | {config_value} | {config_name_source} ]"
)
ID_SOURCE_ENV_VAR = "SOURCE_ENV_VAR"
ID_SOURCE_CONFIG = "SOURCE_CONFIG"
ID_SOURCE_DEFAULT = "SOURCE_DEFAULT"


class ConfigParam(object):
    def __init__(self, config_file_name):
        self.config_file_name = config_file_name
        self.config_name = self._get_associated_config_name(config_file_name)
        self.env_var_name = self._get_associated_env_var_name(self.config_name)

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


class CFG(object):
    """Object used for easy access to config file parameters."""

    def __init__(self, settings: typing.Dict[str, typing.Any]):
        # INFO - G.M - 2019-12-02 - Store own settings original dict, with copy
        # to avoid issue when serializing CFG object. settings dict is completed
        # with object in some context
        self.settings = settings.copy()
        self.config_naming = []  # type: typing.List[ConfigParam]
        logger.debug(self, "CONFIG_PROCESS:1: load config from settings")
        self.load_config()
        logger.debug(self, "CONFIG_PROCESS:2: check validity of config given")
        self._check_consistency()
        self.check_config_validity()
        logger.debug(self, "CONFIG_PROCESS:3: do post actions")
        self.do_post_check_action()

    # INFO - G.M - 2019-04-05 - Utils Methods

    def _get_printed_val_value(self, value: str, secret: bool) -> str:
        if secret:
            return "<value not shown>"
        else:
            return value

    def get_raw_config(
        self,
        config_file_name: str,
        default_value: typing.Optional[str] = None,
        secret: bool = False,
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
        :return:
        """
        param = ConfigParam(config_file_name)
        self.config_naming.append(param)
        val_cfg = self.settings.get(param.config_file_name)
        val_env = os.environ.get(param.env_var_name)
        if val_env:
            config_value = val_env
            config_source = ID_SOURCE_ENV_VAR
            config_name_source = param.env_var_name
        elif val_cfg:
            config_value = val_cfg
            config_source = ID_SOURCE_CONFIG
            config_name_source = param.config_file_name
        else:
            config_value = default_value
            config_source = ID_SOURCE_DEFAULT
            config_name_source = None

        logger.info(
            self,
            CONFIG_LOG_TEMPLATE.format(
                config_value=self._get_printed_val_value(config_value, secret),
                config_source=config_source,
                config_name=param.config_name,
                config_name_source=config_name_source,
            ),
        )
        return config_value

    # INFO - G.M - 2019-04-05 - Config loading methods

    def load_config(self) -> None:
        """Parse configuration file and env variables"""
        logger.info(
            self,
            CONFIG_LOG_TEMPLATE.format(
                config_value="<config_value>",
                config_source="<config_source>",
                config_name="<config_name>",
                config_name_source="<config_name_source>",
            ),
        )
        self._load_global_config()
        self._load_limitation_config()
        self._load_email_config()
        self._load_ldap_config()
        self._load_webdav_config()
        self._load_search_config()

        # INFO - G.M - 2019-08-08 - import app here instead of top of file,
        # to make thing easier later
        # when app will be load dynamycally.

        import tracim_backend.applications as apps_modules

        for app_config_path in find_direct_submodule_path(apps_modules):
            module = importlib.import_module("{}.config".format(app_config_path))
            module.load_config(self)

    def _load_global_config(self) -> None:
        """
        Load generic config
        """
        ###
        # General
        ###
        self.SQLALCHEMY__URL = self.get_raw_config("sqlalchemy.url", "")
        self.DEFAULT_LANG = self.get_raw_config("default_lang", DEFAULT_FALLBACK_LANG)
        backend_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        tracim_v2_folder = os.path.dirname(backend_folder)
        default_color_config_file_path = os.path.join(tracim_v2_folder, "color.json")
        self.COLOR__CONFIG_FILE_PATH = self.get_raw_config(
            "color.config_file_path", default_color_config_file_path
        )

        default_enabled_app = (
            "contents/thread,"
            "contents/file,"
            "contents/html-document,"
            "contents/folder,"
            "agenda,"
            "collaborative_document_edition,"
            "share_content,"
            "upload_permission,"
            "gallery"
        )

        self.APP__ENABLED = string_to_list(
            self.get_raw_config("app.enabled", default_enabled_app),
            separator=",",
            cast_func=str,
            do_strip=True,
        )

        self.DEPOT_STORAGE_DIR = self.get_raw_config("depot_storage_dir")
        self.DEPOT_STORAGE_NAME = self.get_raw_config("depot_storage_name")
        self.PREVIEW_CACHE_DIR = self.get_raw_config("preview_cache_dir")
        self.AUTH_TYPES = string_to_list(
            self.get_raw_config("auth_types", "internal"),
            separator=",",
            cast_func=AuthType,
            do_strip=True,
        )
        self.REMOTE_USER_HEADER = self.get_raw_config("remote_user_header", None)
        # TODO - G.M - 2018-09-11 - Deprecated param
        # self.DATA_UPDATE_ALLOWED_DURATION = int(self.get_raw_config(
        #     'content.update.allowed.duration',
        #     0,
        # ))

        self.API__KEY = self.get_raw_config("api.key", "", secret=True)
        self.SESSION__REISSUE_TIME = int(self.get_raw_config("session.reissue_time", "120"))
        self.SESSION__DATA_DIR = self.get_raw_config("session.data_dir")
        self.SESSION__LOCK_DIR = self.get_raw_config("session.lock_dir")
        self.WEBSITE__TITLE = self.get_raw_config("website.title", "TRACIM")

        # base url of the frontend
        self.WEBSITE__BASE_URL = self.get_raw_config("website.base_url", "")

        self.API__BASE_URL = self.get_raw_config("api.base_url", self.WEBSITE__BASE_URL)

        if self.API__BASE_URL != self.WEBSITE__BASE_URL:
            default_cors_allowed_origin = "{},{}".format(self.WEBSITE__BASE_URL, self.API__BASE_URL)
        else:
            default_cors_allowed_origin = self.WEBSITE__BASE_URL

        self.CORS__ACCESS_CONTROL_ALLOWED_ORIGIN = string_to_list(
            self.get_raw_config("cors.access-control-allowed-origin", default_cors_allowed_origin),
            separator=",",
            cast_func=str,
            do_strip=True,
        )

        self.USER__AUTH_TOKEN__VALIDITY = int(
            self.get_raw_config("user.auth_token.validity", "604800")
        )

        # TODO - G.M - 2019-03-14 - retrocompat code,
        # will be deleted in the future (https://github.com/tracim/tracim/issues/1483)
        defaut_reset_password_validity = "900"
        self.USER__RESET_PASSWORD__VALIDITY = self.get_raw_config("user.reset_password.validity")
        if self.USER__RESET_PASSWORD__VALIDITY:
            logger.warning(
                self,
                "user.reset_password.validity parameter is deprecated ! "
                "please use user.reset_password.token_lifetime instead.",
            )
            self.USER__RESET_PASSWORD__TOKEN_LIFETIME = self.USER__RESET_PASSWORD__VALIDITY
        else:
            self.USER__RESET_PASSWORD__TOKEN_LIFETIME = int(
                self.get_raw_config(
                    "user.reset_password.token_lifetime", defaut_reset_password_validity
                )
            )
        self.USER__DEFAULT_PROFILE = self.get_raw_config("user.default_profile", Profile.USER.slug)

        self.KNOWN_MEMBERS__FILTER = asbool(self.get_raw_config("known_members.filter", "true"))
        self.DEBUG = asbool(self.get_raw_config("debug", "false"))

        self.PREVIEW__JPG__RESTRICTED_DIMS = asbool(
            self.get_raw_config("preview.jpg.restricted_dims", "false")
        )
        self.PREVIEW__JPG__ALLOWED_DIMS = string_to_list(
            self.get_raw_config("preview.jpg.allowed_dims", "256x256"),
            cast_func=PreviewDim.from_string,
            separator=",",
        )

        self.FRONTEND__SERVE = asbool(self.get_raw_config("frontend.serve", "false"))
        # INFO - G.M - 2018-08-06 - we pretend that frontend_dist_folder
        # is probably in frontend subfolder
        # of tracim_v2 parent of both backend and frontend
        backend_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        tracim_v2_folder = os.path.dirname(backend_folder)
        backend_i18n_folder = os.path.join(backend_folder, "tracim_backend", "locale")

        self.BACKEND__I18N_FOLDER_PATH = self.get_raw_config(
            "backend.i18n_folder_path", backend_i18n_folder
        )

        frontend_dist_folder = os.path.join(tracim_v2_folder, "frontend", "dist")
        self.FRONTEND__DIST_FOLDER_PATH = self.get_raw_config(
            "frontend.dist_folder_path", frontend_dist_folder
        )
        self.PLUGIN__FOLDER_PATH = self.get_raw_config("plugin.folder_path", None)

        self.FRONTEND__CUSTOM_TOOLBOX_FOLDER_PATH = self.get_raw_config(
            "frontend.custom_toolbox_folder_path", None
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
            self.get_raw_config("email.notification.enabled_on_invitation", "true")
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

        self.EMAIL__NOTIFICATION__FROM__EMAIL = self.get_raw_config(
            "email.notification.from.email", "noreply+{user_id}@trac.im"
        )
        self.EMAIL__NOTIFICATION__FROM = self.get_raw_config("email.notification.from")
        if self.get_raw_config("email.notification.from"):
            raise ConfigurationError(
                "email.notification.from configuration is deprecated. "
                "Use instead email.notification.from.email and "
                "email.notification.from.default_label."
            )

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

        self.EMAIL__NOTIFICATION__CONTENT_UPDATE__TEMPLATE__HTML = self.get_raw_config(
            "email.notification.content_update.template.html"
        )

        self.EMAIL__NOTIFICATION__CONTENT_UPDATE__SUBJECT = self.get_raw_config(
            "email.notification.content_update.subject",
            _("[{website_title}] [{workspace_label}] {content_label} ({content_status_label})"),
        )
        # Created account notification
        self.EMAIL__NOTIFICATION__CREATED_ACCOUNT__TEMPLATE__HTML = self.get_raw_config(
            "email.notification.created_account.template.html"
        )
        self.EMAIL__NOTIFICATION__CREATED_ACCOUNT__SUBJECT = self.get_raw_config(
            "email.notification.created_account.subject",
            _("[{website_title}] Someone created an account for you"),
        )

        # Reset password notification
        self.EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__TEMPLATE__HTML = self.get_raw_config(
            "email.notification.reset_password_request.template.html"
        )
        self.EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__SUBJECT = self.get_raw_config(
            "email.notification.reset_password_request.subject",
            _("[{website_title}] A password reset has been requested"),
        )

        # TODO - G.M - 2019-01-22 - add feature to process notification email
        # asynchronously see issue https://github.com/tracim/tracim/issues/1345
        self.EMAIL__NOTIFICATION__PROCESSING_MODE = "sync"
        self.EMAIL__NOTIFICATION__ACTIVATED = asbool(
            self.get_raw_config("email.notification.activated")
        )

        self.EMAIL__NOTIFICATION__SMTP__SERVER = self.get_raw_config(
            "email.notification.smtp.server"
        )
        self.EMAIL__NOTIFICATION__SMTP__PORT = self.get_raw_config("email.notification.smtp.port")
        self.EMAIL__NOTIFICATION__SMTP__USER = self.get_raw_config("email.notification.smtp.user")
        self.EMAIL__NOTIFICATION__SMTP__PASSWORD = self.get_raw_config(
            "email.notification.smtp.password", secret=True
        )

        self.EMAIL__REPLY__ACTIVATED = asbool(self.get_raw_config("email.reply.activated", "false"))

        self.EMAIL__REPLY__IMAP__SERVER = self.get_raw_config("email.reply.imap.server")
        self.EMAIL__REPLY__IMAP__PORT = self.get_raw_config("email.reply.imap.port")
        self.EMAIL__REPLY__IMAP__USER = self.get_raw_config("email.reply.imap.user")
        self.EMAIL__REPLY__IMAP__PASSWORD = self.get_raw_config(
            "email.reply.imap.password", secret=True
        )
        self.EMAIL__REPLY__IMAP__FOLDER = self.get_raw_config("email.reply.imap.folder")
        self.EMAIL__REPLY__CHECK__HEARTBEAT = int(
            self.get_raw_config("email.reply.check.heartbeat", "60")
        )
        self.EMAIL__REPLY__IMAP__USE_SSL = asbool(self.get_raw_config("email.reply.imap.use_ssl"))
        self.EMAIL__REPLY__IMAP__USE_IDLE = asbool(
            self.get_raw_config("email.reply.imap.use_idle", "true")
        )
        self.EMAIL__REPLY__CONNECTION__MAX_LIFETIME = int(
            self.get_raw_config("email.reply.connection.max_lifetime", "600")  # 10 minutes
        )
        self.EMAIL__REPLY__USE_HTML_PARSING = asbool(
            self.get_raw_config("email.reply.use_html_parsing", "true")
        )
        self.EMAIL__REPLY__USE_TXT_PARSING = asbool(
            self.get_raw_config("email.reply.use_txt_parsing", "true")
        )
        self.EMAIL__REPLY__LOCKFILE_PATH = self.get_raw_config("email.reply.lockfile_path", "")

        self.EMAIL__PROCESSING_MODE = self.get_raw_config("email.processing_mode", "sync").upper()

        self.EMAIL__ASYNC__REDIS__HOST = self.get_raw_config("email.async.redis.host", "localhost")
        self.EMAIL__ASYNC__REDIS__PORT = int(self.get_raw_config("email.async.redis.port", "6379"))
        self.EMAIL__ASYNC__REDIS__DB = int(self.get_raw_config("email.async.redis.db", "0"))
        self.NEW_USER__INVITATION__DO_NOTIFY = asbool(
            self.get_raw_config("new_user.invitation.do_notify", "True")
        )

        self.NEW_USER__INVITATION__MINIMAL_PROFILE = self.get_raw_config(
            "new_user.invitation.minimal_profile", Group.TIM_MANAGER_GROUPNAME
        )

    def _load_webdav_config(self) -> None:
        """
        load config for webdav related stuff
        """
        tracim_website = "http://tracim.fr/"
        tracim_name = "Tracim"
        wsgidav_website = "https://github.com/mar10/wsgidav/"
        wsgidav_name = "WsgiDAV"

        self.WEBDAV__UI__ENABLED = asbool(self.get_raw_config("webdav.ui.enabled", "true"))
        self.WEBDAV__BASE_URL = self.get_raw_config("webdav.base_url", "")
        self.WEBDAV__VERBOSE__LEVEL = int(self.get_raw_config("webdav.verbose.level", "1"))
        self.WEBDAV__ROOT_PATH = self.get_raw_config("webdav.root_path", "/")
        self.WEBDAV__BLOCK_SIZE = int(self.get_raw_config("webdav.block_size", "8192"))
        self.WEBDAV__DIR_BROWSER__ENABLED = asbool(
            self.get_raw_config("webdav.dir_browser.enabled", "true")
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
        self.WEBDAV_SHOW_DELETED = False
        self.WEBDAV_SHOW_ARCHIVED = False
        self.WEBDAV_SHOW_HISTORY = False
        self.WEBDAV_MANAGE_LOCK = True

    def _load_ldap_config(self) -> None:
        """
        Load config for ldap related stuff
        """
        self.LDAP_URL = self.get_raw_config("ldap_url", "dc=directory,dc=fsf,dc=org")
        self.LDAP_BASE_URL = self.get_raw_config("ldap_base_url", "dc=directory,dc=fsf,dc=org")
        self.LDAP_BIND_DN = self.get_raw_config(
            "ldap_bind_dn", "cn=admin, dc=directory,dc=fsf,dc=org"
        )
        self.LDAP_BIND_PASS = self.get_raw_config("ldap_bind_pass", secret=True)
        self.LDAP_TLS = asbool(self.get_raw_config("ldap_tls", "false"))
        self.LDAP_USER_BASE_DN = self.get_raw_config(
            "ldap_user_base_dn", "ou=people, dc=directory,dc=fsf,dc=org"
        )
        self.LDAP_LOGIN_ATTRIBUTE = self.get_raw_config("ldap_login_attribute", "mail")
        # TODO - G.M - 16-11-2018 - Those prams are only use at account creation
        self.LDAP_NAME_ATTRIBUTE = self.get_raw_config("ldap_name_attribute")
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

        DEFAULT_INDEX_DOCUMENTS_PATTERN_TEMPLATE = "{index_alias}-{date}"
        self.SEARCH__ELASTICSEARCH__INDEX_ALIAS = self.get_raw_config(
            "search.elasticsearch.index_alias"
        )
        self.SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE = self.get_raw_config(
            "search.elasticsearch.index_pattern_template", DEFAULT_INDEX_DOCUMENTS_PATTERN_TEMPLATE
        )
        self.SEARCH__ELASTICSEARCH__USE_INGEST = asbool(
            self.get_raw_config("search.elasticsearch.use_ingest", "False")
        )
        # FIXME - G.M - 2019-05-31 - limit default allowed mimetype to useful list instead of
        ALLOWED_INGEST_DEFAULT_MIMETYPE = ""
        self.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST = string_to_list(
            self.get_raw_config(
                "search.elasticsearch.ingest.mimetype_whitelist", ALLOWED_INGEST_DEFAULT_MIMETYPE
            ),
            separator=",",
            cast_func=str,
            do_strip=True,
        )
        self.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_BLACKLIST = string_to_list(
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

    # INFO - G.M - 2019-04-05 - Config validation methods

    def check_config_validity(self) -> None:
        """
        Check if config setted is correct
        """
        self._check_global_config_validity()
        self._check_email_config_validity()
        self._check_search_config_validity()

        import tracim_backend.applications as apps_modules

        for app_config_path in find_direct_submodule_path(apps_modules):
            module = importlib.import_module("{}.config".format(app_config_path))
            module.check_config(self)

    def _check_global_config_validity(self) -> None:
        """
        Check config for global stuff
        """
        self.check_mandatory_param("SQLALCHEMY__URL", self.SQLALCHEMY__URL)
        self.check_mandatory_param("SESSION__DATA_DIR", self.SESSION__DATA_DIR)
        self.check_directory_path_param("SESSION__DATA_DIR", self.SESSION__DATA_DIR, writable=True)

        self.check_mandatory_param("SESSION__LOCK_DIR", self.SESSION__LOCK_DIR)
        self.check_directory_path_param("SESSION__LOCK_DIR", self.SESSION__LOCK_DIR, writable=True)
        # INFO - G.M - 2019-04-03 - check color file validity
        self.check_mandatory_param("COLOR__CONFIG_FILE_PATH", self.COLOR__CONFIG_FILE_PATH)
        if not os.path.exists(self.COLOR__CONFIG_FILE_PATH):
            raise ConfigurationError(
                "ERROR: {} file does not exist. "
                'please create it or set "COLOR__CONFIG_FILE_PATH"'
                "with a correct value".format(self.COLOR__CONFIG_FILE_PATH)
            )

        try:
            with open(self.COLOR__CONFIG_FILE_PATH) as json_file:
                self.APPS_COLORS = json.load(json_file)
        except Exception as e:
            raise ConfigurationError(
                "Error: {} file could not be load as json".format(self.COLOR__CONFIG_FILE_PATH)
            ) from e

        try:
            self.APPS_COLORS["primary"]
        except KeyError as e:
            raise ConfigurationError(
                "Error: primary color is required in {} file".format(self.COLOR__CONFIG_FILE_PATH)
            ) from e

        self.check_mandatory_param("DEPOT_STORAGE_DIR", self.DEPOT_STORAGE_DIR)
        self.check_directory_path_param("DEPOT_STORAGE_DIR", self.DEPOT_STORAGE_DIR, writable=True)

        self.check_mandatory_param("DEPOT_STORAGE_NAME", self.DEPOT_STORAGE_NAME)

        self.check_mandatory_param("PREVIEW_CACHE_DIR", self.PREVIEW_CACHE_DIR)
        self.check_directory_path_param("PREVIEW_CACHE_DIR", self.PREVIEW_CACHE_DIR, writable=True)

        if AuthType.REMOTE is self.AUTH_TYPES:
            raise ConfigurationError(
                'ERROR: "remote" auth not allowed in auth_types'
                " list, use remote_user_header instead"
            )

        self.check_mandatory_param("WEBSITE__BASE_URL", self.WEBSITE__BASE_URL)

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

    def _check_email_config_validity(self) -> None:
        """
        Check if config is correctly setted for email features
        """
        if not self.EMAIL__NOTIFICATION__ACTIVATED:
            logger.warning(
                self,
                "Notification by email mecanism is disabled ! "
                "Notification and mail invitation mecanisms will not work.",
            )

        if not self.EMAIL__REPLY__LOCKFILE_PATH and self.EMAIL__REPLY__ACTIVATED:
            self.check_mandatory_param(
                "EMAIL__REPLY__LOCKFILE_PATH",
                self.EMAIL__REPLY__LOCKFILE_PATH,
                when_str="when email reply is activated",
            )
        # INFO - G.M - 2019-02-01 - check if template are available,
        # do not allow running with email_notification_activated
        # if templates needed are not available
        if self.EMAIL__NOTIFICATION__ACTIVATED:
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
                            template_description=template_description, template_path=template_path
                        )
                    )

        if self.EMAIL__PROCESSING_MODE not in (self.CST.ASYNC, self.CST.SYNC):
            raise Exception(
                "EMAIL__PROCESSING_MODE "
                "can "
                'be "{}" or "{}", not "{}"'.format(
                    self.CST.ASYNC, self.CST.SYNC, self.EMAIL__PROCESSING_MODE
                )
            )

    # INFO - G.M - 2019-04-05 - Post Actions Methods
    def do_post_check_action(self) -> None:
        self._set_default_app(self.APP__ENABLED)

    def _set_default_app(self, enabled_app_list: typing.List[str]) -> None:
        import tracim_backend.applications as apps_modules

        available_apps = OrderedDict()

        for app_path in find_direct_submodule_path(apps_modules):
            module = importlib.import_module("{}.application".format(app_path))
            new_app = module.get_app(app_config=self)
            available_apps.update({new_app.slug: new_app})

        # TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
        # of tracim_backend, Be careful app_list is a global_var
        app_list.clear()
        for app_slug in enabled_app_list:
            if app_slug in available_apps.keys():
                app_list.append(available_apps[app_slug])
        # TODO - G.M - 2018-08-08 - We need to update validators each time
        # app_list is updated.
        update_validators()

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
                "SEARCH__ELASTICSEARCH__INDEX_ALIAS",
                self.SEARCH__ELASTICSEARCH__INDEX_ALIAS,
                when_str="if elasticsearch search feature is enabled",
            )

    # INFO - G.M - 2019-04-05 - Others methods
    def _check_consistency(self):
        """
        Verify all config_name_attribute are correctly associated with
        a true cfg attribute. Will raise AttributeError if not.
        """
        for config_param in self.config_naming:
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

    def configure_filedepot(self) -> None:

        # TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
        # of tracim_backend, Be careful DepotManager is a Singleton !

        depot_storage_name = self.DEPOT_STORAGE_NAME
        depot_storage_path = self.DEPOT_STORAGE_DIR
        depot_storage_settings = {"depot.storage_path": depot_storage_path}
        DepotManager.configure(depot_storage_name, depot_storage_settings)

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

    def check_directory_path_param(
        self, param_name: str, path: str, writable: bool = False, readable: bool = True
    ) -> None:
        """
        Check if path exist, if it is a directory and if it is readable/writable.
        if check fail, raise ConfigurationError
        :param param_name: name of parameter to check
        :param path: path (value of parameter) which is check as a directory path
        :param writable: check if directory(according to path) is writable
        :param readable: check if directory(according to path) is writable
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
