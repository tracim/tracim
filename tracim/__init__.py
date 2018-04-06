# -*- coding: utf-8 -*-
import json
import time

from pyramid.config import Configurator
from pyramid.authentication import BasicAuthAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from hapic.ext.pyramid import PyramidContext

from tracim.extensions import hapic
from tracim.config import CFG
from tracim.lib.utils.auth import check_credentials
from tracim.lib.utils.auth import Root
from tracim.views.example_api.example_api_controller import ExampleApiController
from tracim.views.default.default_controller import DefaultController


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    # set CFG object
    app_config = CFG(settings)
    app_config.configure_filedepot()
    settings['CFG'] = app_config
    configurator = Configurator(settings=settings, autocommit=True)
    # Add BasicAuthPolicy + ACL AuthorizationPolicy
    authn_policy = BasicAuthAuthenticationPolicy(check_credentials)
    configurator.set_authorization_policy(ACLAuthorizationPolicy())
    configurator.set_authentication_policy(authn_policy)
    configurator.set_root_factory(lambda request: Root())
    # Pyramids "plugin" include.
    configurator.include('pyramid_jinja2')
    # Add SqlAlchemy DB
    configurator.include('.models')
    # set Hapic
    hapic.set_context(PyramidContext(configurator))
    # Add controllers
    default_controllers = DefaultController()
    default_controllers.bind(configurator)
    example_api_controllers = ExampleApiController()
    example_api_controllers.bind(configurator)

    time.sleep(1)
    s = json.dumps(
        hapic.generate_doc(
            title='Fake API',
            description='just an example of hapic API'
        )
    )
    time.sleep(1)
    # print swagger doc
    print(s)
    time.sleep(1)
    return configurator.make_wsgi_app()
