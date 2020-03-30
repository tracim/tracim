import plaster
import pyramid.paster
from pyramid.router import Router
from radicale import Application as RadicaleApplication
from sqltap.wsgi import SQLTapMiddleware
from wsgidav.wsgidav_app import WsgiDAVApp

WEBDAV_APP_NAME = "webdav"
CALDAV_APP_NAME = "caldav"


def web_app(config_uri: str) -> Router:
    pyramid.paster.setup_logging(config_uri)
    return SQLTapMiddleware(pyramid.paster.get_app(config_uri))


def webdav_app(config_uri: str) -> WsgiDAVApp:
    plaster.setup_logging(config_uri)
    loader = plaster.get_loader(config_uri, protocols=["wsgi"])
    return loader.get_wsgi_app(name=WEBDAV_APP_NAME)


def caldav_app(config_uri: str) -> RadicaleApplication:
    plaster.setup_logging(config_uri)
    loader = plaster.get_loader(config_uri, protocols=["wsgi"])
    return loader.get_wsgi_app(name=CALDAV_APP_NAME)
