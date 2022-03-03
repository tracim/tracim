from http import HTTPStatus
import json

from pyramid.config import Configurator

from tracim_backend import PageNotFound
from tracim_backend import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.errors import ErrorSchema


class BaseController(Controller):
    def not_found_view(self, context, request: TracimRequest):
        # FIXME  - G.M - 2022-02-24 - Explicit error return as the global handle_exception does, 
        # see https://github.com/tracim/tracim/issues/5487
        # not work for notfound_view in pyramid 2
        error_body = ErrorSchema().build_from_exception(
            exception=PageNotFound("{} is not a valid path".format(request.path))
        )
        headers = [("Content-Type", "application/json")]
        from pyramid.response import Response

        return Response(body=json.dumps(error_body), headers=headers, status=HTTPStatus.NOT_FOUND)

    def bind(self, configurator: Configurator) -> None:
        configurator.add_notfound_view(self.not_found_view, append_slash=True)
