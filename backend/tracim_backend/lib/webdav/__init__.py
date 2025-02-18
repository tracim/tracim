from waitress import serve
from wsgidav.dir_browser import WsgiDavDirBrowser
from wsgidav.error_printer import ErrorPrinter
from wsgidav.http_authenticator import HTTPAuthenticator
from wsgidav.mw.cors import Cors
from wsgidav.request_resolver import RequestResolver
from wsgidav.wsgidav_app import DEFAULT_CONFIG
from wsgidav.wsgidav_app import WsgiDAVApp
from wsgidav.xml_tools import use_lxml

from tracim_backend.config import CFG
from tracim_backend.lib.webdav.authentication import TracimDomainController
from tracim_backend.lib.webdav.dav_provider import TracimDavProvider
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
        config["http_authenticator"]["accept_basic"] = True
        config["http_authenticator"]["accept_digest"] = False
        config["http_authenticator"]["default_to_digest"] = False
        # check this for apache authentication mechanism
        if app_config.REMOTE_USER_HEADER:
            config["trusted_auth_header"] = app_config.REMOTE_USER_HEADER

        config["verbose"] = app_config.WEBDAV__VERBOSE__LEVEL  # FIXME - CHECK THIS IS PARAMETERIZED
        config["dir_browser"]["enable"] = app_config.WEBDAV__DIR_BROWSER__ENABLED
        config["dir_browser"]["response_trailer"] = app_config.WEBDAV__DIR_BROWSER__FOOTER

        if not use_lxml and config["verbose"] >= 1:
            print(
                "WARNING: Could not import lxml: using xml instead (slower). "
                "consider installing lxml from http://codespeak.net/lxml/."
            )

        config["provider_mapping"] = {
            app_config.WEBDAV__ROOT_PATH: TracimDavProvider(
                app_config=app_config,
                manage_locks=app_config.WEBDAV_MANAGE_LOCK,  # FIXME - CHANGE THIS TO FALSE BY DEFAULT
            )
        }
        config["block_size"] = app_config.WEBDAV__BLOCK_SIZE
        config["http_authenticator"]["domain_controller"] = TracimDomainController
        config["middleware_stack"] = [
            TracimEnv,
            HTTPAuthenticator,
            # TracimWsgiDavDebugFilter,
            # Cors,
            # - wsgidav.mw.debug_filter.WsgiDavDebugFilter
            ErrorPrinter,  # Builds WebDAV error body
            WsgiDavDirBrowser,
            # TODO - Remove this as it is useless for years now TracimEnforceHTTPS,
            RequestResolver  # this must be the last middleware item
        ]
        return config

    def get_wsgi_app(self):
        return WsgiDAVApp(self.config)


if __name__ == "__main__":
    app_factory = WebdavAppFactory()
    app = app_factory.get_wsgi_app()
    serve(app)
