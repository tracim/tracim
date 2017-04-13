# -*- coding: utf-8 -*-
"""
Global configuration file for TG2-specific settings in tracim.

This file complements development/deployment.ini.

Please note that **all the argument values are strings**. If you want to
convert them into boolean, for example, you should use the
:func:`paste.deploy.converters.asbool` function, as in::

    from paste.deploy.converters import asbool
    setting = asbool(global_conf.get('the_setting'))

"""
import imp
import importlib
import os
from urllib.parse import urlparse

import tg
from paste.deploy.converters import asbool
from tg.configuration.milestones import environment_loaded

from tgext.pluggable import plug
from tgext.pluggable import replace_template
from tracim.lib.system import InterruptManager

from tracim.lib.utils import lazy_ugettext as l_

import tracim
from tracim import model
from tracim.config import TracimAppConfig
from tracim.lib.base import logger
from tracim.lib.daemons import DaemonsManager
from tracim.lib.daemons import MailSenderDaemon
from tracim.lib.daemons import RadicaleDaemon
from tracim.lib.daemons import WsgiDavDaemon
from tracim.model.data import ActionDescription
from tracim.model.data import ContentType

base_config = TracimAppConfig()
base_config.renderers = []
base_config.use_toscawidgets = False
base_config.use_toscawidgets2 = True

base_config.package = tracim

#Enable json in expose
base_config.renderers.append('json')
#Enable genshi in expose to have a lingua franca for extensions and pluggable apps
#you can remove this if you don't plan to use it.
base_config.renderers.append('genshi')

#Set the default renderer
base_config.default_renderer = 'mako'
base_config.renderers.append('mako')
#Configure the base SQLALchemy Setup
base_config.use_sqlalchemy = True
base_config.model = tracim.model
base_config.DBSession = tracim.model.DBSession

# This value can be modified by tracim.lib.auth.wrapper.AuthConfigWrapper but have to be specified before
base_config.auth_backend = 'sqlalchemy'

# base_config.flash.cookie_name
# base_config.flash.default_status -> Default message status if not specified (ok by default)
base_config['flash.template'] = '''
<div class="alert alert-${status}" style="margin-top: 1em;">
    <button type="button" class="close" data-dismiss="alert">&times;</button>
    <div id="${container_id}">
        <img src="/assets/icons/32x32/status/flash-${status}.png"/>
        ${message}
    </div>
</div>
'''
# -> string.Template instance used as the flash template when rendered from server side, will receive $container_id, $message and $status variables.
# flash.js_call -> javascript code which will be run when displaying the flash from javascript. Default is webflash.render(), you can use webflash.payload() to retrieve the message and show it with your favourite library.
# flash.js_template -> string.Template instance used to replace full javascript support for flash messages. When rendering flash message for javascript usage the following code will be used instead of providing the standard webflash object. If you replace js_template you must also ensure cookie parsing and delete it for already displayed messages. The template will receive: $container_id, $cookie_name, $js_call variables.

base_config['templating.genshi.name_constant_patch'] = True

# Configure the authentication backend

# YOU MUST CHANGE THIS VALUE IN PRODUCTION TO SECURE YOUR APP
base_config.sa_auth.cookie_secret = "3283411b-1904-4554-b0e1-883863b53080"

# INFO - This is the way to specialize the resetpassword email properties
# plug(base_config, 'resetpassword', None, mail_subject=reset_password_email_subject)
plug(base_config, 'resetpassword', 'reset_password')

replace_template(base_config, 'resetpassword.templates.index', 'tracim.templates.reset_password_index')
replace_template(base_config, 'resetpassword.templates.change_password', 'mako:tracim.templates.reset_password_change_password')

daemons = DaemonsManager()


def start_daemons(manager: DaemonsManager):
    """
    Sart Tracim daemons
    """
    from tg import config
    cfg = CFG.get_instance()
    # Don't start daemons if they are disabled
    if config.get('disable_daemons', False):
        return

    manager.run('radicale', RadicaleDaemon)
    manager.run('webdav', WsgiDavDaemon)

    if cfg.EMAIL_PROCESSING_MODE == CFG.CST.ASYNC:
        manager.run('mail_sender', MailSenderDaemon)

environment_loaded.register(lambda: start_daemons(daemons))
interrupt_manager = InterruptManager(os.getpid(), daemons_manager=daemons)

# Note: here are fake translatable strings that allow to translate messages for reset password email content
duplicated_email_subject = l_('Password reset request')
duplicated_email_body = l_('''
We've received a request to reset the password for this account.
Please click this link to reset your password:

%(password_reset_link)s

If you no longer wish to make the above change, or if you did not initiate this request, please disregard and/or delete this e-mail.
''')

#######
#
# INFO - D.A. - 2014-10-31
# The following code is a dirty way to integrate translation for resetpassword tgapp in tracim
# TODO - Integrate these translations into tgapp-resetpassword
#

l_('New password')
l_('Confirm new password')
l_('Save new password')
l_('Email address')
l_('Send Request')


l_('Password reset request sent')
l_('Invalid password reset request')
l_('Password reset request timed out')
l_('Invalid password reset request')
l_('Password changed successfully')

l_('''
We've received a request to reset the password for this account.
Please click this link to reset your password:

%(password_reset_link)s

If you no longer wish to make the above change, or if you did not initiate this request, please disregard and/or delete this e-mail.
''')

class CFG(object):
    """
    Singleton used for easy access to config file parameters
    """

    _instance = None

    @classmethod
    def get_instance(cls) -> 'CFG':
        if not CFG._instance:
            CFG._instance = CFG()
        return CFG._instance

    def __setattr__(self, key, value):
        """
        Log-ready setter. this is used for logging configuration (every parameter except password)
        :param key:
        :param value:
        :return:
        """
        if 'PASSWORD' not in key and \
                ('URL' not in key or type(value) == str) and \
                'CONTENT' not in key:
            # We do not show PASSWORD for security reason
            # we do not show URL because the associated config uses tg.lurl() which is evaluated when at display time.
            # At the time of configuration setup, it can't be evaluated
            # We do not show CONTENT in order not to pollute log files
            logger.info(self, 'CONFIG: [ {} | {} ]'.format(key, value))
        else:
            logger.info(self, 'CONFIG: [ {} | <value not shown> ]'.format(key))

        self.__dict__[key] = value

    def __init__(self):

        self.DATA_UPDATE_ALLOWED_DURATION = int(tg.config.get('content.update.allowed.duration', 0))

        self.WEBSITE_TITLE = tg.config.get('website.title', 'TRACIM')
        self.WEBSITE_HOME_TITLE_COLOR = tg.config.get('website.title.color', '#555')
        self.WEBSITE_HOME_IMAGE_URL = tg.lurl('/assets/img/home_illustration.jpg')
        self.WEBSITE_HOME_BACKGROUND_IMAGE_URL = tg.lurl('/assets/img/bg.jpg')
        self.WEBSITE_BASE_URL = tg.config.get('website.base_url', '')
        self.WEBSITE_SERVER_NAME = tg.config.get('website.server_name', None)

        if not self.WEBSITE_SERVER_NAME:
            self.WEBSITE_SERVER_NAME = urlparse(self.WEBSITE_BASE_URL).hostname
            logger.warning(
                self,
                'NOTE: Generated website.server_name parameter from '
                'website.base_url parameter -> {0}'
                .format(self.WEBSITE_SERVER_NAME)
            )

        self.WEBSITE_HOME_TAG_LINE = tg.config.get('website.home.tag_line', '')
        self.WEBSITE_SUBTITLE = tg.config.get('website.home.subtitle', '')
        self.WEBSITE_HOME_BELOW_LOGIN_FORM = tg.config.get('website.home.below_login_form', '')

        if tg.config.get('email.notification.from'):
            raise Exception(
                'email.notification.from configuration is deprecated. '
                'Use instead email.notification.from.email and '
                'email.notification.from.default_label.'
            )

        self.EMAIL_NOTIFICATION_FROM_EMAIL = \
            tg.config.get('email.notification.from.email')
        self.EMAIL_NOTIFICATION_FROM_DEFAULT_LABEL = \
            tg.config.get('email.notification.from.default_label')
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_HTML = tg.config.get('email.notification.content_update.template.html')
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_TEXT = tg.config.get('email.notification.content_update.template.text')
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_HTML = tg.config.get(
            'email.notification.created_account.template.html',
            './tracim/templates/mail/created_account_body_html.mak',
        )
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_TEMPLATE_TEXT = tg.config.get(
            'email.notification.created_account.template.text',
            './tracim/templates/mail/created_account_body_text.mak',
        )
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_SUBJECT = tg.config.get('email.notification.content_update.subject')
        self.EMAIL_NOTIFICATION_CREATED_ACCOUNT_SUBJECT = tg.config.get(
            'email.notification.created_account.subject',
            '[{website_title}] Created account',
        )
        self.EMAIL_NOTIFICATION_PROCESSING_MODE = tg.config.get('email.notification.processing_mode')


        self.EMAIL_NOTIFICATION_ACTIVATED = asbool(tg.config.get('email.notification.activated'))
        self.EMAIL_NOTIFICATION_SMTP_SERVER = tg.config.get('email.notification.smtp.server')
        self.EMAIL_NOTIFICATION_SMTP_PORT = tg.config.get('email.notification.smtp.port')
        self.EMAIL_NOTIFICATION_SMTP_USER = tg.config.get('email.notification.smtp.user')
        self.EMAIL_NOTIFICATION_SMTP_PASSWORD = tg.config.get('email.notification.smtp.password')

        self.TRACKER_JS_PATH = tg.config.get('js_tracker_path')
        self.TRACKER_JS_CONTENT = self.get_tracker_js_content(self.TRACKER_JS_PATH)

        self.WEBSITE_TREEVIEW_CONTENT = tg.config.get('website.treeview.content')

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

        self.RADICALE_SERVER_HOST = tg.config.get('radicale.server.host', '0.0.0.0')
        self.RADICALE_SERVER_PORT = int(
            tg.config.get('radicale.server.port', 5232)
        )
        # Note: Other parameters needed to work in SSL (cert file, etc)
        self.RADICALE_SERVER_SSL = asbool(tg.config.get('radicale.server.ssl', False))
        self.RADICALE_SERVER_FILE_SYSTEM_FOLDER = tg.config.get(
            'radicale.server.filesystem.folder',
            './radicale/collections',
        )
        self.RADICALE_SERVER_ALLOW_ORIGIN = tg.config.get(
            'radicale.server.allow_origin',
            None,
        )
        if not self.RADICALE_SERVER_ALLOW_ORIGIN:
            self.RADICALE_SERVER_ALLOW_ORIGIN = self.WEBSITE_BASE_URL
            logger.warning(
                self,
                'NOTE: Generated radicale.server.allow_origin parameter with '
                'followings parameters: website.base_url ({0})'
                .format(self.WEBSITE_BASE_URL)
            )

        self.RADICALE_SERVER_REALM_MESSAGE = tg.config.get(
            'radicale.server.realm_message',
            'Tracim Calendar - Password Required',
        )

        self.RADICALE_CLIENT_BASE_URL_HOST = \
            tg.config.get('radicale.client.base_url.host', None)

        self.RADICALE_CLIENT_BASE_URL_PREFIX = \
            tg.config.get('radicale.client.base_url.prefix', '/')
        # Ensure finished by '/'
        if '/' != self.RADICALE_CLIENT_BASE_URL_PREFIX[-1]:
            self.RADICALE_CLIENT_BASE_URL_PREFIX += '/'
        if '/' != self.RADICALE_CLIENT_BASE_URL_PREFIX[0]:
            self.RADICALE_CLIENT_BASE_URL_PREFIX \
                = '/' + self.RADICALE_CLIENT_BASE_URL_PREFIX

        if not self.RADICALE_CLIENT_BASE_URL_HOST:
            logger.warning(
                self,
                'Generated radicale.client.base_url.host parameter with '
                'followings parameters: website.server_name -> {}'
                .format(self.WEBSITE_SERVER_NAME)
            )
            self.RADICALE_CLIENT_BASE_URL_HOST = self.WEBSITE_SERVER_NAME

        self.RADICALE_CLIENT_BASE_URL_TEMPLATE = '{}{}'.format(
            self.RADICALE_CLIENT_BASE_URL_HOST,
            self.RADICALE_CLIENT_BASE_URL_PREFIX,
        )

        self.USER_AUTH_TOKEN_VALIDITY = int(tg.config.get(
            'user.auth_token.validity',
            '604800',
        ))

        self.WSGIDAV_CONFIG_PATH = tg.config.get(
            'wsgidav.config_path',
            'wsgidav.conf',
        )
        # TODO: Convert to importlib (cf http://stackoverflow.com/questions/41063938/use-importlib-instead-imp-for-non-py-file)
        self.wsgidav_config = imp.load_source(
            'wsgidav_config',
            self.WSGIDAV_CONFIG_PATH,
        )
        self.WSGIDAV_PORT = self.wsgidav_config.port
        self.WSGIDAV_CLIENT_BASE_URL = \
            tg.config.get('wsgidav.client.base_url', None)

        if not self.WSGIDAV_CLIENT_BASE_URL:
            self.WSGIDAV_CLIENT_BASE_URL = \
                '{0}:{1}'.format(
                    self.WEBSITE_SERVER_NAME,
                    self.WSGIDAV_PORT,
                )
            logger.warning(
                self,
                'NOTE: Generated wsgidav.client.base_url parameter with '
                'followings parameters: website.server_name and '
                'wsgidav.conf port'.format(
                    self.WSGIDAV_CLIENT_BASE_URL,
                )
            )

        if not self.WSGIDAV_CLIENT_BASE_URL.endswith('/'):
            self.WSGIDAV_CLIENT_BASE_URL += '/'

        self.EMAIL_PROCESSING_MODE = tg.config.get(
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

        self.EMAIL_SENDER_REDIS_HOST = tg.config.get(
            'email.async.redis.host',
            'localhost',
        )
        self.EMAIL_SENDER_REDIS_PORT = int(tg.config.get(
            'email.async.redis.port',
            6379,
        ))
        self.EMAIL_SENDER_REDIS_DB = int(tg.config.get(
            'email.async.redis.db',
            0,
        ))

    def get_tracker_js_content(self, js_tracker_file_path = None):
        js_tracker_file_path = tg.config.get('js_tracker_path', None)
        if js_tracker_file_path:
            logger.info(self, 'Reading JS tracking code from file {}'.format(js_tracker_file_path))
            with open (js_tracker_file_path, 'r') as js_file:
                data = js_file.read()
            return data
        else:
            return ''



    class CST(object):
        ASYNC = 'ASYNC'
        SYNC = 'SYNC'

        TREEVIEW_FOLDERS = 'folders'
        TREEVIEW_ALL = 'all'

#######
#
# INFO - D.A. - 2014-11-05
# Allow to process asynchronous tasks
# This is used for email notifications
#

# import tgext.asyncjob
# tgext.asyncjob.plugme(base_config)
#
# OR
#
# plug(base_config, 'tgext.asyncjob', app_globals=base_config)
#
# OR
#

# Add some variable to each templates
base_config.variable_provider = lambda: {
    'CFG': CFG.get_instance()
}
