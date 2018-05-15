# coding=utf-8
# Runner for uwsgi
from tracim.lib.webdav import WebdavAppFactory

APP_CONFIG = "development.ini"

app_factory = WebdavAppFactory(
    tracim_config_file_path=APP_CONFIG,
)
application = app_factory.get_wsgi_app()
