# coding=utf-8
from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.views.controllers import Controller
from pyramid.config import Configurator
from pyramid.exceptions import NotFound


class DefaultController(Controller):

    def notfound_view(self, request: TracimRequest):
        request.response.status = 404
        return {}

    def swagger_doc(self, request: TracimRequest):
        return hapic.generate_doc(
                title='Tracim v2 API',
                description='API of Tracim v2',
        )

    def bind(self, configurator: Configurator):
        configurator.add_view(
            self.notfound_view,
            renderer='json',
            context=NotFound,
        )
        configurator.add_route(
            'swagger_doc',
            '/swagger_doc',
            request_method='GET',
        )
        configurator.add_view(
            self.swagger_doc,
            route_name='swagger_doc',
            renderer='json',
        )
