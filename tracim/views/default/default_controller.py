# coding=utf-8
from pyramid.httpexceptions import HTTPNotFound

from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.views.controllers import Controller
from tracim.views.errors import ErrorSchema
from pyramid.config import Configurator


class DefaultController(Controller):

    def notfound_view(
            self,
            exception: HTTPNotFound,
            request: TracimRequest
    ):
        """
        Catch Not Found Exception
        :param exception: Exception Object
        :param request: current Request
        :return: 500 Internal Server Error with same format as others errors
        """
        request.response.status = 404
        return hapic.context.get_default_error_builder().build_from_exception(
            exception=exception
        )

    def exception_view(
            self,
            exception: Exception,
            request: TracimRequest
    ):
        """
        Catch all exceptions not handled in view
        :param exception: Exception Object
        :param request: current Request
        :return: 500 Internal Server Error with same format as others errors
        """
        request.response.status = 500
        return hapic.context.get_default_error_builder().build_from_exception(
            exception=exception
        )

    def swagger_doc(self, request: TracimRequest):
        return hapic.generate_doc(
                title='Tracim v2 API',
                description='API of Tracim v2',
        )

    def bind(self, configurator: Configurator):
        configurator.add_view(
            self.notfound_view,
            renderer='json',
            context=HTTPNotFound,
        )
        configurator.add_view(
            self.exception_view,
            renderer='json',
            context=Exception,
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
