# -*- coding: utf-8 -*-
import json
import os
import typing
from collections import OrderedDict
from collections import namedtuple
from urllib.parse import urlparse

from depot.manager import DepotManager
from paste.deploy.converters import asbool

from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.validator import update_validators
from tracim_backend.exceptions import ConfigurationError
from tracim_backend.extensions import app_list
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import translator_marker as _
from tracim_backend.lib.utils.utils import string_to_list
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Group
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.roles import WorkspaceRoles

ENV_VAR_PREFIX = 'TRACIM_'
CONFIG_LOG_TEMPLATE = 'CONFIG: [ {config_source: <15} | {config_name} | {config_value} | {config_name_source} ]'
ID_SOURCE_ENV_VAR='SOURCE_ENV_VAR'
ID_SOURCE_CONFIG='SOURCE_CONFIG'
ID_SOURCE_DEFAULT='SOURCE_DEFAULT'

class CFG(object):
    """Object used for easy access to config file parameters."""

    def __init__(self, settings: typing.Dict[str, typing.Any]):
        self.settings = settings
        logger.debug(self, 'CONFIG_PROCESS:1: load config from settings')
        self.load_config()
        logger.debug(self, 'CONFIG_PROCESS:2: check validity of config given')
        self.check_config_validity()
        logger.debug(self, 'CONFIG_PROCESS:3: do post actions')
        self.do_post_check_action()

    # INFO - G.M - 2019-04-05 - Utils Methods

    def _get_associated_env_var_name(self, config_name: str) -> str:
        """
        Get associated env var name of any config_name.
        example: app.enabled become TRACIM_APP_ENABLED
        """
        return '{env_var_prefix}{config_name}'.format(
            env_var_prefix=ENV_VAR_PREFIX,
            config_name=config_name.replace('.', '_').upper(),
        )

    def _get_printed_val_value(self, value: str, secret: bool) -> str:
        if secret:
            return '<value not shown>'
        else:
            return value

    def get_raw_config(
        self,
        config_name: str,
        default_value: typing.Optional[str] = None,
        secret:bool = False,
    ) -> str:
        """
        Get config parameter according to a config name.
        Priority:
         - 1: Environement variable
         - 2: Config file data (stored in CFG.settings dict)
         - 3: default_value
        :param config_name: name of the config parameter name
        :param default_value: default value if not setted value found
        :param secret: is the value of the parameter secret ? (if true, it will not be printed)
        :return:
        """
        val_cfg = self.settings.get(config_name)
        val_name_env = self._get_associated_env_var_name(config_name)
        val_env = os.environ.get(val_name_env)
        if val_env:
            config_value = val_env
            config_source = ID_SOURCE_ENV_VAR
            config_name_source = val_name_env
            config_name = config_name
        elif val_cfg:
            config_value = val_cfg
            config_source = ID_SOURCE_CONFIG
            config_name_source = config_name
            config_name = config_name
        else:
            config_value = default_value
            config_source = ID_SOURCE_DEFAULT
            config_name_source = None
            config_name = config_name

        logger.info(
            self,
            CONFIG_LOG_TEMPLATE.format(
                config_value=config_value,
                config_source=config_source,
                config_name=config_name,
                config_name_source=config_name_source,
            )
        )
        return config_value

    # INFO - G.M - 2019-04-05 - Config loading methods

    def load_config(self) -> None:
        """Parse configuration file and env variables"""
        logger.info(
            self,
            CONFIG_LOG_TEMPLATE.format(
                config_value='<config_value>',
                config_source='<config_source>',
                config_name='<config_name>',
                config_name_source='<config_name_source>',
            )
        )
        self._load_global_config()
        self._load_email_config()
        self._load_ldap_config()
        self._load_webdav_config()
        self._load_caldav_config()

    def _load_global_config(self) -> None:
        """
        Load generic config
        """
        backend_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # nopep8
        tracim_v2_folder = os.path.dirname(backend_folder)
        default_color_config_file_path = os.path.join(tracim_v2_folder, 'color.json')  # nopep8
        self.COLOR_CONFIG_FILE_PATH = self.get_raw_config(
            'color.config_file_path', default_color_config_file_path
        )

        default_enabled_app = 'contents/thread,' \
                              'contents/file,' \
                              'contents/html-document,' \
                              'contents/folder,' \
                              'calendar'


        self.ENABLED_APP = string_to_list(
            self.get_raw_config('app.enabled', default_enabled_app),
            separator=',',
            cast_func=str,
            stripped=True,
        )

        self.DEPOT_STORAGE_DIR = self.get_raw_config(
            'depot_storage_dir',
        )
        self.DEPOT_STORAGE_NAME = self.get_raw_config(
            'depot_storage_name',
        )
        self.PREVIEW_CACHE_DIR = self.get_raw_config(
            'preview_cache_dir',
        )

        self.AUTH_TYPES =  string_to_list(
            self.get_raw_config('auth_types', 'internal'),
            separator=',',
            cast_func=AuthType,
            stripped=True,

        )
        self.REMOTE_USER_HEADER = self.get_raw_config('remote_user_header', None)
        # TODO - G.M - 2018-09-11 - Deprecated param
        # self.DATA_UPDATE_ALLOWED_DURATION = int(self.get_raw_config(
        #     'content.update.allowed.duration',
        #     0,
        # ))

        self.API_KEY = self.get_raw_config(
            'api.key',
            '',
            secret=True
        )
        self.SESSION_REISSUE_TIME = int(self.get_raw_config(
            'session.reissue_time',
            '120'
        ))
        self.WEBSITE_TITLE = self.get_raw_config(
            'website.title',
            'TRACIM',
        )

        # base url of the frontend
        self.WEBSITE_BASE_URL = self.get_raw_config(
            'website.base_url',
            '',
        )

        self.API_BASE_URL = self.get_raw_config(
            'api.base_url',
            self.WEBSITE_BASE_URL,
        )


        if self.API_BASE_URL != self.WEBSITE_BASE_URL:
            default_cors_allowed_origin = '{},{}'.format(self.WEBSITE_BASE_URL, self.API_BASE_URL)
        else:
            default_cors_allowed_origin = self.WEBSITE_BASE_URL

        self.CORS_ALLOWED_ORIGIN = string_to_list(
            self.get_raw_config('cors.access-control-allowed-origin', default_cors_allowed_origin),
            separator=',',
            cast_func=str,
            stripped=True,

        )

        self.WEBSITE_SERVER_NAME = self.get_raw_config(
            'website.server_name',
        )
        if not self.WEBSITE_SERVER_NAME:
            self.WEBSITE_SERVER_NAME = self.get_raw_config(
                'website.server_name',
                default_value=urlparse(self.WEBSITE_BASE_URL).hostname
            )
            logger.warning(
                self,
                'NOTE: Generated website.server_name parameter from '
                'website.base_url parameter -> {0}'
                .format(self.WEBSITE_SERVER_NAME)
            )

        self.USER_AUTH_TOKEN_VALIDITY = int(self.get_raw_config(
            'user.auth_token.validity',
            '604800',
        ))

        # TODO - G.M - 2019-03-14 - retrocompat code,
        # will be deleted in the future (https://github.com/tracim/tracim/issues/1483)
        defaut_reset_password_validity = '900'
        self.USER_RESET_PASSWORD_TOKEN_LIFETIME = self.get_raw_config('user.reset_password.validity')
        if self.USER_RESET_PASSWORD_TOKEN_LIFETIME:
            logger.warning(
                self,
                'user.reset_password.validity parameter is deprecated ! '
                'please use user.reset_password.token_lifetime instead.'
            )
        else:
            self.USER_RESET_PASSWORD_TOKEN_LIFETIME = int(self.get_raw_config(
                'user.reset_password.token_lifetime',
                defaut_reset_password_validity
            ))


        self.DEBUG = asbool(self.get_raw_config('debug', 'false'))

        self.PREVIEW_JPG_RESTRICTED_DIMS = asbool(self.get_raw_config(
            'preview.jpg.restricted_dims', 'false'
        ))
        self.PREVIEW_JPG_ALLOWED_DIMS = string_to_list(
            self.get_raw_config('preview.jpg.allowed_dims', '256x256'),
            cast_func=PreviewDim.from_string,
            separator=','
        )

        self.FRONTEND_SERVE = asbool(self.get_raw_config(
            'frontend.serve', 'false'
        ))
        # INFO - G.M - 2018-08-06 - we pretend that frontend_dist_folder
        # is probably in frontend subfolder
        # of tracim_v2 parent of both backend and frontend
        backend_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # nopep8
        tracim_v2_folder = os.path.dirname(backend_folder)
        backend_i18n_folder = os.path.join(backend_folder, 'tracim_backend', 'locale')  # nopep8

        self.BACKEND_I18N_FOLDER = self.get_raw_config(
            'backend.18n_folder_path', backend_i18n_folder
        )

        frontend_dist_folder = os.path.join(tracim_v2_folder, 'frontend', 'dist')  # nopep8
        self.FRONTEND_DIST_FOLDER_PATH = self.get_raw_config(
            'frontend.dist_folder_path', frontend_dist_folder
        )

    def _load_email_config(self) -> None:
        """
        Load config for email related stuff
        """
        # TODO - G.M - 27-03-2018 - [Email] Restore email config
        ###
        # EMAIL related stuff (notification, reply)
        ##
        self.EMAIl_NOTIFICATION_ENABLED_ON_INVITATION = asbool(self.get_raw_config(
            'email.notification.enabled_on_invitation',
            'true'
        ))

        # TODO - G.M - 2019-04-05 - keep as parameters
        # or set it as constant,
        # see https://github.com/tracim/tracim/issues/1569
        self.EMAIL_NOTIFICATION_NOTIFIED_EVENTS = [
            ActionDescription.COMMENT,
            ActionDescription.CREATION,
            ActionDescription.EDITION,
            ActionDescription.REVISION,
            ActionDescription.STATUS_UPDATE
        ]
        # TODO - G.M - 2019-04-04 - need to be better handled:
        # dynamic default value and allow user to set this value.
        # see :https://github.com/tracim/tracim/issues/1555
        self.EMAIL_NOTIFICATION_NOTIFIED_CONTENTS = [
            'html-document',
            'thread',
            'file',
            'comment',
            # 'folder' --folder is skipped
        ]

        self.EMAIL_NOTIFICATION_FROM_EMAIL = self.get_raw_config(
            'email.notification.from.email',
            'noreply+{user_id}@trac.im'
        )
        if self.get_raw_config('email.notification.from'):
            raise Exception(
                'email.notification.from configuration is deprecated. '
                'Use instead email.notification.from.email and '
                'email.notification.from.default_label.'
            )

        self.EMAIL_NOTIFICATION_FROM_DEFAULT_LABEL = self.get_raw_config(
            'email.notification.from.default_label',
            'Tracim Notifications'
        )
        self.EMAIL_NOTIFICATION_REPLY_TO_EMAIL = self.get_raw_config(
            'email.notification.reply_to.email',
        )
        self.EMAIL_NOTIFICATION_REFERENCES_EMAIL = self.get_raw_config(
            'email.notification.references.email'
        )
        # Content update notification

        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_HTML = self.get_raw_config(
            'email.notification.content_update.template.html',
        )

        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_SUBJECT = self.get_raw_config(
            'email.notification.content_update.subject',
            _("[{website_title}] [{workspace_label}] {content_label} ({content_status_label})")  # nopep8
        )
        # Created account notification
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_HTML = self.get_raw_config(
            'email.notification.created_account.template.html',
        )
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_SUBJECT = self.get_raw_config(
            'email.notification.created_account.subject',
            _('[{website_title}] Someone created an account for you'),
        )

        # Reset password notification
        self.EMAIL_NOTIFICATION_RESET_PASSWORD_TEMPLATE_HTML = self.get_raw_config(
            'email.notification.reset_password_request.template.html',
        )
        self.EMAIL_NOTIFICATION_RESET_PASSWORD_SUBJECT = self.get_raw_config(
            'email.notification.reset_password_request.subject',
            _('[{website_title}] A password reset has been requested'),
        )

        # TODO - G.M - 2019-01-22 - add feature to process notification email
        # asynchronously see issue https://github.com/tracim/tracim/issues/1345
        self.EMAIL_NOTIFICATION_PROCESSING_MODE = 'sync'
        self.EMAIL_NOTIFICATION_ACTIVATED = asbool(self.get_raw_config(
            'email.notification.activated',
        ))

        self.EMAIL_NOTIFICATION_SMTP_SERVER = self.get_raw_config(
            'email.notification.smtp.server',
        )
        self.EMAIL_NOTIFICATION_SMTP_PORT = self.get_raw_config(
            'email.notification.smtp.port',
        )
        self.EMAIL_NOTIFICATION_SMTP_USER = self.get_raw_config(
            'email.notification.smtp.user',
        )
        self.EMAIL_NOTIFICATION_SMTP_PASSWORD = self.get_raw_config(
            'email.notification.smtp.password',
            secret=True
        )

        self.EMAIL_REPLY_ACTIVATED = asbool(self.get_raw_config(
            'email.reply.activated',
            'false',
        ))

        self.EMAIL_REPLY_IMAP_SERVER = self.get_raw_config(
            'email.reply.imap.server',
        )
        self.EMAIL_REPLY_IMAP_PORT = self.get_raw_config(
            'email.reply.imap.port',
        )
        self.EMAIL_REPLY_IMAP_USER = self.get_raw_config(
            'email.reply.imap.user',
        )
        self.EMAIL_REPLY_IMAP_PASSWORD = self.get_raw_config(
            'email.reply.imap.password',
            secret=True
        )
        self.EMAIL_REPLY_IMAP_FOLDER = self.get_raw_config(
            'email.reply.imap.folder',
        )
        self.EMAIL_REPLY_CHECK_HEARTBEAT = int(self.get_raw_config(
            'email.reply.check.heartbeat',
            '60',
        ))
        self.EMAIL_REPLY_IMAP_USE_SSL = asbool(self.get_raw_config(
            'email.reply.imap.use_ssl',
        ))
        self.EMAIL_REPLY_IMAP_USE_IDLE = asbool(self.get_raw_config(
            'email.reply.imap.use_idle',
            'true',
        ))
        self.EMAIL_REPLY_CONNECTION_MAX_LIFETIME = int(self.get_raw_config(
            'email.reply.connection.max_lifetime',
            '600',  # 10 minutes
        ))
        self.EMAIL_REPLY_USE_HTML_PARSING = asbool(self.get_raw_config(
            'email.reply.use_html_parsing',
            'true',
        ))
        self.EMAIL_REPLY_USE_TXT_PARSING = asbool(self.get_raw_config(
            'email.reply.use_txt_parsing',
            'true',
        ))
        self.EMAIL_REPLY_LOCKFILE_PATH = self.get_raw_config(
            'email.reply.lockfile_path',
            ''
        )

        self.EMAIL_PROCESSING_MODE = self.get_raw_config(
            'email.processing_mode',
            'sync',
        ).upper()


        self.EMAIL_SENDER_REDIS_HOST = self.get_raw_config(
            'email.async.redis.host',
            'localhost',
        )
        self.EMAIL_SENDER_REDIS_PORT = int(self.get_raw_config(
            'email.async.redis.port',
            '6379',
        ))
        self.EMAIL_SENDER_REDIS_DB = int(self.get_raw_config(
            'email.async.redis.db',
            '0',
        ))
        self.NEW_USER_INVITATION_DO_NOTIFY = asbool(self.get_raw_config(
            'new_user.invitation.do_notify',
            'True'
        ))

        self.NEW_USER_INVITATION_MINIMAL_PROFILE = self.get_raw_config(
            'new_user.invitation.minimal_profile',
            Group.TIM_MANAGER_GROUPNAME
        )

    def _load_webdav_config(self) -> None:
        """
        load config for webdav related stuff
        """
        tracim_website = 'http://tracim.fr/'
        tracim_name = 'Tracim'
        wsgidav_website = 'https://github.com/mar10/wsgidav/'
        wsgidav_name = 'WsgiDAV'

        self.WEBDAV_VERBOSE_LEVEL = int(self.get_raw_config('webdav.verbose.level', '1'))
        self.WEBDAV_ROOT_PATH = self.get_raw_config('webdav.root_path', '/')
        self.WEBDAV_BLOCK_SIZE = int(self.get_raw_config('webdav.block_size', '8192'))
        self.WEBDAV_DIR_BROWSER_ENABLED = asbool(self.get_raw_config('webdav.dir_browser.enabled', 'true'))
        default_webdav_footnote = '<a href="{instance_url}">{instance_name}</a>.' \
                                  ' This Webdav is serve by'  \
                                  ' <a href="{tracim_website}">{tracim_name} software</a> using' \
                                  ' <a href="{wsgidav_website}">{wsgidav_name}</a>.'.format(
                                      instance_name=self.WEBSITE_TITLE,
                                      instance_url=self.WEBSITE_BASE_URL,
                                      tracim_name=tracim_name,
                                      tracim_website=tracim_website,
                                      wsgidav_name=wsgidav_name,
                                      wsgidav_website=wsgidav_website,
                                  )
        self.WEBDAV_DIR_BROWSER_FOOTER = self.get_raw_config('webdav.dir_browser.footer', default_webdav_footnote)
        # TODO : check if tweaking those param does work

        # TODO - G.M - 2019-04-05 - keep as parameters
        # or set it as constant,
        # see https://github.com/tracim/tracim/issues/1569
        self.WEBDAV_SHOW_DELETED = False
        self.WEBDAV_SHOW_ARCHIVED = False
        self.WEBDAV_SHOW_HISTORY = False
        self.WEBDAV_MANAGE_LOCK = True

    def _load_caldav_config(self) -> None:
        """
        load config for caldav related stuff
        """
        self.CALDAV_ENABLED = asbool(self.get_raw_config(
            'caldav.enabled',
            'false'
        ))
        self.CALDAV_RADICALE_PROXY_BASE_URL = self.get_raw_config(
            'caldav.radicale_proxy.base_url',
            None
        )
        self.CALDAV_RADICALE_CALENDAR_DIR = 'calendar'
        self.CALDAV_RADICALE_WORKSPACE_SUBDIR = 'workspace'
        self.CALDAV_RADICALE_USER_SUBDIR = 'user'
        self.CALDAV_RADICALE_BASE_PATH = '/{}/'.format(self.CALDAV_RADICALE_CALENDAR_DIR)
        self.CALDAV_RADICALE_USER_PATH = '/{}/{}/'.format(
            self.CALDAV_RADICALE_CALENDAR_DIR,
            self.CALDAV_RADICALE_USER_SUBDIR,
        )
        self.CALDAV_RADICALE_WORKSPACE_PATH = '/{}/{}/'.format(
            self.CALDAV_RADICALE_CALENDAR_DIR,
            self.CALDAV_RADICALE_WORKSPACE_SUBDIR,
        )

    def _load_ldap_config(self) ->  None:
        """
        Load config for ldap related stuff
        """
        self.LDAP_URL = self.get_raw_config(
            'ldap_url',
            'dc=directory,dc=fsf,dc=org'
        )
        self.LDAP_BASE_URL = self.get_raw_config(
            'ldap_base_url',
            'dc=directory,dc=fsf,dc=org'
        )
        self.LDAP_BIND_DN = self.get_raw_config(
            'ldap_bind_dn',
            'cn=admin, dc=directory,dc=fsf,dc=org'
        )
        self.LDAP_BIND_PASS = self.get_raw_config(
            'ldap_bind_pass',
            secret=True
        )
        self.LDAP_TLS = asbool(self.get_raw_config('ldap_tls', 'false'))
        self.LDAP_USER_BASE_DN = self.get_raw_config(
            'ldap_user_base_dn',
            'ou=people, dc=directory,dc=fsf,dc=org'
        )
        self.LDAP_LOGIN_ATTR = self.get_raw_config(
            'ldap_login_attribute',
            'mail'
        )
        # TODO - G.M - 16-11-2018 - Those prams are only use at account creation
        self.LDAP_NAME_ATTR = self.get_raw_config(
            'ldap_name_attribute'
        )
        # TODO - G.M - 2018-12-05 - [ldap_profile]
        # support for profile attribute disabled
        # Should be reenabled later probably with a better code
        # self.LDAP_PROFILE_ATTR = self.get_raw_config('ldap_profile_attribute')

        # TODO - G.M - 2019-04-05 - keep as parameters
        # or set it as constant,
        # see https://github.com/tracim/tracim/issues/1569
        self.LDAP_USER_FILTER = '({}=%(login)s)'.format(self.LDAP_LOGIN_ATTR)  # nopep8
        self.LDAP_USE_POOL = True
        self.LDAP_POOL_SIZE = 10 if self.LDAP_USE_POOL else None
        self.LDAP_POOL_LIFETIME = 3600 if self.LDAP_USE_POOL else None
        self.LDAP_GET_INFO = None

    # INFO - G.M - 2019-04-05 - Config validation methods

    def check_config_validity(self) -> None:
        """
        Check if config setted is correct
        """
        self._check_global_config_validity()
        self._check_email_config_validity()
        self._check_caldav_config_validity()

    def _check_global_config_validity(self) -> None:
        """
        Check config for global stuff
        """
        mandatory_msg = \
            'ERROR: {} configuration is mandatory. Set it before continuing.'
        # INFO - G.M - 2019-04-03 - check color file validity
        if not os.path.exists(self.COLOR_CONFIG_FILE_PATH):
            raise Exception(
                'ERROR: {} file does not exist. '
                'please create it or set color.config_file_path'
                'with a correct value'.format(self.COLOR_CONFIG_FILE_PATH)
            )

        try:
            with open(self.COLOR_CONFIG_FILE_PATH) as json_file:
                self.APPS_COLORS = json.load(json_file)
        except Exception as e:
            raise Exception(
                'Error: {} file could not be load as json'.format(self.COLOR_CONFIG_FILE_PATH)  # nopep8
            ) from e

        try:
            self.APPS_COLORS['primary']
        except KeyError as e:
            raise Exception(
                'Error: primary color is required in {} file'.format(
                    self.COLOR_CONFIG_FILE_PATH)  # nopep8
            ) from e

        # INFO - G.M - 2019-04-03 - depot dir validity
        if not self.DEPOT_STORAGE_DIR:
            raise Exception(
                mandatory_msg.format('depot_storage_dir')
            )
        if not self.DEPOT_STORAGE_NAME:
            raise Exception(
                mandatory_msg.format('depot_storage_name')
            )

        if not self.PREVIEW_CACHE_DIR:
            raise Exception(
                'ERROR: preview_cache_dir configuration is mandatory. '
                'Set it before continuing.'
            )

        if AuthType.REMOTE is self.AUTH_TYPES:
            raise Exception(
                'ERROR: "remote" auth not allowed in auth_types'
                ' list, use remote_user_header instead'
            )

        if not self.WEBSITE_BASE_URL:
            raise Exception(
                'website.base_url is needed in order to have correct path in'
                'few place like in email.'
                'You should set it with frontend root url.'
            )

        if not os.path.isdir(self.BACKEND_I18N_FOLDER):
            raise Exception(
                'ERROR: {} folder does not exist as folder. '
                'please set backend.i8n_folder_path'
                'with a correct value'.format(self.BACKEND_I18N_FOLDER)
            )

        # INFO - G.M - 2018-08-06 - We check dist folder existence
        if self.FRONTEND_SERVE and not os.path.isdir(self.FRONTEND_DIST_FOLDER_PATH):  # nopep8
            raise Exception(
                'ERROR: {} folder does not exist as folder. '
                'please set frontend.dist_folder.path'
                'with a correct value'.format(self.FRONTEND_DIST_FOLDER_PATH)
            )

    def _check_email_config_validity(self) -> None:
        """
        Check if config is correctly setted for email features
        """
        mandatory_msg = \
            'ERROR: {} configuration is mandatory. Set it before continuing.'
        if not self.EMAIL_NOTIFICATION_ACTIVATED:
            logger.warning(
                self,
                'Notification by email mecanism is disabled ! '
                'Notification and mail invitation mecanisms will not work.'
            )

        if not self.EMAIL_REPLY_LOCKFILE_PATH and self.EMAIL_REPLY_ACTIVATED:
            raise Exception(
                mandatory_msg.format('email.reply.lockfile_path')
            )
        # INFO - G.M - 2019-02-01 - check if template are available,
        # do not allow running with email_notification_activated
        # if templates needed are not available
        if self.EMAIL_NOTIFICATION_ACTIVATED:
            templates = {
                'content_update notification': self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_HTML,
                'created account': self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_HTML,
                'password reset': self.EMAIL_NOTIFICATION_RESET_PASSWORD_TEMPLATE_HTML
            }
            for template_description, template_path in templates.items():
                if not template_path or not os.path.isfile(template_path):
                    raise ConfigurationError(
                        'ERROR: email template for {template_description} '
                        'not found at "{template_path}."'.format(
                            template_description=template_description,
                            template_path=template_path
                        )
                    )

        if self.EMAIL_PROCESSING_MODE not in (
                self.CST.ASYNC,
                self.CST.SYNC,
        ):
            raise Exception(
                'email.processing_mode '
                'can ''be "{}" or "{}", not "{}"'.format(
                    self.CST.ASYNC,
                    self.CST.SYNC,
                    self.EMAIL_PROCESSING_MODE,
                )
            )

    def _check_caldav_config_validity(self) -> None:
        """
        Check if config is correctly setted for caldav features
        """
        if self.CALDAV_ENABLED and not self.CALDAV_RADICALE_PROXY_BASE_URL:
            raise ConfigurationError(
                'ERROR: Caldav radicale proxy cannot be activated if no radicale'
                'base url is configured. set "caldav.radicale_proxy.base_url" properly'
            )

    # INFO - G.M - 2019-04-05 - Post Actions Methods
    def do_post_check_action(self) -> None:
        self._set_default_app(self.ENABLED_APP)

    def _set_default_app(self, enabled_app_list: typing.List[str]) -> None:

        # init applications
        html_documents = Application(
            label='Text Documents',  # TODO - G.M - 24-05-2018 - Check label
            slug='contents/html-document',
            fa_icon='file-text-o',
            is_active=True,
            config={},
            main_route='/ui/workspaces/{workspace_id}/contents?type=html-document',
            app_config=self
        )
        html_documents.add_content_type(
            slug='html-document',
            label='Text Document',
            creation_label='Write a document',
            available_statuses=content_status_list.get_all(),
            slug_alias=['page'],
            file_extension='.document.html',
        )

        _file = Application(
            label='Files',
            slug='contents/file',
            fa_icon='paperclip',
            is_active=True,
            config={},
            main_route='/ui/workspaces/{workspace_id}/contents?type=file',
            app_config=self,
        )
        _file.add_content_type(
            slug='file',
            label='File',
            creation_label='Upload a file',
            available_statuses=content_status_list.get_all(),
        )

        thread = Application(
            label='Threads',
            slug='contents/thread',
            fa_icon='comments-o',
            is_active=True,
            config={},
            main_route='/ui/workspaces/{workspace_id}/contents?type=thread',
            app_config=self
        )
        thread.add_content_type(
            slug='thread',
            label='Thread',
            creation_label='Start a topic',
            available_statuses=content_status_list.get_all(),
            file_extension='.thread.html'
        )

        folder = Application(
            label='Folder',
            slug='contents/folder',
            fa_icon='folder-o',
            is_active=True,
            config={},
            main_route='',
            app_config=self
        )
        folder.add_content_type(
            slug='folder',
            label='Folder',
            creation_label='Create a folder',
            available_statuses=content_status_list.get_all(),
            allow_sub_content=True,
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER
        )

        markdownpluspage = Application(
            label='Markdown Plus Documents',
            # TODO - G.M - 24-05-2018 - Check label
            slug='contents/markdownpluspage',
            fa_icon='file-code-o',
            is_active=False,
            config={},
            main_route='/ui/workspaces/{workspace_id}/contents?type=markdownpluspage',
            # nopep8
            app_config=self,
        )
        markdownpluspage.add_content_type(
            slug='markdownpage',
            label='Rich Markdown File',
            creation_label='Create a Markdown document',
            available_statuses=content_status_list.get_all(),
        )

        calendar = Application(
            label='Calendar',
            slug='calendar',
            fa_icon='calendar',
            is_active=self.CALDAV_ENABLED,
            config={},
            main_route='/ui/workspaces/{workspace_id}/calendar',
            app_config=self
        )

        # process activated app list
        available_apps = OrderedDict([
            (html_documents.slug, html_documents),
            (_file.slug, _file),
            (thread.slug, thread),
            (folder.slug, folder),
            (markdownpluspage.slug, markdownpluspage),
            (calendar.slug, calendar)
        ])
        # TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
        # of tracim_backend, Be careful app_list is a global_var
        app_list.clear()
        for app_slug in enabled_app_list:
            if app_slug in available_apps.keys():
                app_list.append(available_apps[app_slug])
        # TODO - G.M - 2018-08-08 - We need to update validators each time
        # app_list is updated.
        update_validators()

    # INFO - G.M - 2019-04-05 - Others methods

    def configure_filedepot(self) -> None:

        # TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
        # of tracim_backend, Be careful DepotManager is a Singleton !

        depot_storage_name = self.DEPOT_STORAGE_NAME
        depot_storage_path = self.DEPOT_STORAGE_DIR
        depot_storage_settings = {'depot.storage_path': depot_storage_path}
        DepotManager.configure(
            depot_storage_name,
            depot_storage_settings,
        )

    class CST(object):
        ASYNC = 'ASYNC'
        SYNC = 'SYNC'



class PreviewDim(object):

    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height

    @classmethod
    def from_string(cls, dim: str) -> 'PreviewDim':
        """
        Alternative initialisation method, instead of setting width and height
        directly, we can give a valid [width]x[height] string to create
        a PreviewDim object
        """
        parts = dim.split('x')
        assert len(parts) == 2
        width, height = parts
        assert width.isdecimal()
        assert height.isdecimal()
        return PreviewDim(int(width), int(height))

    def __repr__(self):
        return "<PreviewDim width:{width} height:{height}>".format(
            width=self.width,
            height=self.height,
        )
