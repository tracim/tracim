import json
import sys
import os
from pyramid.paster import get_appsettings
from waitress import serve
from wsgidav.wsgidav_app import DEFAULT_CONFIG
from wsgidav.xml_tools import useLxml
from wsgidav.wsgidav_app import WsgiDAVApp

from tracim import CFG
from tracim.lib.utils.utils import DEFAULT_TRACIM_CONFIG_FILE, \
    DEFAULT_WEBDAV_CONFIG_FILE
from tracim.lib.webdav.dav_provider import Provider
from tracim.lib.webdav.authentification import TracimDomainController
from wsgidav.dir_browser import WsgiDavDirBrowser
from wsgidav.http_authenticator import HTTPAuthenticator
from wsgidav.error_printer import ErrorPrinter
from tracim.lib.webdav.middlewares import TracimWsgiDavDebugFilter, \
    TracimEnforceHTTPS, TracimEnv, TracimUserSession

from inspect import isfunction
import traceback

from tracim.models import get_engine, get_session_factory


class WebdavAppFactory(object):

    def __init__(self,
                 tracim_config_file_path: str = None,
                 ):
        self.config = self._initConfig(
            tracim_config_file_path
        )

    def _initConfig(self,
                    tracim_config_file_path: str = None
                    ):
        """Setup configuration dictionary from default,
         command line and configuration file."""
        if not tracim_config_file_path:
            tracim_config_file_path = DEFAULT_TRACIM_CONFIG_FILE

        # Set config defaults
        config = DEFAULT_CONFIG.copy()
        temp_verbose = config["verbose"]
        # Get pyramid Env
        tracim_config_file_path = os.path.abspath(tracim_config_file_path)
        config['tracim_config'] = tracim_config_file_path
        settings = self._get_tracim_settings(config)
        app_config = CFG(settings)

        default_config_file = os.path.abspath(settings['wsgidav.config_path'])
        webdav_config_file = self._readConfigFile(
            default_config_file,
            temp_verbose
            )
        # Configuration file overrides defaults
        config.update(webdav_config_file)

        if not useLxml and config["verbose"] >= 1:
            print(
                "WARNING: Could not import lxml: using xml instead (slower). "
                "consider installing lxml from http://codespeak.net/lxml/."
            )

        config['middleware_stack'] = [
            TracimEnforceHTTPS,
            WsgiDavDirBrowser,
            TracimUserSession,
            HTTPAuthenticator,
            ErrorPrinter,
            TracimWsgiDavDebugFilter,
            TracimEnv,

        ]
        config['provider_mapping'] = {
            config['root_path']: Provider(
                # TODO: Test to Re enabme archived and deleted
                show_archived=False,  # config['show_archived'],
                show_deleted=False,  # config['show_deleted'],
                show_history=False,  # config['show_history'],
                app_config=app_config,
            )
        }

        config['domaincontroller'] = TracimDomainController(
            presetdomain=None,
            presetserver=None,
            app_config=app_config,
        )
        return config

    def _get_tracim_settings(
            self,
            default_config,
    ):
        """
        Get tracim settings
        """
        global_conf = get_appsettings(default_config['tracim_config']).global_conf
        local_conf = get_appsettings(default_config['tracim_config'], 'tracim_web')  # nopep8
        settings = global_conf
        settings.update(local_conf)
        return settings

    # INFO - G.M - 13-04-2018 - Copy from
    # wsgidav.server.run_server._readConfigFile
    def _readConfigFile(self, config_file, verbose):
        """Read configuration file options into a dictionary."""

        if not os.path.exists(config_file):
            raise RuntimeError("Couldn't open configuration file '%s'." % config_file)

        if config_file.endswith(".json"):
            with open(config_file, mode="r", encoding="utf-8") as json_file:
                return json.load(json_file)

        try:
            import imp
            conf = {}
            configmodule = imp.load_source("configuration_module", config_file)

            for k, v in vars(configmodule).items():
                if k.startswith("__"):
                    continue
                elif isfunction(v):
                    continue
                conf[k] = v
        except Exception as e:
            # if verbose >= 1:
            #    traceback.print_exc()
            exceptioninfo = traceback.format_exception_only(sys.exc_type, sys.exc_value)
            exceptiontext = ""
            for einfo in exceptioninfo:
                exceptiontext += einfo + "\n"
    #        raise RuntimeError("Failed to read configuration file: " + config_file + "\nDue to "
    #            + exceptiontext)
            print("Failed to read configuration file: " + config_file +
                  "\nDue to " + exceptiontext, file=sys.stderr)
            raise

        return conf

    def get_wsgi_app(self):
        return WsgiDAVApp(self.config)


if __name__ == '__main__':
    app_factory = WebdavAppFactory()
    app = app_factory.get_wsgi_app()
    serve(app)
