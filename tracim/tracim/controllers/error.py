# -*- coding: utf-8 -*-
"""Error controller"""

from tg import expose
from tg import override_template
from tg import request
from tg import tmpl_context

from tracim.controllers import TIMRestPathContextSetup

from tracim.model.serializers import Context
from tracim.model.serializers import CTX
from tracim.model.serializers import DictLikeClass

__all__ = ['ErrorController']


class ErrorController(object):
    """
    Generates error documents as and when they are required.

    The ErrorDocuments middleware forwards to ErrorController when error
    related status codes are returned from the application.

    This behaviour can be altered by changing the parameters to the
    ErrorDocuments middleware in your config/middleware.py file.
    
    """

    @expose('tracim.templates.error')
    def document(self, *args, **kwargs):
        """Render the error document"""
        resp = request.environ.get('tg.original_response')
        default_message = ('<p>We\'re sorry but we weren\'t able to process '
                           ' this request.</p>')

        values = DictLikeClass(
            prefix=request.environ.get('SCRIPT_NAME', ''),
            code=request.params.get('code', resp.status_int),
            message=request.params.get('message', default_message))

        if request.identity:
            override_template(ErrorController.document, 'mako:tracim.templates.error_authenticated')

            TIMRestPathContextSetup.current_user()
            user = tmpl_context.current_user
            current_user_content = Context(CTX.CURRENT_USER).toDict(user)
            fake_api = Context(CTX.CURRENT_USER).toDict({'current_user': current_user_content})
            values['fake_api'] = fake_api

        return values
