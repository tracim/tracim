# -*- coding: utf-8 -*-
# INFO - G.M -17-05-2018 - CORS support
# original code from https://gist.github.com/mmerickel/1afaf64154b335b596e4
# see also
# here : https://groups.google.com/forum/#!topic/pylons-discuss/2Sw4OkOnZcE
from pyramid.events import NewResponse

from tracim_backend.config import CFG
from tracim_backend.lib.utils.authentification import CLIENT_TOKEN_HEADER


def add_cors_support(config):
    # INFO - G.M - 17-05-2018 - CORS Preflight stuff (special requests)
    config.add_directive("add_cors_preflight_handler", add_cors_preflight_handler)
    config.add_route_predicate("cors_preflight", CorsPreflightPredicate)

    # INFO - G.M - 17-05-2018 CORS Headers for all responses
    config.add_subscriber(add_cors_to_response, NewResponse)


class CorsPreflightPredicate(object):
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return "cors_preflight = %s" % bool(self.val)

    phash = text

    def __call__(self, context, request):
        if not self.val:
            return False
        return (
            request.method == "OPTIONS"
            and "Origin" in request.headers
            and "Access-Control-Request-Method" in request.headers
        )


def add_cors_preflight_handler(config):
    # INFO - G.M - 17-05-2018 - Add route for CORS preflight
    # see https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
    # for more info about preflight

    config.add_route("cors-options-preflight", "/{catch_all:.*}", cors_preflight=True)
    config.add_view(cors_options_view, route_name="cors-options-preflight")


def set_cors_headers(request, response):
    app_config = request.registry.settings["CFG"]  # type: CFG
    if (
        "Origin" in request.headers
        and request.headers["Origin"] in app_config.CORS__ACCESS_CONTROL_ALLOWED_ORIGIN
    ):
        response.headers[
            "Access-Control-Expose-Headers"
        ] = "Content-Type,Date,Content-Length,Authorization,X-Request-ID"
        response.headers["Access-Control-Allow-Origin"] = request.headers["Origin"]
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"


def cors_options_view(context, request):
    response = request.response
    # @TODO Côme - 2018/09/04 - I commented the test bellow because I can't work with for editing a file in app file.
    # I checked with GM and this test might require some fixes
    # if 'Access-Control-Request-Headers' in request.headers:
    response.headers[
        "Access-Control-Allow-Methods"
    ] = "OPTIONS,HEAD,GET,POST,PUT,DELETE,PROPFIND,PROPPATCH,REPORT,MOVE,LOCK,UNLOCK"
    response.headers[
        "Access-Control-Allow-Headers"
    ] = "Content-Type,Accept,Accept-Language,Authorization,X-Request-ID,X-client,Depth,Prefer,If-None-Match,If-match,{client_token_header}".format(
        client_token_header=CLIENT_TOKEN_HEADER
    )
    set_cors_headers(request, response)
    return response


def add_cors_to_response(event):
    # INFO - G.M - 17-05-2018 - Add some CORS headers to all requests
    request = event.request
    response = event.response
    set_cors_headers(request, response)
