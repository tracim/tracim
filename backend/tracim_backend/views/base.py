from pyramid.config import Configurator

from tracim_backend import PageNotFound
from tracim_backend import TracimRequest
from tracim_backend.views.controllers import Controller


class BaseController(Controller):
    def not_found_view(self, context, request: TracimRequest):
        raise PageNotFound("{} is not a valid path".format(request.path)) from context

    def bind(self, configurator: Configurator) -> None:
        configurator.add_notfound_view(self.not_found_view)
