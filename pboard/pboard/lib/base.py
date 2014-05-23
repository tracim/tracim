# -*- coding: utf-8 -*-

"""The base Controller API."""

from tg import TGController, tmpl_context, flash
from tg.render import render
from tg import request, redirect
from tg.i18n import ugettext as _, ungettext
import pboard.model as model

__all__ = ['BaseController']


class BaseController(TGController):
    """
    Base class for the controllers in the application.

    Your web application should have one of these. The root of
    your application is used to compute URLs used by your app.

    """

    def __call__(self, environ, context):
        """Invoke the Controller"""
        # TGController.__call__ dispatches to the Controller method
        # the request is routed to.

        request.identity = request.environ.get('repoze.who.identity')
        tmpl_context.identity = request.identity
        return TGController.__call__(self, environ, context)

    def back_with_error(self, message):
        flash(message)
        redirect(request.headers['Referer'])
