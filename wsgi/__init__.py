# coding=utf-8
import pyramid.paster

from tracim.lib.webdav import WebdavAppFactory


def web_app(config_uri):
    pyramid.paster.setup_logging(config_uri)
    return pyramid.paster.get_app(config_uri)


def webdav_app(config_uri):
    app_factory = WebdavAppFactory(
        tracim_config_file_path=config_uri,
    )
    return app_factory.get_wsgi_app()
