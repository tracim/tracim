# -*- coding: utf-8 -*-

APP_CONFIG = '{{ instance.tracim_config_file_path }}'

# Setup logging
import logging
import logging.config
logging.config.fileConfig('/tracim/tracim/config.ini')

from paste.deploy import loadapp
application = loadapp('config:/tracim/tracim/config.ini')
application.debug = False
