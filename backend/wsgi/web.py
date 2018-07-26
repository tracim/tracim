# coding=utf-8
# Runner for uwsgi
import os
from wsgi import web_app

config_uri = os.environ['TRACIM_CONF_PATH']
application = web_app(config_uri)
