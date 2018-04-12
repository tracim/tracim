# coding=utf-8
from pyramid.request import Request

from tracim import TracimRequest
from tracim.models import Group
from tracim.models.data import UserRoleInWorkspace
from tracim.views.controllers import Controller
from pyramid.config import Configurator
from pyramid.response import Response
from pyramid.exceptions import NotFound
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.httpexceptions import HTTPForbidden
from pyramid.security import forget, authenticated_userid

from tracim.lib.utils.authorization import require_workspace_role, \
    require_profile


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

    def home(self, request: TracimRequest):
        app_config = request.registry.settings['CFG']
        project = app_config.WEBSITE_TITLE
        return {'project': project}

    @require_profile(Group.TIM_USER)
    def user(self, request: TracimRequest):
        return self.home(request)

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    @require_workspace_role(UserRoleInWorkspace.READER)
    def test_reader(self, request: TracimRequest):
        return self.home(request)

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    def test_contributor(self, request):
        return self.home(request)

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    @require_workspace_role(UserRoleInWorkspace.WORKSPACE_MANAGER)
    def test_workspace_manager(self, request):
        return self.home(request)

    # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    def test_content_manager(self, request):
        return self.home(request)

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
        configurator.add_route('home', '/')
        configurator.add_view(
            self.home,
            route_name='home',
            renderer='tracim:templates/mytemplate.jinja2',
        )
        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route('user', '/test_user')
        configurator.add_view(
            self.user,
            route_name='user',
            renderer='tracim:templates/mytemplate.jinja2',
        )

        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route('test_contributor', '/test_contributor')
        configurator.add_view(
            self.test_contributor,
            route_name='test_contributor',
            renderer='tracim:templates/mytemplate.jinja2',
        )
        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route('test_reader', '/test_reader')
        configurator.add_view(
            self.test_contributor,
            route_name='test_reader',
            renderer='tracim:templates/mytemplate.jinja2',
        )
        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route(
            'test_workspace_manager',
            '/test_workspace_manager'
        )
        configurator.add_view(
            self.test_workspace_manager,
            route_name='test_workspace_manager',
            renderer='tracim:templates/mytemplate.jinja2',
        )

        # TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this method
        configurator.add_route(
            'test_content_manager',
            '/test_content_manager'
        )
        configurator.add_view(
            self.test_content_manager,
            route_name='test_content_manager',
            renderer='tracim:templates/mytemplate.jinja2',
        )
        configurator.add_forbidden_view(self.forbidden_view)
