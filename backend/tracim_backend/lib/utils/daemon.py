import os

from pyramid.paster import get_appsettings
from pyramid.paster import setup_logging

from tracim_backend.config import CFG


class FakeDaemon(object):
    """
    Temporary class for transition between tracim 1 and tracim 2
    """

    def __init__(self, *args, **kwargs):
        pass


def initialize_config_from_environment() -> CFG:
    config_uri = os.environ["TRACIM_CONF_PATH"]
    setup_logging(config_uri)
    settings = get_appsettings(config_uri)
    settings.update(settings.global_conf)
    app_config = CFG(settings)
    app_config.configure_filedepot()
    return app_config
