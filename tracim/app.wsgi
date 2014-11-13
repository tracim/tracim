# -*- coding: utf-8 -*-

APP_CONFIG = "/opt/traciminstallpath/development.ini"

#Setup logging
# import logging
# logging.config.fileConfig(APP_CONFIG)

#Load the application
from paste.deploy import loadapp
application = loadapp('config:%s' % APP_CONFIG)
application.debug = False

