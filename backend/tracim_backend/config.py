# -*- coding: utf-8 -*-
import json
from collections import OrderedDict
from urllib.parse import urlparse

import os

import typing

from paste.deploy.converters import asbool
from tracim_backend.app_models.validator import update_validators
from tracim_backend.extensions import app_list
from tracim_backend.lib.utils.logger import logger
from depot.manager import DepotManager
from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.models import Group
from tracim_backend.models.data import ActionDescription


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
        backend_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # nopep8
        tracim_v2_folder = os.path.dirname(backend_folder)
        default_color_config_file_path = os.path.join(tracim_v2_folder, 'color.json')  # nopep8
        self.COLOR_CONFIG_FILE_PATH = settings.get(
            'color.config_file_path', default_color_config_file_path
        )
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
                'Error: {} file could not be load as json'.format(self.COLOR_CONFIG_FILE_PATH) # nopep8
            ) from e

        try:
            self.APPS_COLORS['primary']
        except KeyError as e:
            raise Exception(
                'Error: primary color is required in {} file'.format(
                    self.COLOR_CONFIG_FILE_PATH)  # nopep8
            ) from e

        default_enabled_app = [
            'contents/thread',
            'contents/file',
            'contents/html-document',
        ]
        enabled_app = []
        enabled_app_str = settings.get('app.enabled', None)
        if enabled_app_str:
            for app in enabled_app_str.split(','):
                app_name = app.strip()
                enabled_app.append(app_name)
        else:
            enabled_app = default_enabled_app
        self.ENABLED_APP = enabled_app
        self._set_default_app(self.ENABLED_APP)
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

        # TODO - G.M - 2018-09-11 - Deprecated param
        # self.DATA_UPDATE_ALLOWED_DURATION = int(settings.get(
        #     'content.update.allowed.duration',
        #     0,
        # ))

        self.API_KEY = settings.get(
            'api.key',
            ''
        )
        self.SESSION_REISSUE_TIME = int(settings.get(
            'session.reissue_time',
            120
        ))
        self.WEBSITE_TITLE = settings.get(
            'website.title',
            'TRACIM',
        )

        # base url of the frontend
        self.WEBSITE_BASE_URL = settings.get(
            'website.base_url',
            '',
        )
        if not self.WEBSITE_BASE_URL:
            raise Exception(
                'website.base_url is needed in order to have correct path in'
                'few place like in email.'
                'You should set it with frontend root url.'
            )

        self.API_BASE_URL = settings.get(
            'api.base_url',
            self.WEBSITE_BASE_URL,
        )
        allowed_origin = []
        allowed_origin_string = settings.get(
            'cors.access-control-allowed-origin',
            ''
        )
        if allowed_origin_string:
            allowed_origin.extend(allowed_origin_string.split(','))  # nopep8
        if not allowed_origin:
            allowed_origin.append(self.WEBSITE_BASE_URL)
            if self.API_BASE_URL != self.WEBSITE_BASE_URL:
                allowed_origin.append(self.API_BASE_URL)
        self.CORS_ALLOWED_ORIGIN = allowed_origin

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
        website_server_name = settings.get(
            'website.server_name',
            None,
        )
        if not website_server_name:
            website_server_name= urlparse(self.WEBSITE_BASE_URL).hostname
            logger.warning(
                self,
                'NOTE: Generated website.server_name parameter from '
                'website.base_url parameter -> {0}'
                .format(website_server_name)
            )
        self.WEBSITE_SERVER_NAME = website_server_name
        # TODO - G.M - 2018-09-11 - Deprecated params
        # self.WEBSITE_HOME_TAG_LINE = settings.get(
        #     'website.home.tag_line',
        #     '',
        # )
        # self.WEBSITE_SUBTITLE = settings.get(
        #     'website.home.subtitle',
        #     '',
        # )
        # self.WEBSITE_HOME_BELOW_LOGIN_FORM = settings.get(
        #     'website.home.below_login_form',
        #     '',
        # )
        #
        # self.WEBSITE_TREEVIEW_CONTENT = settings.get(
        #     'website.treeview.content',
        # )

        self.USER_AUTH_TOKEN_VALIDITY = int(settings.get(
            'user.auth_token.validity',
            '604800',
        ))
        self.USER_RESET_PASSWORD_TOKEN_VALIDITY = int(settings.get(
            'user.reset_password.validity',
            '900'
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
            content_type_list.Page.slug,
            content_type_list.Thread.slug,
            content_type_list.File.slug,
            content_type_list.Comment.slug,
            # content_type_list.Folder.slug -- Folder is skipped
        ]
        if settings.get('email.notification.from'):
            raise Exception(
                'email.notification.from configuration is deprecated. '
                'Use instead email.notification.from.email and '
                'email.notification.from.default_label.'
            )
        self.EMAIL_NOTIFICATION_FROM_EMAIL = settings.get(
            'email.notification.from.email',
            'noreply+{user_id}@trac.im'
        )
        self.EMAIL_NOTIFICATION_FROM_DEFAULT_LABEL = settings.get(
            'email.notification.from.default_label',
            'Tracim Notifications'
        )
        self.EMAIL_NOTIFICATION_REPLY_TO_EMAIL = settings.get(
            'email.notification.reply_to.email',
        )
        self.EMAIL_NOTIFICATION_REFERENCES_EMAIL = settings.get(
            'email.notification.references.email'
        )
        # Content update notification
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_HTML = settings.get(
            'email.notification.content_update.template.html',
        )
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_TEXT = settings.get(
            'email.notification.content_update.template.text',
        )
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_SUBJECT = settings.get(
            'email.notification.content_update.subject',
        )
        # Created account notification
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_HTML = settings.get(
            'email.notification.created_account.template.html',
            './tracim_backend/templates/mail/created_account_body_html.mak',
        )
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_TEXT = settings.get(
            'email.notification.created_account.template.text',
            './tracim_backend/templates/mail/created_account_body_text.mak',
        )
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_SUBJECT = settings.get(
            'email.notification.created_account.subject',
            '[{website_title}] Created account',
        )

        # Reset password notification
        self.EMAIL_NOTIFICATION_RESET_PASSWORD_TEMPLATE_HTML = settings.get(
            'email.notification.reset_password_request.template.html',
            './tracim_backend/templates/mail/reset_password_body_html.mak',
        )
        self.EMAIL_NOTIFICATION_RESET_PASSWORD_TEMPLATE_TEXT = settings.get(
            'email.notification.reset_password_request.template.text',
            './tracim_backend/templates/mail/reset_password_body_text.mak',
        )
        self.EMAIL_NOTIFICATION_RESET_PASSWORD_SUBJECT = settings.get(
            'email.notification.reset_password_request.subject',
            '[{website_title}] Reset Password Request'
        )

        self.EMAIL_NOTIFICATION_PROCESSING_MODE = settings.get(
            'email.notification.processing_mode',
        )

        self.EMAIL_NOTIFICATION_ACTIVATED = asbool(settings.get(
            'email.notification.activated',
        ))
        if not self.EMAIL_NOTIFICATION_ACTIVATED:
            logger.warning(
                self,
                'Notification by email mecanism is disabled ! '
                'Notification and mail invitation mecanisms will not work.'
            )
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

        self.EMAIL_REPLY_ACTIVATED = asbool(settings.get(
            'email.reply.activated',
            False,
        ))

        self.EMAIL_REPLY_IMAP_SERVER = settings.get(
            'email.reply.imap.server',
        )
        self.EMAIL_REPLY_IMAP_PORT = settings.get(
            'email.reply.imap.port',
        )
        self.EMAIL_REPLY_IMAP_USER = settings.get(
            'email.reply.imap.user',
        )
        self.EMAIL_REPLY_IMAP_PASSWORD = settings.get(
            'email.reply.imap.password',
        )
        self.EMAIL_REPLY_IMAP_FOLDER = settings.get(
            'email.reply.imap.folder',
        )
        self.EMAIL_REPLY_CHECK_HEARTBEAT = int(settings.get(
            'email.reply.check.heartbeat',
            60,
        ))
        self.EMAIL_REPLY_TOKEN = settings.get(
            'email.reply.token',
        )
        self.EMAIL_REPLY_IMAP_USE_SSL = asbool(settings.get(
            'email.reply.imap.use_ssl',
        ))
        self.EMAIL_REPLY_IMAP_USE_IDLE = asbool(settings.get(
            'email.reply.imap.use_idle',
            True,
        ))
        self.EMAIL_REPLY_CONNECTION_MAX_LIFETIME = int(settings.get(
            'email.reply.connection.max_lifetime',
            600,  # 10 minutes
        ))
        self.EMAIL_REPLY_USE_HTML_PARSING = asbool(settings.get(
            'email.reply.use_html_parsing',
            True,
        ))
        self.EMAIL_REPLY_USE_TXT_PARSING = asbool(settings.get(
            'email.reply.use_txt_parsing',
            True,
        ))
        self.EMAIL_REPLY_LOCKFILE_PATH = settings.get(
            'email.reply.lockfile_path',
            ''
        )
        if not self.EMAIL_REPLY_LOCKFILE_PATH and self.EMAIL_REPLY_ACTIVATED:
            raise Exception(
                mandatory_msg.format('email.reply.lockfile_path')
            )

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
        self.INVITE_NEW_USER_MINIMAL_PROFILE = settings.get(
            'invitation.new_user.minimal_profile',
            Group.TIM_MANAGER_GROUPNAME
        )
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
        self.PREVIEW_JPG_RESTRICTED_DIMS = asbool(settings.get(
            'preview.jpg.restricted_dims', False
        ))
        preview_jpg_allowed_dims_str = settings.get('preview.jpg.allowed_dims', '')  # nopep8
        allowed_dims = []
        if preview_jpg_allowed_dims_str:
            for sizes in preview_jpg_allowed_dims_str.split(','):
                parts = sizes.split('x')
                assert len(parts) == 2
                width, height = parts
                assert width.isdecimal()
                assert height.isdecimal()
                size = PreviewDim(int(width), int(height))
                allowed_dims.append(size)

        if not allowed_dims:
            size = PreviewDim(256, 256)
            allowed_dims.append(size)

        self.PREVIEW_JPG_ALLOWED_DIMS = allowed_dims

        self.FRONTEND_SERVE = asbool(settings.get(
            'frontend.serve', False
        ))
        # INFO - G.M - 2018-08-06 - we pretend that frontend_dist_folder
        # is probably in frontend subfolder
        # of tracim_v2 parent of both backend and frontend
        backend_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # nopep8
        tracim_v2_folder = os.path.dirname(backend_folder)
        backend_i18n_folder = os.path.join(backend_folder,'tracim_backend', 'locale')  # nopep8

        self.BACKEND_I18N_FOLDER = settings.get(
            'backend.18n_folder_path', backend_i18n_folder
        )
        if not os.path.isdir(self.BACKEND_I18N_FOLDER):
            raise Exception(
                'ERROR: {} folder does not exist as folder. '
                'please set backend.i8n_folder_path'
                'with a correct value'.format(self.BACKEND_I18N_FOLDER)
            )

        frontend_dist_folder = os.path.join(tracim_v2_folder, 'frontend', 'dist')  # nopep8
        self.FRONTEND_DIST_FOLDER_PATH = settings.get(
            'frontend.dist_folder_path', frontend_dist_folder
        )

        # INFO - G.M - 2018-08-06 - We check dist folder existence
        if self.FRONTEND_SERVE and not os.path.isdir(self.FRONTEND_DIST_FOLDER_PATH):  # nopep8
            raise Exception(
                'ERROR: {} folder does not exist as folder. '
                'please set frontend.dist_folder.path'
                'with a correct value'.format(self.FRONTEND_DIST_FOLDER_PATH)
            )

    def configure_filedepot(self):

        # TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
        # of tracim_backend, Be careful DepotManager is a Singleton !

        depot_storage_name = self.DEPOT_STORAGE_NAME
        depot_storage_path = self.DEPOT_STORAGE_DIR
        depot_storage_settings = {'depot.storage_path': depot_storage_path}
        DepotManager.configure(
            depot_storage_name,
            depot_storage_settings,
        )

    def _set_default_app(self, enabled_app_list: typing.List[str]):

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
            fa_icon='folder-open-o',
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
            is_active=False,
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

    class CST(object):
        ASYNC = 'ASYNC'
        SYNC = 'SYNC'

        TREEVIEW_FOLDERS = 'folders'
        TREEVIEW_ALL = 'all'


class PreviewDim(object):

    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height

    def __repr__(self):
        return "<PreviewDim width:{width} height:{height}>".format(
            width=self.width,
            height=self.height,
        )
