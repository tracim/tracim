# -*- coding: utf-8 -*-
"""Main Controller"""

from tg import expose, flash, require, url, lurl, request, redirect, tmpl_context
from tg.i18n import ugettext as _, lazy_ugettext as l_
from tg import predicates
from pboard import model
from pboard.controllers.secure import SecureController
from pboard.model import DBSession, metadata
from tgext.admin.tgadminconfig import TGAdminConfig
from tgext.admin.controller import AdminController

from pboard.lib.base import BaseController
from pboard.controllers.error import ErrorController

import pboard.model as pbm
import pboard.controllers as pbc
from pboard.lib import dbapi as pld
from pboard.controllers import api as pbca

import pboard.model.data as pbmd

__all__ = ['DebugController']


class DebugController(BaseController):

  allow_only = predicates.in_group('admin',
                              msg=l_('You\'re not allowed to access this page'))

  @expose('pboard.templates.debug.iconset')
  def iconset(self, **kw):
    """This method showcases how you can use the same controller for a data page and a display page"""
    return dict()


  @expose('pboard.templates.debug.environ')
  def environ(self, **kw):
    """This method showcases TG's access to the wsgi environment."""
    return dict(environment=request.environ)


  @expose('pboard.templates.debug.identity')
  def identity(self, **kw):
    """This method showcases TG's access to the wsgi environment."""
    return dict(identity=request.identity)

