# coding=utf-8
# Runner for uwsgi
from tracim.lib.webdav import WebdavAppFactory
import os

config_uri = os.environ['TRACIM_CONF_PATH']
app_factory = WebdavAppFactory(
    tracim_config_file_path=config_uri,
)
application = app_factory.get_wsgi_app()
