# coding=utf-8
from pyramid.request import Request

from tracim import TracimRequest
from tracim.models.data import UserRoleInWorkspace
from tracim.views.controllers import Controller
from pyramid.config import Configurator
from pyramid.response import Response
from pyramid.exceptions import NotFound
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.httpexceptions import HTTPForbidden
from pyramid.security import forget, authenticated_userid

from tracim.lib.utils.authorization import require_workspace_role


class DefaultController(Controller):

    def notfound_view(self, request):
        request.response.status = 404
        return {}

    def forbidden_view(self, request):
        if request.authenticated_userid is None:
            response = HTTPUnauthorized()
            response.headers.update(forget(request))

        # user is logged in but doesn't have permissions, reject wholesale
        else:
            response = HTTPForbidden()
        return response

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    @require_workspace_role(UserRoleInWorkspace.READER)
    def test_config(self, request: TracimRequest):
        app_config = request.registry.settings['CFG']
        project = app_config.WEBSITE_TITLE
        request.current_user = "lapin"
        return {'project': project}

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    def test_contributor_page(self, request):
        try:
            app_config = request.registry.settings['CFG']
            project = 'contributor'
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    def test_admin_page(self, request):
        try:
            app_config = request.registry.settings['CFG']
            project = 'admin'
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    def test_manager_page(self, request):
        try:
            app_config = request.registry.settings['CFG']
            project = 'manager'
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    def test_user_page(self, request):
        try:
            app_config = request.registry.settings['CFG']
            project = 'user'
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    def bind(self, configurator: Configurator):
        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop static files
        configurator.add_static_view('static', 'static', cache_max_age=3600)
        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Do not rely
        # on static file for 404 view
        configurator.add_view(
            self.notfound_view,
            renderer='tracim:templates/404.jinja2',
            context=NotFound,
        )

        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route('test_config', '/')
        configurator.add_view(
            self.test_config,
            route_name='test_config',
            renderer='tracim:templates/mytemplate.jinja2',
        )

        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route('test_contributor', '/test_contributor')
        configurator.add_view(
            self.test_contributor_page,
            route_name='test_contributor',
            renderer='tracim:templates/mytemplate.jinja2',
        )

        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route('test_admin', '/test_admin')
        configurator.add_view(
            self.test_admin_page,
            route_name='test_admin',
            renderer='tracim:templates/mytemplate.jinja2',
        )

        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route('test_manager', '/test_manager')
        configurator.add_view(
            self.test_user_page,
            route_name='test_manager',
            renderer='tracim:templates/mytemplate.jinja2',
        )

        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route('test_user', '/test_user')
        configurator.add_view(
            self.test_user_page,
            route_name='test_user',
            renderer='tracim:templates/mytemplate.jinja2',
        )

        configurator.add_forbidden_view(self.forbidden_view)
