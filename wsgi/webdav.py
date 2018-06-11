# coding=utf-8
# Runner for uwsgi
from tracim.lib.webdav import WebdavAppFactory
import os

config_uri = os.environ['TRACIM_CONF_PATH']
webdav_config_uri = os.environ['TRACIM_WEBDAV_CONF_PATH']
app_factory = WebdavAppFactory(
    tracim_config_file_path=config_uri,
    webdav_config_file_path=webdav_config_uri,
)
application = app_factory.get_wsgi_app()
