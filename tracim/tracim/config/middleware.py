# -*- coding: utf-8 -*-
"""WSGI middleware initialization for the tracim application."""

from tracim.config.app_cfg import base_config
from tracim.config.environment import load_environment
from tracim.lib.daemons import DaemonsManager
from tracim.lib.daemons import RadicaleDaemon

__all__ = ['make_app']

# Use base_config to setup the necessary PasteDeploy application factory. 
# make_base_app will wrap the TG2 app with all the middleware it needs. 
make_base_app = base_config.setup_tg_wsgi_app(load_environment)


def make_app(global_conf, full_stack=True, **app_conf):
    """
    Set tracim up with the settings found in the PasteDeploy configuration
    file used.
    
    :param global_conf: The global settings for tracim (those
        defined under the ``[DEFAULT]`` section).
    :type global_conf: dict
    :param full_stack: Should the whole TG2 stack be set up?
    :type full_stack: str or bool
    :return: The tracim application with all the relevant middleware
        loaded.
    
    This is the PasteDeploy factory for the tracim application.
    
    ``app_conf`` contains all the application-specific settings (those defined
    under ``[app:main]``.
    
   
    """
    app = make_base_app(global_conf, full_stack=True, **app_conf)
    
    # Wrap your base TurboGears 2 application with custom middleware here
    daemons = DaemonsManager(app)
    daemons.run('radicale', RadicaleDaemon)

    return app
