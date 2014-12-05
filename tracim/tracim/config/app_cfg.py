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

import tg
from paste.deploy.converters import asbool

from tg.configuration import AppConfig
from tgext.pluggable import plug
from tgext.pluggable import replace_template

from tg.i18n import lazy_ugettext as l_

import tracim
from tracim import model
from tracim.lib.base import logger

base_config = AppConfig()
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


# Configure the authentication backend

# YOU MUST CHANGE THIS VALUE IN PRODUCTION TO SECURE YOUR APP 
base_config.sa_auth.cookie_secret = "3283411b-1904-4554-b0e1-883863b53080"

base_config.auth_backend = 'sqlalchemy'

# what is the class you want to use to search for users in the database
base_config.sa_auth.user_class = model.User

from tg.configuration.auth import TGAuthMetadata

from sqlalchemy import and_
#This tells to TurboGears how to retrieve the data for your user
class ApplicationAuthMetadata(TGAuthMetadata):

    def __init__(self, sa_auth):
        self.sa_auth = sa_auth

    def authenticate(self, environ, identity):
        user = self.sa_auth.dbsession.query(self.sa_auth.user_class).filter(and_(
            self.sa_auth.user_class.is_active==True,
            self.sa_auth.user_class.email==identity['login']
        )).first()

        if user and user.validate_password(identity['password']):
            return identity['login']
    def get_user(self, identity, userid):
        return self.sa_auth.dbsession.query(self.sa_auth.user_class).filter(and_(self.sa_auth.user_class.is_active==True, self.sa_auth.user_class.email==userid)).first()
    def get_groups(self, identity, userid):
        return [g.group_name for g in identity['user'].groups]
    def get_permissions(self, identity, userid):
        return [p.permission_name for p in identity['user'].permissions]

base_config.sa_auth.dbsession = model.DBSession

base_config.sa_auth.authmetadata = ApplicationAuthMetadata(base_config.sa_auth)

# You can use a different repoze.who Authenticator if you want to
# change the way users can login
#base_config.sa_auth.authenticators = [('myauth', SomeAuthenticator()]

# You can add more repoze.who metadata providers to fetch
# user metadata.
# Remember to set base_config.sa_auth.authmetadata to None
# to disable authmetadata and use only your own metadata providers
#base_config.sa_auth.mdproviders = [('myprovider', SomeMDProvider()]

# override this if you would like to provide a different who plugin for
# managing login and logout of your application
base_config.sa_auth.form_plugin = None

# You may optionally define a page where you want users to be redirected to
# on login:
base_config.sa_auth.post_login_url = '/post_login'

# You may optionally define a page where you want users to be redirected to
# on logout:
base_config.sa_auth.post_logout_url = '/post_logout'

# INFO - This is the way to specialize the resetpassword email properties
# plug(base_config, 'resetpassword', None, mail_subject=reset_password_email_subject)
plug(base_config, 'resetpassword', 'reset_password')

replace_template(base_config, 'resetpassword.templates.index', 'tracim.templates.reset_password_index')
replace_template(base_config, 'resetpassword.templates.change_password', 'mako:tracim.templates.reset_password_change_password')

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
        if 'PASSWORD' not in key and 'URL' not in key and 'CONTENT' not in key:
            # We do not show PASSWORD for security reason
            # we do not show URL because the associated config uses tg.lurl() which is evaluated when at display time.
            # At the time of configuration setup, it can't be evaluated
            # We do not show CONTENT in order not to pollute log files
            logger.info(self, 'CONFIG: [ {} | {} ]'.format(key, value))

        self.__dict__[key] = value

    def __init__(self):
        self.WEBSITE_TITLE = tg.config.get('website.title', 'TRACIM')
        self.WEBSITE_HOME_TITLE_COLOR = tg.config.get('website.title.color', '#555')
        self.WEBSITE_HOME_IMAGE_URL = tg.lurl('/assets/img/home_illustration.jpg')
        self.WEBSITE_HOME_BACKGROUND_IMAGE_URL = tg.lurl('/assets/img/bg.jpg')
        self.WEBSITE_BASE_URL = tg.config.get('website.base_url', '')

        self.WEBSITE_HOME_TAG_LINE = tg.config.get('website.home.tag_line', '')
        self.WEBSITE_SUBTITLE = tg.config.get('website.home.subtitle', '')
        self.WEBSITE_HOME_BELOW_LOGIN_FORM = tg.config.get('website.home.below_login_form', '')


        self.EMAIL_NOTIFICATION_FROM = tg.config.get('email.notification.from')
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_HTML = tg.config.get('email.notification.content_update.template.html')
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_TEMPLATE_TEXT = tg.config.get('email.notification.content_update.template.text')
        self.EMAIL_NOTIFICATION_CONTENT_UPDATE_SUBJECT = tg.config.get('email.notification.content_update.subject')
        self.EMAIL_NOTIFICATION_PROCESSING_MODE = tg.config.get('email.notification.processing_mode')


        self.EMAIL_NOTIFICATION_ACTIVATED = asbool(tg.config.get('email.notification.activated'))
        self.EMAIL_NOTIFICATION_SMTP_SERVER = tg.config.get('email.notification.smtp.server')
        self.EMAIL_NOTIFICATION_SMTP_PORT = tg.config.get('email.notification.smtp.port')
        self.EMAIL_NOTIFICATION_SMTP_USER = tg.config.get('email.notification.smtp.user')
        self.EMAIL_NOTIFICATION_SMTP_PASSWORD = tg.config.get('email.notification.smtp.password')

        self.TRACKER_JS_PATH = tg.config.get('js_tracker_path')
        self.TRACKER_JS_CONTENT = self.get_tracker_js_content(self.TRACKER_JS_PATH)

        self.WEBSITE_TREEVIEW_CONTENT = tg.config.get('website.treeview.content')


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
plug(base_config, 'tgext.asyncjob')