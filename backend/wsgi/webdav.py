# coding=utf-8
# Runner for uwsgi
import os

from tracim_backend.wsgi import webdav_app

config_uri = os.environ["TRACIM_CONF_PATH"]
application = webdav_app(config_uri)
