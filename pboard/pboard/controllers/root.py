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
    secc = SecureController()
    admin = AdminController(model, DBSession, config_type=TGAdminConfig)

    error = ErrorController()

    api = pbca.PODApiController()
    
    def _before(self, *args, **kw):
        tmpl_context.project_name = "pboard"

    @expose('pboard.templates.index')
    def index(self):
        """Handle the front-page."""
        return dict(page='index')

    @expose('pboard.templates.about')
    def about(self):
        """Handle the 'about' page."""
        return dict(page='about')

    @expose('pboard.templates.environ')
    def environ(self):
        """This method showcases TG's access to the wsgi environment."""
        return dict(page='environ', environment=request.environ)

    @expose('pboard.templates.data')
    @expose('json')
    def data(self, **kw):
        """This method showcases how you can use the same controller for a data page and a display page"""
        return dict(page='data', params=kw)
        
    @expose('pboard.templates.iconset')
    def iconset(self, **kw):
        """This method showcases how you can use the same controller for a data page and a display page"""
        return dict(page='data', params=kw)
        
        
    @expose('pboard.templates.index')
    @require(predicates.has_permission('manage', msg=l_('Only for managers')))
    def manage_permission_only(self, **kw):
        """Illustrate how a page for managers only works."""
        return dict(page='managers stuff')

    @expose('pboard.templates.index')
    @require(predicates.is_user('editor', msg=l_('Only for the editor')))
    def editor_user_only(self, **kw):
        """Illustrate how a page exclusive for the editor works."""
        return dict(page='editor stuff')

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
    def dashboard(self, node=0, came_from=lurl('/')):
        """show the user dashboard"""
        import pboard.model.data as pbmd
        loRootNodeList = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.parent_id==None).order_by(pbmd.PBNode.node_order).all()
        liNodeId = max(int(node), 1)
        print "{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}", liNodeId
        # liNodeId = 5
        loCurrentNode    = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.node_id==liNodeId).one()
        loNodeStatusList = pbmd.PBNodeStatus.getList()
        return dict(root_node_list=loRootNodeList, current_node=loCurrentNode, node_status_list = loNodeStatusList)

    @expose()
    def move_node_upper(self, node_id=0, came_from=lurl('/dashboard')):
      loNode = pld.getNode(node_id)
      pld.moveNodeUpper(loNode)
      redirect(came_from)

    @expose()
    def move_node_lower(self, node_id=0, came_from=lurl('/dashboard')):
      loNode = pld.getNode(node_id)
      pld.moveNodeLower(loNode)
      redirect(came_from)

    @expose()
    def create_document(self, parent_id=None):
      loNewNode = pld.createNode()
      loNewNode.data_label   = 'New document'
      loNewNode.data_content = 'insert content...'
      if int(parent_id)==0:
        loNewNode.parent_id = None
      else:
        loNewNode.parent_id = parent_id

      DBSession.flush()
      redirect(lurl('/dashboard?node=%i'%(loNewNode.node_id)))

    @expose()
    def edit_label(self, node_id, data_label):
      loNewNode = pld.getNode(node_id)
      loNewNode.data_label   = data_label
      redirect(lurl('/dashboard?node=%s'%(node_id)))

    @expose()
    def edit_status(self, node_id, node_status):
      loNewNode = pld.getNode(node_id)
      loNewNode.node_status = node_status
      redirect(lurl('/dashboard?node=%s'%(node_id)))

    @expose()
    def edit_content(self, node_id, data_content, **kw):
      loNewNode = pld.getNode(node_id)
      loNewNode.data_content = data_content
      redirect(lurl('/dashboard?node=%s'%(node_id)))

    @expose()
    def force_delete_node(self, node_id=None):
      loNode     = pld.getNode(node_id)
      liParentId = loNode.parent_id
      if loNode.getChildNb()<=0:
        DBSession.delete(loNode)
      redirect(lurl('/dashboard?node=%i'%(liParentId or 0)))



