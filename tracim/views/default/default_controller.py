# coding=utf-8
from tracim.views.controllers import Controller
from pyramid.config import Configurator
from pyramid.response import Response
from pyramid.exceptions import NotFound


class DefaultController(Controller):

    @classmethod
    def notfound_view(cls, request):
        request.response.status = 404
        return {}

    @classmethod
    def test_config(cls, request):
        try:
            project = request.app_config().WEBSITE_TITLE
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
