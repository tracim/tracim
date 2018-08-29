# -*- coding: utf-8 -*-
from pyramid.events import NewResponse
from pyramid.security import forget, remember
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.lib.utils.request import TracimRequest


def add_auth_cookie_in_all_response(config):
    pass
    # INFO - G.M - 17-05-2018 Cookie Headers for all responses
    # config.add_subscriber(add_auth_cookie_to_response, NewResponse)


def add_auth_cookie_to_response(event):
    # INFO - G.M - 17-05-2018 - Add some CORS headers to all requests
    request = event.request
    response = event.response
    if isinstance(request, TracimRequest):
        if request.remove_cookie:
            add_remove_auth_cookie_headers(request, response)
        if request.add_cookie:
            add_set_auth_cookie_headers(request, response)


def add_remove_auth_cookie_headers(request, response):
    response.headers.extend(forget(request))


def add_set_auth_cookie_headers(request, response):
    user = None
    try:
        user = request.current_user
    except NotAuthenticated:
        pass

    if user:
        response.headers.extend(remember(request, user.email))
