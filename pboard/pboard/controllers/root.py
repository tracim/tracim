# -*- coding: utf-8 -*-
"""Main Controller"""
import pboard

import tg
from tg import expose, flash, require, url, lurl, request, redirect, tmpl_context
from tg.i18n import ugettext as _, lazy_ugettext as l_
from tg import predicates

import tgext.admin.tgadminconfig as tgat
import tgext.admin.controller as tgac

from pboard.lib.base import BaseController
from pboard.controllers.error import ErrorController

from pboard.lib import dbapi as pld
from pboard.controllers import api as pbca
from pboard.controllers import debug as pbcd

from pboard import model as pm

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

    admin = tgac.AdminController(
        pm,
        pm.DBSession,
        config_type = tgat.TGAdminConfig
    )

    api   = pbca.PODApiController()
    debug = pbcd.DebugController()
    error = ErrorController()

    public_api = pbca.PODPublicApiController()

    def _before(self, *args, **kw):
        tmpl_context.project_name = "pboard"

    @expose('pboard.templates.index')
    def index(self):
        """Handle the front-page."""
        return dict()


    @expose('pboard.templates.about')
    def about(self):
        """Handle the about-page."""
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
        
    @expose('pboard.templates.dashboard')
    @require(predicates.in_group('user', msg=l_('Please login to access this page')))
    def dashboard(self):
        loCurrentUser   = pld.PODStaticController.getCurrentUser()
        loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

        loLastModifiedNodes = loApiController.getLastModifiedNodes(10)
        loWhatsHotNodes     = loApiController.getNodesByStatus('hot', 5)
        loActionToDoNodes   = loApiController.getNodesByStatus('actiontodo', 5)
        return dict(last_modified_nodes=loLastModifiedNodes, whats_hot_nodes=loWhatsHotNodes, action_to_do_nodes = loActionToDoNodes)


    @expose('pboard.templates.document')
    @require(predicates.in_group('user', msg=l_('Please login to access this page')))
    def document(self, node=0, came_from=lurl('/'), highlight=''):
        """show the user dashboard"""
        loCurrentUser   = pld.PODStaticController.getCurrentUser()
        loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

        # loRootNodeList   = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.parent_id==None).order_by(pbmd.PBNode.node_order).all()
        loRootNodeList = loApiController.buildTreeListForMenu(pbmd.PBNodeStatus.getVisibleIdsList())
        liNodeId         = int(node)

        loCurrentNode    = None
        loNodeStatusList = None
        try:
          loNodeStatusList = pbmd.PBNodeStatus.getChoosableList()
          loCurrentNode    = loApiController.getNode(liNodeId)
        except Exception as e:
          flash(_('Document not found'), 'error')

        # FIXME - D.A - 2013-11-07 - Currently, the code build a new item if no item found for current user
        # the correct behavior should be to redirect to setup page
        if loCurrentNode is not None and "%s"%loCurrentNode.node_id!=node:
          redirect(tg.url('/document/%i'%loCurrentNode.node_id))

        if loCurrentNode is None:
          loCurrentNode = loApiController.getNode(0) # try to get an item
          if loCurrentNode is not None:
            flash(_('Document not found. Randomly showing item #%i')%(loCurrentNode.node_id), 'warning')
            redirect(tg.url('/document/%i'%loCurrentNode.node_id))
          else:
            flash(_('Your first document has been automatically created'), 'info')
            loCurrentNode = loApiController.createDummyNode()
            pm.DBSession.flush()
            redirect(tg.url('/document/%i'%loCurrentNode.node_id))

        return dict(
            root_node_list=loRootNodeList,
            current_node=loCurrentNode,
            node_status_list = loNodeStatusList,
            keywords = highlight
        )

    @expose('pboard.templates.search')
    @require(predicates.in_group('user', msg=l_('Please login to access this page')))
    def search(self, keywords=''):
        loCurrentUser   = pld.PODStaticController.getCurrentUser()
        loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

        loFoundNodes = loApiController.searchNodesByText(keywords.split())

        return dict(search_string=keywords, found_nodes=loFoundNodes)



