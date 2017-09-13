# -*- coding: utf-8 -*-

APP_CONFIG = "/var/www/tracim/tracim/development.ini"

#Setup logging
# import logging
# logging.config.fileConfig(APP_CONFIG)

#Load the application
from paste.deploy import loadapp
application = loadapp('config:%s' % APP_CONFIG)
application.debug = False
