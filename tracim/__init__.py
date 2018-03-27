from pyramid.config import Configurator

from tracim.config import RequestWithCFG


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    config = Configurator(settings=settings)
    config.include('pyramid_jinja2')
    config.include('.models')
    config.include('.routes')
    config.set_request_factory(RequestWithCFG)
    config.scan()
    return config.make_wsgi_app()
