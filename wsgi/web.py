# coding=utf-8
# Runner for uwsgi
import os
import pyramid.paster

config_uri = os.environ['TRACIM_CONF_PATH']

pyramid.paster.setup_logging(config_uri)
application = pyramid.paster.get_app(config_uri)
