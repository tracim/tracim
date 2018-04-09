# coding=utf-8
from tracim.views.controllers import Controller
from pyramid.config import Configurator
from pyramid.response import Response
from pyramid.exceptions import NotFound
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.httpexceptions import HTTPForbidden
from pyramid.security import forget

from tracim.lib.utils.auth import MANAGE_CONTENT_PERM
from tracim.lib.utils.auth import MANAGE_WORKSPACE_PERM
from tracim.lib.utils.auth import MANAGE_GLOBAL_PERM
from tracim.lib.utils.auth import READ_PERM
from tracim.lib.utils.auth import CONTRIBUTE_PERM
from tracim.lib.utils.auth import ADMIN_PERM
from tracim.lib.utils.auth import USER_PERM


class DefaultController(Controller):

    @classmethod
    def notfound_view(cls, request):
        request.response.status = 404
        return {}

    @classmethod
    def forbidden_view(cls, request):
        if request.authenticated_userid is None:
            response = HTTPUnauthorized()
            response.headers.update(forget(request))

        # user is logged in but doesn't have permissions, reject wholesale
        else:
            response = HTTPForbidden()
        return response

    @classmethod
    def test_config(cls, request):
        try:
            app_config = request.registry.settings['CFG']
            project = app_config.WEBSITE_TITLE
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    @classmethod
    def test_contributor_page(cls, request):
        try:
            app_config = request.registry.settings['CFG']
            project = 'contributor'
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    @classmethod
    def test_admin_page(cls, request):
        try:
            app_config = request.registry.settings['CFG']
            project = 'admin'
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    @classmethod
    def test_manager_page(cls, request):
        try:
            app_config = request.registry.settings['CFG']
            project = 'manager'
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    @classmethod
    def test_user_page(cls, request):
        try:
            app_config = request.registry.settings['CFG']
            project = 'user'
        except Exception as e:
            return Response(e, content_type='text/plain', status=500)
        return {'project': project}

    def bind(self, configurator: Configurator):
        configurator.add_static_view('static', 'static', cache_max_age=3600)
        configurator.add_view(
            self.notfound_view,
            renderer='tracim:templates/404.jinja2',
            context=NotFound,
        )

        configurator.add_route('test_config', '/')
        configurator.add_view(
            self.test_config,
            route_name='test_config',
            renderer='tracim:templates/mytemplate.jinja2',
        )

        configurator.add_route('test_contributor', '/test_contributor')
        configurator.add_view(
            self.test_contributor_page,
            route_name='test_contributor',
            renderer='tracim:templates/mytemplate.jinja2',
            permission=CONTRIBUTE_PERM,
        )
        configurator.add_route('test_admin', '/test_admin')
        configurator.add_view(
            self.test_admin_page,
            route_name='test_admin',
            renderer='tracim:templates/mytemplate.jinja2',
            permission=ADMIN_PERM,
        )
        configurator.add_route('test_manager', '/test_manager')
        configurator.add_view(
            self.test_user_page,
            route_name='test_manager',
            renderer='tracim:templates/mytemplate.jinja2',
            permission=MANAGE_GLOBAL_PERM,
        )
        configurator.add_route('test_user', '/test_user')
        configurator.add_view(
            self.test_user_page,
            route_name='test_user',
            renderer='tracim:templates/mytemplate.jinja2',
            permission=USER_PERM,
        )
        configurator.add_forbidden_view(self.forbidden_view)
