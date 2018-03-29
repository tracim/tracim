# -*- coding: utf-8 -*-
from pyramid.view import notfound_view_config
# TODO - G.M - 29-03-2018 - [Cleanup] Drop this file

@notfound_view_config(renderer='../templates/404.jinja2')
def notfound_view(request):
    request.response.status = 404
    return {}
