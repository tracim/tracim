# coding=utf-8
# Runner for uwsgi
import os

from tracim_backend.wsgi import web_app

config_uri = os.environ["TRACIM_CONF_PATH"]
application = web_app(config_uri)
