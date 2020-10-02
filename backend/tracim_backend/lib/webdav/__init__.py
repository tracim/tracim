from waitress import serve
from wsgidav.dir_browser import WsgiDavDirBrowser
from wsgidav.error_printer import ErrorPrinter
from wsgidav.http_authenticator import HTTPAuthenticator
from wsgidav.wsgidav_app import DEFAULT_CONFIG
from wsgidav.wsgidav_app import WsgiDAVApp
from wsgidav.xml_tools import useLxml

from tracim_backend.config import CFG
from tracim_backend.lib.webdav.authentification import TracimDomainController
from tracim_backend.lib.webdav.dav_provider import Provider
from tracim_backend.lib.webdav.middlewares import TracimEnforceHTTPS
from tracim_backend.lib.webdav.middlewares import TracimEnv
from tracim_backend.lib.webdav.middlewares import TracimWsgiDavDebugFilter


class WebdavAppFactory(object):
    def __init__(self, **settings):
        self.config = self._initConfig(**settings)

    def _initConfig(self, **settings):
        """Setup configuration dictionary from default,
         command line and configuration file."""

        # Set config defaults
        config = DEFAULT_CONFIG.copy()
        # Get pyramid Env
        config["tracim_settings"] = settings
        app_config = CFG(settings)

        # use only basic_auth, disable digest auth
        config["acceptbasic"] = True
        config["acceptdigest"] = False
        config["defaultdigest"] = False
        # check this for apache authentication mechanism
        if app_config.REMOTE_USER_HEADER:
            config["trusted_auth_header"] = app_config.REMOTE_USER_HEADER

        config["verbose"] = app_config.WEBDAV__VERBOSE__LEVEL
        config["dir_browser"]["enable"] = app_config.WEBDAV__DIR_BROWSER__ENABLED
        config["dir_browser"]["response_trailer"] = app_config.WEBDAV__DIR_BROWSER__FOOTER

        if not useLxml and config["verbose"] >= 1:
            print(
                "WARNING: Could not import lxml: using xml instead (slower). "
                "consider installing lxml from http://codespeak.net/lxml/."
            )

        config["provider_mapping"] = {
            app_config.WEBDAV__ROOT_PATH: Provider(
                manage_locks=app_config.WEBDAV_MANAGE_LOCK, app_config=app_config,
            )
        }
        config["block_size"] = app_config.WEBDAV__BLOCK_SIZE

        config["domaincontroller"] = TracimDomainController(
            presetdomain=None, presetserver=None, app_config=app_config
        )

        config["middleware_stack"] = [
            TracimEnforceHTTPS,
            WsgiDavDirBrowser,
            HTTPAuthenticator,
            ErrorPrinter,
            TracimWsgiDavDebugFilter,
            TracimEnv,
        ]
        return config

    def get_wsgi_app(self):
        return WsgiDAVApp(self.config)


if __name__ == "__main__":
    app_factory = WebdavAppFactory()
    app = app_factory.get_wsgi_app()
    serve(app)
