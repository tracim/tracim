# coding=utf-8
# Runner for uwsgi
import os

from tracim_backend.wsgi import caldav_app

config_uri = os.environ["TRACIM_CONF_PATH"]
application = caldav_app(config_uri)
