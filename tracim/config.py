# -*- coding: utf-8 -*-
from urllib.parse import urlparse
from paste.deploy.converters import asbool
from tracim.lib.utils.logger import logger
from depot.manager import DepotManager

from tracim.models.data import ActionDescription, ContentType


class CFG(object):
    """Object used for easy access to config file parameters."""

    def __setattr__(self, key, value):
        """
        Log-ready setter.

        Logs all configuration parameters except password.
        :param key:
        :param value:
        :return:
        """
        if 'PASSWORD' not in key and \
                ('URL' not in key or type(value) == str) and \
                'CONTENT' not in key:
            # We do not show PASSWORD for security reason
            # we do not show URL because At the time of configuration setup,
            # it can't be evaluated
            # We do not show CONTENT in order not to pollute log files
            logger.info(self, 'CONFIG: [ {} | {} ]'.format(key, value))
        else:
            logger.info(self, 'CONFIG: [ {} | <value not shown> ]'.format(key))

        self.__dict__[key] = value

    def __init__(self, settings):
        """Parse configuration file."""

        ###
        # General
        ###

        mandatory_msg = \
            'ERROR: {} configuration is mandatory. Set it before continuing.'
        self.DEPOT_STORAGE_DIR = settings.get(
            'depot_storage_dir',
        )
        if not self.DEPOT_STORAGE_DIR:
            raise Exception(
                mandatory_msg.format('depot_storage_dir')
            )
        self.DEPOT_STORAGE_NAME = settings.get(
            'depot_storage_name',
        )
        if not self.DEPOT_STORAGE_NAME:
            raise Exception(
                mandatory_msg.format('depot_storage_name')
            )
        self.PREVIEW_CACHE_DIR = settings.get(
            'preview_cache_dir',
        )
        if not self.PREVIEW_CACHE_DIR:
            raise Exception(
                'ERROR: preview_cache_dir configuration is mandatory. '
                'Set it before continuing.'
            )

        self.DATA_UPDATE_ALLOWED_DURATION = int(settings.get(
            'content.update.allowed.duration',
            0,
        ))

        self.WEBSITE_TITLE = settings.get(
            'website.title',
            'TRACIM',
        )

        self.WEBSITE_BASE_URL = settings.get(
            'website.base_url',
            '',
        )

        # TODO - G.M - 26-03-2018 - [Cleanup] These params seems deprecated for tracimv2,  # nopep8
        # Verify this
        #
        # self.WEBSITE_HOME_TITLE_COLOR = settings.get(
        #     'website.title.color',
        #     '#555',
        # )
        # self.WEBSITE_HOME_IMAGE_PATH = settings.get(
        #     '/assets/img/home_illustration.jpg',
        # )
        # self.WEBSITE_HOME_BACKGROUND_IMAGE_PATH = settings.get(
        #     '/assets/img/bg.jpg',
        # )
        #

        self.WEBSITE_SERVER_NAME = settings.get(
            'website.server_name',
            None,
        )

        if not self.WEBSITE_SERVER_NAME:
            self.WEBSITE_SERVER_NAME = urlparse(self.WEBSITE_BASE_URL).hostname
            logger.warning(
                self,
                'NOTE: Generated website.server_name parameter from '
                'website.base_url parameter -> {0}'
                .format(self.WEBSITE_SERVER_NAME)
            )

        self.WEBSITE_HOME_TAG_LINE = settings.get(
            'website.home.tag_line',
            '',
        )
        self.WEBSITE_SUBTITLE = settings.get(
            'website.home.subtitle',
            '',
        )
        self.WEBSITE_HOME_BELOW_LOGIN_FORM = settings.get(
            'website.home.below_login_form',
            '',
        )

        self.WEBSITE_TREEVIEW_CONTENT = settings.get(
            'website.treeview.content',
        )

        self.USER_AUTH_TOKEN_VALIDITY = int(settings.get(
            'user.auth_token.validity',
            '604800',
        ))

        self.DEBUG = asbool(settings.get('debug', False))
        # TODO - G.M - 27-03-2018 - [Email] Restore email config
        ###
        # EMAIL related stuff (notification, reply)
        ##

        self.EMAIL_NOTIFICATION_NOTIFIED_EVENTS = [
            ActionDescription.COMMENT,
            ActionDescription.CREATION,
            ActionDescription.EDITION,
            ActionDescription.REVISION,
            ActionDescription.STATUS_UPDATE
        ]

        self.EMAIL_NOTIFICATION_NOTIFIED_CONTENTS = [
            ContentType.Page,
            ContentType.Thread,
            ContentType.File,
            ContentType.Comment,
            # ContentType.Folder -- Folder is skipped
        ]
        if settings.get('email.notification.from'):
            raise Exception(
                'email.notification.from configuration is deprecated. '
                'Use instead email.notification.from.email and '
                'email.notification.from.default_label.'
            )

        self.EMAIL_NOTIFICATION_FROM_EMAIL = settings.get(
            'email.notification.from.email',
        )
        self.EMAIL_NOTIFICATION_FROM_DEFAULT_LABEL = settings.get(
            'email.notification.from.default_label'
        )
        self.EMAIL_NOTIFICATION_REPLY_TO_EMAIL = settings.get(
            'email.notification.reply_to.email',
        )
        self.EMAIL_NOTIFICATION_REFERENCES_EMAIL = settings.get(
            'email.notification.references.email'
        )
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_HTML = settings.get(
            'email.notification.content_update.template.html',
        )
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_TEXT = settings.get(
            'email.notification.content_update.template.text',
        )
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_HTML = settings.get(
            'email.notification.created_account.template.html',
            './tracim/templates/mail/created_account_body_html.mak',
        )
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_TEXT = settings.get(
            'email.notification.created_account.template.text',
            './tracim/templates/mail/created_account_body_text.mak',
        )
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_SUBJECT = settings.get(
            'email.notification.content_update.subject',
        )
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_SUBJECT = settings.get(
            'email.notification.created_account.subject',
            '[{website_title}] Created account',
        )
        self.EMAIL_NOTIFICATION_PROCESSING_MODE = settings.get(
            'email.notification.processing_mode',
        )

        self.EMAIL_NOTIFICATION_ACTIVATED = asbool(settings.get(
            'email.notification.activated',
        ))
        self.EMAIL_NOTIFICATION_SMTP_SERVER = settings.get(
            'email.notification.smtp.server',
        )
        self.EMAIL_NOTIFICATION_SMTP_PORT = settings.get(
            'email.notification.smtp.port',
        )
        self.EMAIL_NOTIFICATION_SMTP_USER = settings.get(
            'email.notification.smtp.user',
        )
        self.EMAIL_NOTIFICATION_SMTP_PASSWORD = settings.get(
            'email.notification.smtp.password',
        )
        self.EMAIL_NOTIFICATION_LOG_FILE_PATH = settings.get(
            'email.notification.log_file_path',
            None,
        )

        # self.EMAIL_REPLY_ACTIVATED = asbool(settings.get(
        #     'email.reply.activated',
        #     False,
        # ))
        #
        # self.EMAIL_REPLY_IMAP_SERVER = settings.get(
        #     'email.reply.imap.server',
        # )
        # self.EMAIL_REPLY_IMAP_PORT = settings.get(
        #     'email.reply.imap.port',
        # )
        # self.EMAIL_REPLY_IMAP_USER = settings.get(
        #     'email.reply.imap.user',
        # )
        # self.EMAIL_REPLY_IMAP_PASSWORD = settings.get(
        #     'email.reply.imap.password',
        # )
        # self.EMAIL_REPLY_IMAP_FOLDER = settings.get(
        #     'email.reply.imap.folder',
        # )
        # self.EMAIL_REPLY_CHECK_HEARTBEAT = int(settings.get(
        #     'email.reply.check.heartbeat',
        #     60,
        # ))
        # self.EMAIL_REPLY_TOKEN = settings.get(
        #     'email.reply.token',
        # )
        # self.EMAIL_REPLY_IMAP_USE_SSL = asbool(settings.get(
        #     'email.reply.imap.use_ssl',
        # ))
        # self.EMAIL_REPLY_IMAP_USE_IDLE = asbool(settings.get(
        #     'email.reply.imap.use_idle',
        #     True,
        # ))
        # self.EMAIL_REPLY_CONNECTION_MAX_LIFETIME = int(settings.get(
        #     'email.reply.connection.max_lifetime',
        #     600,  # 10 minutes
        # ))
        # self.EMAIL_REPLY_USE_HTML_PARSING = asbool(settings.get(
        #     'email.reply.use_html_parsing',
        #     True,
        # ))
        # self.EMAIL_REPLY_USE_TXT_PARSING = asbool(settings.get(
        #     'email.reply.use_txt_parsing',
        #     True,
        # ))
        # self.EMAIL_REPLY_LOCKFILE_PATH = settings.get(
        #     'email.reply.lockfile_path',
        #     ''
        # )
        # if not self.EMAIL_REPLY_LOCKFILE_PATH and self.EMAIL_REPLY_ACTIVATED:
        #     raise Exception(
        #         mandatory_msg.format('email.reply.lockfile_path')
        #     )
        #
        self.EMAIL_PROCESSING_MODE = settings.get(
            'email.processing_mode',
            'sync',
        ).upper()

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

        self.EMAIL_SENDER_REDIS_HOST = settings.get(
            'email.async.redis.host',
            'localhost',
        )
        self.EMAIL_SENDER_REDIS_PORT = int(settings.get(
            'email.async.redis.port',
            6379,
        ))
        self.EMAIL_SENDER_REDIS_DB = int(settings.get(
            'email.async.redis.db',
            0,
        ))

        ###
        # WSGIDAV (Webdav server)
        ###

        # TODO - G.M - 27-03-2018 - [WebDav] Restore wsgidav config
        #self.WSGIDAV_CONFIG_PATH = settings.get(
        #    'wsgidav.config_path',
        #    'wsgidav.conf',
        #)
        # TODO: Convert to importlib
        # http://stackoverflow.com/questions/41063938/use-importlib-instead-imp-for-non-py-file
        #self.wsgidav_config = imp.load_source(
        #    'wsgidav_config',
        #    self.WSGIDAV_CONFIG_PATH,
        #)
        # self.WSGIDAV_PORT = self.wsgidav_config.port
        # self.WSGIDAV_CLIENT_BASE_URL = settings.get(
        #     'wsgidav.client.base_url',
        #     None,
        # )
        #
        # if not self.WSGIDAV_CLIENT_BASE_URL:
        #     self.WSGIDAV_CLIENT_BASE_URL = \
        #         '{0}:{1}'.format(
        #             self.WEBSITE_SERVER_NAME,
        #             self.WSGIDAV_PORT,
        #         )
        #     logger.warning(self,
        #         'NOTE: Generated wsgidav.client.base_url parameter with '
        #         'followings parameters: website.server_name and '
        #         'wsgidav.conf port'.format(
        #             self.WSGIDAV_CLIENT_BASE_URL,
        #         )
        #     )
        #
        # if not self.WSGIDAV_CLIENT_BASE_URL.endswith('/'):
        #     self.WSGIDAV_CLIENT_BASE_URL += '/'

        # TODO - G.M - 27-03-2018 - [Caldav] Restore radicale config
        ###
        # RADICALE (Caldav server)
        ###
        # self.RADICALE_SERVER_HOST = settings.get(
        #     'radicale.server.host',
        #     '127.0.0.1',
        # )
        # self.RADICALE_SERVER_PORT = int(settings.get(
        #     'radicale.server.port',
        #     5232,
        # ))
        # # Note: Other parameters needed to work in SSL (cert file, etc)
        # self.RADICALE_SERVER_SSL = asbool(settings.get(
        #     'radicale.server.ssl',
        #     False,
        # ))
        # self.RADICALE_SERVER_FILE_SYSTEM_FOLDER = settings.get(
        #     'radicale.server.filesystem.folder',
        # )
        # if not self.RADICALE_SERVER_FILE_SYSTEM_FOLDER:
        #     raise Exception(
        #         mandatory_msg.format('radicale.server.filesystem.folder')
        #     )
        # self.RADICALE_SERVER_ALLOW_ORIGIN = settings.get(
        #     'radicale.server.allow_origin',
        #     None,
        # )
        # if not self.RADICALE_SERVER_ALLOW_ORIGIN:
        #     self.RADICALE_SERVER_ALLOW_ORIGIN = self.WEBSITE_BASE_URL
        #     logger.warning(self,
        #         'NOTE: Generated radicale.server.allow_origin parameter with '
        #         'followings parameters: website.base_url ({0})'
        #         .format(self.WEBSITE_BASE_URL)
        #     )
        #
        # self.RADICALE_SERVER_REALM_MESSAGE = settings.get(
        #     'radicale.server.realm_message',
        #     'Tracim Calendar - Password Required',
        # )
        #
        # self.RADICALE_CLIENT_BASE_URL_HOST = settings.get(
        #     'radicale.client.base_url.host',
        #     'http://{}:{}'.format(
        #         self.RADICALE_SERVER_HOST,
        #         self.RADICALE_SERVER_PORT,
        #     ),
        # )
        #
        # self.RADICALE_CLIENT_BASE_URL_PREFIX = settings.get(
        #     'radicale.client.base_url.prefix',
        #     '/',
        # )
        # # Ensure finished by '/'
        # if '/' != self.RADICALE_CLIENT_BASE_URL_PREFIX[-1]:
        #     self.RADICALE_CLIENT_BASE_URL_PREFIX += '/'
        # if '/' != self.RADICALE_CLIENT_BASE_URL_PREFIX[0]:
        #     self.RADICALE_CLIENT_BASE_URL_PREFIX \
        #         = '/' + self.RADICALE_CLIENT_BASE_URL_PREFIX
        #
        # if not self.RADICALE_CLIENT_BASE_URL_HOST:
        #     logger.warning(self,
        #         'Generated radicale.client.base_url.host parameter with '
        #         'followings parameters: website.server_name -> {}'
        #         .format(self.WEBSITE_SERVER_NAME)
        #     )
        #     self.RADICALE_CLIENT_BASE_URL_HOST = self.WEBSITE_SERVER_NAME
        #
        # self.RADICALE_CLIENT_BASE_URL_TEMPLATE = '{}{}'.format(
        #     self.RADICALE_CLIENT_BASE_URL_HOST,
        #     self.RADICALE_CLIENT_BASE_URL_PREFIX,
        # )

    def configure_filedepot(self):
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

        TREEVIEW_FOLDERS = 'folders'
        TREEVIEW_ALL = 'all'
