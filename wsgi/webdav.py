# coding=utf-8
# Runner for uwsgi
import os
from wsgi import webdav_app

config_uri = os.environ['TRACIM_CONF_PATH']
application = webdav_app(config_uri)
