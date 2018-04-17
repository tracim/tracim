# coding=utf-8
from tracim import TracimRequest
from tracim.views.controllers import Controller
from pyramid.config import Configurator
from pyramid.exceptions import NotFound


class DefaultController(Controller):

    def notfound_view(self, request:TracimRequest):
        request.response.status = 404
        return {}

    def bind(self, configurator: Configurator):
        configurator.add_view(
            self.notfound_view,
            renderer='json',
            context=NotFound,
        )
