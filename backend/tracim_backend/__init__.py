# -*- coding: utf-8 -*-
from collections import OrderedDict
from copy import deepcopy

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator
from pyramid.router import Router
import pyramid_beaker
from pyramid_multiauth import MultiAuthenticationPolicy
from sqlalchemy.exc import OperationalError

from tracim_backend.config import CFG
from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import CaldavNotAuthenticated
from tracim_backend.exceptions import CaldavNotAuthorized
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
from tracim_backend.exceptions import SameValueError
from tracim_backend.exceptions import UserAuthenticatedIsNotActive
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserGivenIsNotTheSameAsAuthenticated
from tracim_backend.exceptions import UserNotFoundInTracimRequest
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.exceptions import WorkspaceNotFoundInTracimRequest
from tracim_backend.extensions import hapic
from tracim_backend.lib.agenda import CaldavAppFactory
from tracim_backend.lib.agenda.authorization import add_www_authenticate_header_for_caldav
from tracim_backend.lib.collaborative_document_edition.collaboration_document_edition_factory import (
    CollaborativeDocumentEditionFactory,
)
from tracim_backend.lib.utils.authentification import BASIC_AUTH_WEBUI_REALM
from tracim_backend.lib.utils.authentification import TRACIM_API_KEY_HEADER
from tracim_backend.lib.utils.authentification import TRACIM_API_USER_EMAIL_LOGIN_HEADER
from tracim_backend.lib.utils.authentification import ApiTokenAuthentificationPolicy
from tracim_backend.lib.utils.authentification import CookieSessionAuthentificationPolicy
from tracim_backend.lib.utils.authentification import QueryTokenAuthentificationPolicy
from tracim_backend.lib.utils.authentification import RemoteAuthentificationPolicy
from tracim_backend.lib.utils.authentification import TracimBasicAuthAuthenticationPolicy
from tracim_backend.lib.utils.authorization import TRACIM_DEFAULT_PERM
from tracim_backend.lib.utils.authorization import AcceptAllAuthorizationPolicy
from tracim_backend.lib.utils.cors import add_cors_support
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import sliced_dict
from tracim_backend.lib.webdav import WebdavAppFactory
from tracim_backend.models.auth import AuthType
from tracim_backend.models.setup_models import init_models
from tracim_backend.views import BASE_API_V2
from tracim_backend.views.agenda_api.radicale_proxy_controller import RadicaleProxyController
from tracim_backend.views.contents_api.comment_controller import CommentController
from tracim_backend.views.contents_api.file_controller import FileController
from tracim_backend.views.contents_api.folder_controller import FolderController
from tracim_backend.views.contents_api.html_document_controller import HTMLDocumentController
from tracim_backend.views.contents_api.threads_controller import ThreadController
from tracim_backend.views.core_api.account_controller import AccountController
from tracim_backend.views.core_api.reset_password_controller import ResetPasswordController
from tracim_backend.views.core_api.session_controller import SessionController
from tracim_backend.views.core_api.system_controller import SystemController
from tracim_backend.views.core_api.user_controller import UserController
from tracim_backend.views.core_api.workspace_controller import WorkspaceController
from tracim_backend.views.errors import ErrorSchema
from tracim_backend.views.frontend import FrontendController

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


def web(global_config: OrderedDict, **local_settings) -> Router:
    """ This function returns a Pyramid WSGI application.
    """
    settings = deepcopy(global_config)
    settings.update(local_settings)
    # set CFG object
    app_config = CFG(settings)
    app_config.configure_filedepot()
    settings["CFG"] = app_config
    configurator = Configurator(settings=settings, autocommit=True)
    # Add beaker session cookie
    tracim_setting_for_beaker = sliced_dict(settings, beginning_key_string="session.")
    tracim_setting_for_beaker["session.data_dir"] = app_config.SESSION__DATA_DIR
    tracim_setting_for_beaker["session.lock_dir"] = app_config.SESSION__LOCK_DIR
    session_factory = pyramid_beaker.session_factory_from_settings(tracim_setting_for_beaker)
    configurator.set_session_factory(session_factory)
    pyramid_beaker.set_cache_regions_from_settings(tracim_setting_for_beaker)
    # Add AuthPolicy
    configurator.include("pyramid_multiauth")
    policies = []
    if app_config.REMOTE_USER_HEADER:
        policies.append(
            RemoteAuthentificationPolicy(
                remote_user_email_login_header=app_config.REMOTE_USER_HEADER
            )
        )
    policies.append(
        CookieSessionAuthentificationPolicy(reissue_time=app_config.SESSION__REISSUE_TIME)
    )
    policies.append(QueryTokenAuthentificationPolicy())
    if app_config.API__KEY:
        policies.append(
            ApiTokenAuthentificationPolicy(
                api_key_header=TRACIM_API_KEY_HEADER,
                api_user_email_login_header=TRACIM_API_USER_EMAIL_LOGIN_HEADER,
            )
        )
    policies.append(TracimBasicAuthAuthenticationPolicy(realm=BASIC_AUTH_WEBUI_REALM))
    # Hack for ldap
    if AuthType.LDAP in app_config.AUTH_TYPES:
        import ldap3

        configurator.include("pyramid_ldap3")
        configurator.ldap_setup(
            app_config.LDAP_URL,
            bind=app_config.LDAP_BIND_DN,
            passwd=app_config.LDAP_BIND_PASS,
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
    # Default authorization : Accept anything.
    configurator.set_authorization_policy(AcceptAllAuthorizationPolicy())
    authn_policy = MultiAuthenticationPolicy(policies)
    configurator.set_authentication_policy(authn_policy)
    # INFO - GM - 11-04-2018 - set default perm
    # setting default perm is needed to force authentification
    # mecanism in all views.
    configurator.set_default_permission(TRACIM_DEFAULT_PERM)
    # Override default request
    configurator.set_request_factory(TracimRequest)
    # Pyramids "plugin" include.
    # Add SqlAlchemy DB
    init_models(configurator, app_config)
    # set Hapic
    context = PyramidContext(
        configurator=configurator, default_error_builder=ErrorSchema(), debug=app_config.DEBUG
    )
    hapic.set_context(context)
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
    session_controller = SessionController()
    system_controller = SystemController()
    user_controller = UserController()
    account_controller = AccountController()
    reset_password_controller = ResetPasswordController()
    workspace_controller = WorkspaceController()
    comment_controller = CommentController()
    html_document_controller = HTMLDocumentController()
    thread_controller = ThreadController()
    file_controller = FileController()
    folder_controller = FolderController()
    configurator.include(session_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(system_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(user_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(account_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(reset_password_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(workspace_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(comment_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(html_document_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(thread_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(file_controller.bind, route_prefix=BASE_API_V2)
    configurator.include(folder_controller.bind, route_prefix=BASE_API_V2)

    # INFO - G.M - 2019-08-08 - import app here instead of top of file,
    # to make thing easier later
    # when app will be load dynamycally.
    import tracim_backend.applications.share.controller as share_app_controller

    share_app_controller.import_controller(
        app_config=app_config, configurator=configurator, route_prefix=BASE_API_V2
    )
    import tracim_backend.applications.upload_permissions.controller as upload_permission_controller

    upload_permission_controller.import_controller(
        app_config=app_config, configurator=configurator, route_prefix=BASE_API_V2
    )

    if app_config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED:
        # TODO - G.M - 2019-07-17 - check if possible to avoid this import here,
        # import is here because import WOPI of Collabora controller without adding it to
        # pyramid make trouble in hapic which try to get view related
        # to controller but failed.
        from tracim_backend.views.collaborative_document_edition_api.wopi_api.wopi_controller import (
            WOPIController,
        )

        wopi_controller = WOPIController()
        configurator.include(wopi_controller.bind, route_prefix=BASE_API_V2)
        collaborative_document_edition_controller = CollaborativeDocumentEditionFactory().get_controller(
            app_config
        )
        configurator.include(
            collaborative_document_edition_controller.bind, route_prefix=BASE_API_V2
        )
    configurator.scan("tracim_backend.lib.utils.authentification")
    if app_config.CALDAV__ENABLED:
        # TODO - G.M - 2019-03-18 - check if possible to avoid this import here,
        # import is here because import AgendaController without adding it to
        # pyramid make trouble in hapic which try to get view related
        # to controller but failed.
        from tracim_backend.views.agenda_api.agenda_controller import AgendaController

        configurator.include(add_www_authenticate_header_for_caldav)
        # caldav exception
        context.handle_exception(CaldavNotAuthorized, HTTPStatus.FORBIDDEN)
        context.handle_exception(CaldavNotAuthenticated, HTTPStatus.UNAUTHORIZED)
        # controller
        radicale_proxy_controller = RadicaleProxyController(
            proxy_base_address=app_config.CALDAV__RADICALE_PROXY__BASE_URL,
            radicale_base_path=app_config.CALDAV__RADICALE__BASE_PATH,
            radicale_user_path=app_config.CALDAV__RADICALE__USER_PATH,
            radicale_workspace_path=app_config.CALDAV_RADICALE_WORKSPACE_PATH,
        )
        agenda_controller = AgendaController()
        configurator.include(agenda_controller.bind, route_prefix=BASE_API_V2)
        configurator.include(radicale_proxy_controller.bind)

    # TODO - G.M - 2019-05-17 - check if possible to avoid this import here,
    # import is here because import SearchController without adding it to
    # pyramid make trouble in hapic which try to get view related
    # to controller but failed.
    from tracim_backend.lib.search.search_factory import SearchFactory

    search_controller = SearchFactory.get_search_controller(app_config)

    configurator.include(search_controller.bind, route_prefix=BASE_API_V2)
    if app_config.FRONTEND__SERVE:
        configurator.include("pyramid_mako")
        frontend_controller = FrontendController(app_config.FRONTEND__DIST_FOLDER_PATH)
        configurator.include(frontend_controller.bind)

    hapic.add_documentation_view("/api/v2/doc", "Tracim v2 API", "API of Tracim v2")
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
