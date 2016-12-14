# -*- coding: utf-8 -*-
from paste.deploy import loadapp

application = loadapp('config:/tracim/tracim/config.ini')
application.debug = False
