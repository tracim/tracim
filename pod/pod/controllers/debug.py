# -*- coding: utf-8 -*-
"""Main Controller"""

from tg import expose, flash, require, url, lurl, request, redirect, tmpl_context
from tg.i18n import ugettext as _, lazy_ugettext as l_
from tg import predicates
from pod import model
from pod.controllers.secure import SecureController
from pod.model import DBSession, metadata

from pod.lib.base import BaseController
from pod.controllers.error import ErrorController

import pod.model as pbm
import pod.controllers as pbc
from pod.lib import dbapi as pld
from pod.controllers import api as pbca

import pod.model.data as pbmd

__all__ = ['DebugController']


class DebugController(BaseController):

  # allow_only = predicates.in_group('admin',
  #                            msg=l_('You\'re not allowed to access this page'))

  @expose('pod.templates.debug.iconset')
  def iconset(self, **kw):
    """This method showcases how you can use the same controller for a data page and a display page"""
    return dict()


  @expose('pod.templates.debug.environ')
  def environ(self, **kw):
    """This method showcases TG's access to the wsgi environment."""
    return dict(environment=request.environ)


  @expose('pod.templates.debug.identity')
  def identity(self, **kw):
    """This method showcases TG's access to the wsgi environment."""
    return dict(identity=request.identity)

