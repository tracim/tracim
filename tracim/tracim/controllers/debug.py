# -*- coding: utf-8 -*-

from tg import expose, flash, require, url, lurl, request, redirect, tmpl_context
from tracim.model.serializers import Context
from tracim.model.serializers import CTX
from tracim.model.serializers import DictLikeClass

from tracim.controllers import StandardController

from tg.predicates import Predicate

class is_debug(Predicate):

    def __init__(self, **kwargs):
        super(is_debug, self).__init__(**kwargs)
        self.message = 'Debug is not activated'

    def evaluate(self, environ, credentials):
        # Comment next line if you want to activate the debug controller
        pass
        self.unmet()

class DebugController(StandardController):

    @require(is_debug())
    @expose('tracim.templates.debug.iconset')
    def iconset_fa(self, **kw):
        user = tmpl_context.current_user

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.CURRENT_USER).toDict({'current_user': current_user_content})

        return DictLikeClass(fake_api=fake_api)

    @require(is_debug())
    @expose('tracim.templates.debug.iconset-tango')
    def iconset_tango(self, **kw):
        user = tmpl_context.current_user
        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.CURRENT_USER).toDict({'current_user': current_user_content})

        return DictLikeClass(fake_api=fake_api)

    @require(is_debug())
    @expose('tracim.templates.debug.environ')
    def environ(self, **kw):
        user = tmpl_context.current_user
        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.CURRENT_USER).toDict({'current_user': current_user_content})

        return DictLikeClass(fake_api=fake_api, environment=request.environ)


    @require(is_debug())
    @expose('tracim.templates.debug.identity')
    def identity(self, **kw):
        user = tmpl_context.current_user
        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.CURRENT_USER).toDict({'current_user': current_user_content})

        return DictLikeClass(fake_api=fake_api, identity=request.identity)

