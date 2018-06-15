# coding=utf-8
import plaster
import pyramid.paster

from tracim.lib.webdav import WebdavAppFactory


def web_app(config_uri):
    pyramid.paster.setup_logging(config_uri)
    return pyramid.paster.get_app(config_uri)


def webdav_app(config_uri):
    config_uri = '{}#webdav'.format(config_uri)
    plaster.setup_logging(config_uri)
    loader = plaster.get_loader(config_uri, protocols=['wsgi'])
    return loader.get_wsgi_app()
