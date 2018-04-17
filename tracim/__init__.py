# -*- coding: utf-8 -*-
import json
import time

from pyramid.config import Configurator
from pyramid.authentication import BasicAuthAuthenticationPolicy
from hapic.ext.pyramid import PyramidContext

from tracim.extensions import hapic
from tracim.config import CFG
from tracim.lib.utils.request import TracimRequest
from tracim.lib.utils.authentification import basic_auth_check_credentials
from tracim.lib.utils.authentification import BASIC_AUTH_WEBUI_REALM
from tracim.lib.utils.authorization import AcceptAllAuthorizationPolicy
from tracim.lib.utils.authorization import TRACIM_DEFAULT_PERM
from tracim.views.core_api.session_controller import SessionController
from tracim.views.default.default_controller import DefaultController


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    # set CFG object
    app_config = CFG(settings)
    app_config.configure_filedepot()
    settings['CFG'] = app_config
    configurator = Configurator(settings=settings, autocommit=True)
    # Add BasicAuthPolicy
    authn_policy = BasicAuthAuthenticationPolicy(
        basic_auth_check_credentials,
        realm=BASIC_AUTH_WEBUI_REALM,
    )
    # Default authorization : Accept anything.
    configurator.set_authorization_policy(AcceptAllAuthorizationPolicy())
    configurator.set_authentication_policy(authn_policy)
    # INFO - GM - 11-04-2018 - set default perm
    # setting default perm is needed to force authentification
    # mecanism in all views.
    configurator.set_default_permission(TRACIM_DEFAULT_PERM)
    # Override default request
    configurator.set_request_factory(TracimRequest)
    # Pyramids "plugin" include.
    configurator.include('pyramid_jinja2')
    # Add SqlAlchemy DB
    configurator.include('.models')
    # set Hapic
    hapic.set_context(PyramidContext(configurator))
    # Add controllers
    default_controllers = DefaultController()
    default_controllers.bind(configurator)
    session_api = SessionController()
    session_api.bind(configurator)
    # TODO - G.M - 09-04-2018 - Enable swagger ui doc
    # time.sleep(1)
    # s = json.dumps(
    #     hapic.generate_doc(
    #         title='Tracim v2 API',
    #         description='API of Tracim v2',
    #
    #     )
    # )
    # time.sleep(1)
    # # print swagger doc
    # print(s)
    # time.sleep(1)
    return configurator.make_wsgi_app()
