# -*- coding: utf-8 -*-
from collections import OrderedDict
from copy import deepcopy
from http import HTTPStatus
import sys
import warnings

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator
from pyramid.events import NewResponse
from pyramid.request import Request
from pyramid.router import Router
import pyramid_beaker
from pyramid_multiauth import MultiAuthenticationPolicy
from sqlalchemy.exc import OperationalError
from transaction._transaction import Status as TransactionStatus
from transaction.interfaces import NoTransaction

from tracim_backend.applications.agenda.app_factory import CaldavAppFactory
from tracim_backend.config import CFG
from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import ContentInNotEditableState
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import ContentNotFoundInTracimRequest
from tracim_backend.exceptions import ContentTypeNotAllowed
from tracim_backend.exceptions import ContentTypeNotExist
from tracim_backend.exceptions import InsufficientUserProfile
from tracim_backend.exceptions import InsufficientUserRoleInWorkspace
from tracim_backend.exceptions import InvalidId
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import PageNotFound
from tracim_backend.exceptions import ReactionNotFound
from tracim_backend.exceptions import SameValueError
from tracim_backend.exceptions import UserAuthenticatedIsNotActive
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserGivenIsNotTheSameAsAuthenticated
from tracim_backend.exceptions import UserNotFoundInTracimRequest
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.exceptions import WorkspaceNotFoundInTracimRequest
from tracim_backend.extensions import app_list
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.plugins import init_plugin_manager
from tracim_backend.lib.utils.authentification import BASIC_AUTH_WEBUI_REALM
from tracim_backend.lib.utils.authentification import TRACIM_API_KEY_HEADER
from tracim_backend.lib.utils.authentification import TRACIM_API_USER_LOGIN_HEADER
from tracim_backend.lib.utils.authentification import ApiTokenAuthentificationPolicy
from tracim_backend.lib.utils.authentification import CookieSessionAuthentificationPolicy
from tracim_backend.lib.utils.authentification import QueryTokenAuthentificationPolicy
from tracim_backend.lib.utils.authentification import RemoteAuthentificationPolicy
from tracim_backend.lib.utils.authentification import TracimBasicAuthAuthenticationPolicy
from tracim_backend.lib.utils.authorization import TRACIM_DEFAULT_PERM
from tracim_backend.lib.utils.authorization import AcceptAllAuthorizationPolicy
from tracim_backend.lib.utils.authorization import TracimSecurityPolicy
from tracim_backend.lib.utils.cors import add_cors_support
from tracim_backend.lib.utils.http_cache import default_to_cache_control_no_store
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import sliced_dict
from tracim_backend.lib.webdav import WebdavAppFactory
from tracim_backend.models.auth import AuthType
from tracim_backend.models.setup_models import init_models
from tracim_backend.views import BASE_API
from tracim_backend.views.base import BaseController
from tracim_backend.views.contents_api.comment_controller import CommentController
from tracim_backend.views.core_api.account_controller import AccountController
from tracim_backend.views.core_api.favorite_content_controller import FavoriteContentController
from tracim_backend.views.core_api.reaction_controller import ReactionController
from tracim_backend.views.core_api.reset_password_controller import ResetPasswordController
from tracim_backend.views.core_api.session_controller import SessionController
from tracim_backend.views.core_api.system_controller import SystemController
from tracim_backend.views.core_api.tag_controller import TagController
from tracim_backend.views.core_api.url_preview_controller import URLPreviewController
from tracim_backend.views.core_api.user_controller import UserController
from tracim_backend.views.core_api.workspace_controller import WorkspaceController
from tracim_backend.views.errors import ErrorSchema
from tracim_backend.views.frontend import FrontendController

# INFO - G.M - 2020-01-08 - disable warning by default
# useful to avoid apispec error
if not sys.warnoptions:
    warnings.simplefilter("ignore")


class TracimPyramidContext(PyramidContext):
    """
    Customize the hapic context to avoid committing a transaction when an exception is caught
    by hapic.
    """

    def doom_request_transaction(self, exc: Exception, *args, **kwargs) -> None:
        try:
            # NOTE 2020-09-09 - S.G.
            # we have to search for the request object in all arguments
            # as we cannot be sure of its place in it.
            # For example if a handler is an object method the first argument
            # will be the controller object, not the request object.
            request = next(arg for arg in args if isinstance(arg, Request))
            transaction_status = request.tm.get().status
            # INFO - 2020-10-01 - G.M : In some specific case: we do arrive in situation
            # where transaction is not active anymore, in such situation, it's not possible
            # to doom the request and we do get " ValueError('non-doomable')" Exception.
            # to handle this case in a more clear way, we do Doom only active Transaction.
            if transaction_status == TransactionStatus.ACTIVE:
                request.tm.doom()
            else:
                # INFO - 2020-10-01 - G.M : debug unattended transaction status
                # for troubleshooting future issues
                logger.debug(
                    self,
                    'Transaction not active, status : "{}", cannot be doomed'.format(
                        transaction_status
                    ),
                )
        except StopIteration:
            logger.error(self, "Cannot find request object in arguments")
        except NoTransaction:
            # INFO - 2020-10-01 - G.M - In some very specific case like PageNotFound case, pyramid
            # doesn't provide a true transaction, so doom it will raise a NoTransaction exception.
            logger.debug(self, "Transaction not initialized, cannot be doomed")

    global_exception_caught = doom_request_transaction
    local_exception_caught = doom_request_transaction


def web(global_config: OrderedDict, **local_settings) -> Router:
    """ This function returns a Pyramid WSGI application.
    """
    settings = deepcopy(global_config)
    settings.update(local_settings)
    # set CFG object
    app_config = CFG(settings)
    app_config.configure_filedepot()
    settings["CFG"] = app_config

    # Init plugin manager
    plugin_manager = init_plugin_manager(app_config)
    settings["plugin_manager"] = plugin_manager

    configurator = Configurator(settings=settings, autocommit=True)
    # Add beaker session cookie
    tracim_setting_for_beaker_session = sliced_dict(settings, beginning_key_string="session.")
    tracim_setting_for_beaker_session["session.data_dir"] = app_config.SESSION__DATA_DIR
    tracim_setting_for_beaker_session["session.lock_dir"] = app_config.SESSION__LOCK_DIR
    tracim_setting_for_beaker_session["session.httponly"] = app_config.SESSION__HTTPONLY
    tracim_setting_for_beaker_session["session.secure"] = app_config.SESSION__SECURE
    session_factory = pyramid_beaker.session_factory_from_settings(
        tracim_setting_for_beaker_session
    )
    configurator.set_session_factory(session_factory)

    # TODO - G.M - 2021-03-31 Make beaker cache configurable like sessions
    #  through tracim config, see https://github.com/tracim/tracim/issues/4386
    cached_region_settings = {
        "cache.enabled": "True",
        "cache.regions": "url_preview",
        "cache.type": "memory",
        "cache.url_preview.expire": "1800",  # = 30 min
    }
    pyramid_beaker.set_cache_regions_from_settings(cached_region_settings)

    # Add AuthPolicy
    configurator.include("pyramid_multiauth")
    policies = []
    if app_config.REMOTE_USER_HEADER:
        policies.append(
            RemoteAuthentificationPolicy(remote_user_login_header=app_config.REMOTE_USER_HEADER)
        )
    policies.append(CookieSessionAuthentificationPolicy())
    policies.append(QueryTokenAuthentificationPolicy())
    if app_config.API__KEY:
        policies.append(
            ApiTokenAuthentificationPolicy(
                api_key_header=TRACIM_API_KEY_HEADER,
                api_user_login_header=TRACIM_API_USER_LOGIN_HEADER,
            )
        )
    policies.append(TracimBasicAuthAuthenticationPolicy(realm=BASIC_AUTH_WEBUI_REALM))
    # Hack for ldap
    if AuthType.LDAP in app_config.AUTH_TYPES:
        import ldap3

        configurator.include("pyramid_ldap3")
        configurator.ldap_setup(
            app_config.LDAP_URL,
            bind=app_config.LDAP_BIND_DN if not app_config.LDAP_BIND_ANONYMOUS else "",
            passwd=app_config.LDAP_BIND_PASS if not app_config.LDAP_BIND_ANONYMOUS else "",
            use_tls=app_config.LDAP_TLS,
            use_pool=app_config.LDAP_USE_POOL,
            pool_size=app_config.LDAP_POOL_SIZE,
            pool_lifetime=app_config.LDAP_POOL_LIFETIME,
            get_info=app_config.LDAP_GET_INFO,
        )
        configurator.ldap_set_login_query(
            base_dn=app_config.LDAP_USER_BASE_DN,
            filter_tmpl=app_config.LDAP_USER_FILTER,
            scope=ldap3.LEVEL,
            attributes=ldap3.ALL_ATTRIBUTES,
        )

    configurator.include(add_cors_support)
    # make sure to add this before other routes to intercept OPTIONS
    configurator.add_cors_preflight_handler()
    # Ensure a "Cache-Control: no-store" is setup by default on all responses
    # Avoid a bug with Firefox: https://github.com/tracim/tracim/issues/5334
    configurator.add_subscriber(default_to_cache_control_no_store, NewResponse)
    # Default authorization : Accept anything.
    configurator.set_security_policy(
        TracimSecurityPolicy(
            authentification_policy=MultiAuthenticationPolicy(policies),
            authorization_policy=AcceptAllAuthorizationPolicy(),
        )
    )
    # INFO - GM - 11-04-2018 - set default perm
    # setting default perm is needed to force authentification
    # mechanism in all views.
    configurator.set_default_permission(TRACIM_DEFAULT_PERM)
    # Override default request
    configurator.set_request_factory(TracimRequest)
    # Pyramids "plugin" include.
    # Add SqlAlchemy DB
    init_models(configurator, app_config)
    # set Hapic
    context = TracimPyramidContext(
        configurator=configurator, default_error_builder=ErrorSchema(), debug=app_config.DEBUG
    )
    # HACK - G.M - 2021-07-01 - Force reset of context if already set.
    # This case happened in some test now for unclear reasons.
    try:
        hapic.set_context(context)
    except AssertionError:
        hapic.reset_context()
        hapic.set_context(context)
        logger.warning(web, "Hapic context already setted, something may be wrong !")
    # INFO - G.M - 2018-07-04 - global-context exceptions
    # Not found
    context.handle_exception(PageNotFound, HTTPStatus.NOT_FOUND)
    # Bad request
    context.handle_exception(WorkspaceNotFoundInTracimRequest, HTTPStatus.BAD_REQUEST)
    context.handle_exception(UserNotFoundInTracimRequest, HTTPStatus.BAD_REQUEST)
    context.handle_exception(ContentNotFoundInTracimRequest, HTTPStatus.BAD_REQUEST)
    context.handle_exception(WorkspaceNotFound, HTTPStatus.BAD_REQUEST)
    context.handle_exception(UserDoesNotExist, HTTPStatus.BAD_REQUEST)
    context.handle_exception(ContentNotFound, HTTPStatus.BAD_REQUEST)
    context.handle_exception(ReactionNotFound, HTTPStatus.BAD_REQUEST)
    context.handle_exception(ContentTypeNotExist, HTTPStatus.BAD_REQUEST)
    context.handle_exception(ContentInNotEditableState, HTTPStatus.BAD_REQUEST)
    context.handle_exception(ContentTypeNotAllowed, HTTPStatus.BAD_REQUEST)
    context.handle_exception(InvalidId, HTTPStatus.BAD_REQUEST)
    context.handle_exception(SameValueError, HTTPStatus.BAD_REQUEST)
    # Auth exception
    context.handle_exception(NotAuthenticated, HTTPStatus.UNAUTHORIZED)
    context.handle_exception(UserGivenIsNotTheSameAsAuthenticated, HTTPStatus.FORBIDDEN)
    context.handle_exception(UserAuthenticatedIsNotActive, HTTPStatus.FORBIDDEN)
    context.handle_exception(AuthenticationFailed, HTTPStatus.FORBIDDEN)
    context.handle_exception(InsufficientUserRoleInWorkspace, HTTPStatus.FORBIDDEN)
    context.handle_exception(InsufficientUserProfile, HTTPStatus.FORBIDDEN)
    # Internal server error
    context.handle_exception(OperationalError, HTTPStatus.INTERNAL_SERVER_ERROR)
    context.handle_exception(Exception, HTTPStatus.INTERNAL_SERVER_ERROR)

    # Add controllers
    base_controller = BaseController()
    session_controller = SessionController()
    system_controller = SystemController()
    user_controller = UserController()
    account_controller = AccountController()
    reset_password_controller = ResetPasswordController()
    workspace_controller = WorkspaceController()
    comment_controller = CommentController()
    reaction_controller = ReactionController()
    tag_controller = TagController()
    url_preview_controller = URLPreviewController()
    favorite_content_controller = FavoriteContentController()
    configurator.include(base_controller.bind, route_prefix=BASE_API)
    configurator.include(session_controller.bind, route_prefix=BASE_API)
    configurator.include(system_controller.bind, route_prefix=BASE_API)
    configurator.include(user_controller.bind, route_prefix=BASE_API)
    configurator.include(account_controller.bind, route_prefix=BASE_API)
    configurator.include(reset_password_controller.bind, route_prefix=BASE_API)
    configurator.include(workspace_controller.bind, route_prefix=BASE_API)
    configurator.include(comment_controller.bind, route_prefix=BASE_API)
    configurator.include(reaction_controller.bind, route_prefix=BASE_API)
    configurator.include(tag_controller.bind, route_prefix=BASE_API)
    configurator.include(url_preview_controller.bind, route_prefix=BASE_API)
    configurator.include(favorite_content_controller.bind, route_prefix=BASE_API)
    if app_config.CALL__ENABLED:
        # NOTE - 2021-09-22 - S.G - importing here so that hapic only discover those routes
        # when CALL_ENABLED is True.
        from tracim_backend.views.core_api.call import CallController

        call_controller = CallController()
        configurator.include(call_controller.bind, route_prefix=BASE_API)

    app_lib = ApplicationApi(app_list=app_list)
    for app in app_lib.get_all():
        app.load_controllers(
            app_config=app_config, configurator=configurator, route_prefix=BASE_API, context=context
        )
        app.register_tracim_plugin(plugin_manager)

    configurator.scan("tracim_backend.lib.utils.authentification")

    # TODO - G.M - 2019-05-17 - check if possible to avoid this import here,
    # import is here because import SearchController without adding it to
    # pyramid make trouble in hapic which try to get view related
    # to controller but failed.
    from tracim_backend.lib.search.search_factory import SearchFactory

    search_controller = SearchFactory.get_search_controller(app_config)

    configurator.include(search_controller.bind, route_prefix=BASE_API)
    if app_config.FRONTEND__SERVE:
        configurator.include("pyramid_mako")
        frontend_controller = FrontendController(
            dist_folder_path=app_config.FRONTEND__DIST_FOLDER_PATH,
            custom_toolbox_folder_path=app_config.FRONTEND__CUSTOM_TOOLBOX_FOLDER_PATH,
            cache_token=app_config.FRONTEND__CACHE_TOKEN,
        )
        configurator.include(frontend_controller.bind)

    # INFO - G.M - 2019-11-27 - Include plugin custom web code
    plugin_manager.hook.web_include(configurator=configurator, app_config=app_config)

    hapic.add_documentation_view("/api/doc", "Tracim API", "API of Tracim")
    return configurator.make_wsgi_app()


def webdav(global_config, **local_settings):
    settings = deepcopy(global_config)
    settings.update(local_settings)
    app_factory = WebdavAppFactory(**settings)
    return app_factory.get_wsgi_app()


def caldav(global_config, **local_settings):
    settings = deepcopy(global_config)
    settings.update(local_settings)
    app_factory = CaldavAppFactory(**settings)
    return app_factory.get_wsgi_app()
