# -*- coding: utf-8 -*-
"""Sample controller with all its actions protected."""
from datetime import datetime
from tg import expose, flash, require, url, lurl, request, redirect, tmpl_context
from tg.i18n import ugettext as _, lazy_ugettext as l_
from tg import predicates


from pboard.lib.base import BaseController
from pboard.lib   import dbapi as pld
from pboard.model import data as pmd
from pboard import model as pm

__all__ = ['PODApiController']

class PODApiController(BaseController):
    """Sample controller-wide authorization"""
    
    # The predicate that must be met for all the actions in this controller:
    # allow_only = has_permission('manage',
    #                             msg=l_('Only for people with the "manage" permission'))
    
    @expose('pboard.templates.index')
    def index(self):
        """Let the user know that's visiting a protected controller."""
        flash(_("Secure Controller here"))
        return dict(page='index')
    
    @expose()
    def create_event(self, parent_id=None, data_label=u'', data_datetime=None, data_content=u'', data_reminder_datetime=None, add_reminder=False, **kw):

      loNewNode = pld.createNode()
      loNewNode.parent_id     = int(parent_id)
      loNewNode.node_type     = pmd.PBNodeType.Event
      loNewNode.data_label    = data_label
      loNewNode.data_content  = data_content
      loNewNode.data_datetime = datetime.strptime(data_datetime, '%d/%m/%Y %H:%M')
      if add_reminder:
        loNewNode.data_reminder_datetime = data_reminder_datetime

      pm.DBSession.flush()
      redirect(lurl('/document/%i'%(loNewNode.parent_id)))

    @expose()
    def set_parent_node(self, node_id, new_parent_id, **kw):
      loNewNode = pld.getNode(node_id)
      if new_parent_id!='':
        loNewNode.parent_id = int(new_parent_id)
      pm.DBSession.flush()
      redirect(lurl('/document/%s'%(node_id)))

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
      redirect(lurl('/document/%i'%(loNewNode.node_id)))

    @expose()
    def edit_label(self, node_id, data_label):
      loNewNode = pld.getNode(node_id)
      loNewNode.data_label   = data_label
      redirect(lurl('/document/%s'%(node_id)))

    @expose()
    def edit_status(self, node_id, node_status):
      loNewNode = pld.getNode(node_id)
      loNewNode.node_status = node_status
      redirect(lurl('/document/%s'%(node_id)))

    @expose()
    def edit_content(self, node_id, data_content, **kw):
      loNewNode = pld.getNode(node_id)
      loNewNode.data_content = data_content
      redirect(lurl('/document/%s'%(node_id)))

    @expose()
    def force_delete_node(self, node_id=None):
      loNode     = pld.getNode(node_id)
      liParentId = loNode.parent_id
      if loNode.getChildNb()<=0:
        DBSession.delete(loNode)
      redirect(lurl('/document/%i'%(liParentId or 0)))

