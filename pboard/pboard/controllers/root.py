# -*- coding: utf-8 -*-
"""Main Controller"""

from tg import expose, flash, require, url, lurl, request, redirect, tmpl_context
from tg.i18n import ugettext as _, lazy_ugettext as l_
from tg import predicates
from pboard import model
from pboard.model import DBSession, metadata
from tgext.admin.tgadminconfig import TGAdminConfig
from tgext.admin.controller import AdminController

from pboard.lib.base import BaseController
from pboard.controllers.error import ErrorController

import pboard.model as pbm
import pboard.controllers as pbc
from pboard.lib import dbapi as pld
from pboard.controllers import api as pbca
from pboard.controllers import debug as pbcd

import pboard.model.data as pbmd

__all__ = ['RootController']


class RootController(BaseController):
    """
    The root controller for the pboard application.

    All the other controllers and WSGI applications should be mounted on this
    controller. For example::

        panel = ControlPanelController()
        another_app = AnotherWSGIApplication()

    Keep in mind that WSGI applications shouldn't be mounted directly: They
    must be wrapped around with :class:`tg.controllers.WSGIAppController`.

    """
    admin = AdminController(model, DBSession, config_type=TGAdminConfig)

    api   = pbca.PODApiController()
    debug = pbcd.DebugController()
    error = ErrorController()

    def _before(self, *args, **kw):
        tmpl_context.project_name = "pboard"

    @expose('pboard.templates.index')
    def index(self):
        """Handle the front-page."""
        return dict()


    @expose('pboard.templates.login')
    def login(self, came_from=lurl('/')):
        """Start the user login."""
        login_counter = request.environ.get('repoze.who.logins', 0)
        if login_counter > 0:
            flash(_('Wrong credentials'), 'warning')
        return dict(page='login', login_counter=str(login_counter),
                    came_from=came_from)

    @expose()
    def post_login(self, came_from=lurl('/')):
        """
        Redirect the user to the initially requested page on successful
        authentication or redirect her back to the login page if login failed.

        """
        if not request.identity:
            login_counter = request.environ.get('repoze.who.logins', 0) + 1
            redirect('/login',
                params=dict(came_from=came_from, __logins=login_counter))
        userid = request.identity['repoze.who.userid']
        flash(_('Welcome back, %s!') % userid)
        redirect(came_from)

    @expose()
    def post_logout(self, came_from=lurl('/')):
        """
        Redirect the user to the initially requested page on logout and say
        goodbye as well.

        """
        flash(_('We hope to see you soon!'))
        redirect(came_from)
        
    @expose('pboard.templates.document')
    @require(predicates.in_group('user', msg=l_('Please login to access this page')))
    def document(self, node=0, came_from=lurl('/')):
        """show the user dashboard"""
        import pboard.model.data as pbmd
        
        # loRootNodeList   = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.parent_id==None).order_by(pbmd.PBNode.node_order).all()
        loRootNodeList = pld.buildTreeListForMenu()
        liNodeId         = max(int(node), 1) # show node #1 if no selected node
        loCurrentNode    = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.node_id==liNodeId).one()
        loNodeStatusList = pbmd.PBNodeStatus.getList()
        return dict(root_node_list=loRootNodeList, current_node=loCurrentNode, node_status_list = loNodeStatusList)

