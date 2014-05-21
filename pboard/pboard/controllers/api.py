# -*- coding: utf-8 -*-
"""Sample controller with all its actions protected."""
from datetime import datetime

# TODO - D.A. - 2013-11-19
# Check if the new import (ie import io instead of cStringIO)
# is working correctly
#import io as csio

# INFO - D.A. - 2013-11-19
# The PIL import is now taken from the pillow
# which is the python3 port of PIL
#
from PIL import Image as pil

import tg
from tg import expose, flash, require, url, lurl, request, redirect, tmpl_context
from tg.i18n import ugettext as _, lazy_ugettext as l_
from tg import predicates as tgp

from tg.i18n import ugettext as _, lazy_ugettext as l_

from pboard.lib.base import BaseController
from pboard.lib   import dbapi as pld
from pboard.model import data as pmd
from pboard import model as pm
from pboard.lib.auth import can_read, can_write

__all__ = ['PODPublicApiController', 'PODApiController']

FIXME_ERROR_CODE=-1

class PODPublicApiController(BaseController):

    @expose()
    def create_account(self, email='', password='', retyped_password='', **kw):
      if email=='' or password=='' or retyped_password=='':
        flash(_('Account creation error: please fill all the fields'), 'error')
        redirect(lurl('/'))
      elif password!=retyped_password:
        flash(_('Account creation error: passwords do not match'), 'error')
        redirect(lurl('/'))
      else:
        loExistingUser = pld.PODStaticController.getUserByEmailAddress(email)
        if loExistingUser!=None:
          flash(_('Account creation error: account already exist: %s') % (email), 'error')
          redirect(lurl('/'))
        
        loNewAccount = pld.PODStaticController.createUser()
        loNewAccount.email_address = email
        loNewAccount.display_name  = email
        loNewAccount.password      = password

        loUserGroup = pld.PODStaticController.getGroup('user')
        loUserGroup.users.append(loNewAccount)

        pm.DBSession.add(loNewAccount)
        pm.DBSession.flush()
        pm.DBSession.refresh(loNewAccount)

        loUserSpecificGroup = pld.PODStaticController.createGroup()

        loUserSpecificGroup.group_id = 0-loNewAccount.user_id # group id of a given user is the opposite of the user id
        loUserSpecificGroup.group_name = ''
        loUserSpecificGroup.personnal_group = True
        loUserSpecificGroup.users.append(loNewAccount)

        pm.DBSession.flush()

        flash(_('Account successfully created: %s') % (email), 'info')
        redirect(lurl('/'))


class PODApiController(BaseController):
    """Sample controller-wide authorization"""
    
    allow_only = tgp.in_group('user', msg=l_('You need to login in order to access this ressource'))
    
    @expose()
    def create_event(self, parent_id=None, data_label='', data_datetime=None, data_content='', data_reminder_datetime=None, add_reminder=False, **kw):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      loNewNode = loApiController.createNode(int(parent_id))
      loNewNode.node_type     = pmd.PBNodeType.Event
      loNewNode.data_label    = data_label
      loNewNode.data_content  = data_content
      loNewNode.data_datetime = datetime.strptime(data_datetime, '%d/%m/%Y %H:%M')
      if add_reminder:
        loNewNode.data_reminder_datetime = data_reminder_datetime

      pm.DBSession.flush()
      redirect(lurl('/document/%i'%(loNewNode.parent_id)))

    @expose()
    def create_contact(self, parent_id=None, data_label='', data_content='', **kw):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      loNewNode = loApiController.createNode(int(parent_id))
      loNewNode.node_type     = pmd.PBNodeType.Contact
      loNewNode.data_label    = data_label
      loNewNode.data_content  = data_content

      pm.DBSession.flush()
      redirect(lurl('/document/%i'%(loNewNode.parent_id)))

    @expose()
    def create_comment(self, parent_id=None, data_label='', data_content='', is_shared='', **kw):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

      loNewNode = loApiController.createNode(int(parent_id))
      loNewNode.node_type     = pmd.PBNodeType.Comment
      loNewNode.data_label    = data_label
      loNewNode.data_content  = data_content
      if is_shared=='on':
        loNewNode.is_shared = True

      pm.DBSession.flush()
      redirect(lurl('/document/%i'%(loNewNode.parent_id)))

    @expose()
    def create_file(self, parent_id=None, data_label='', data_content='', data_file=None, **kw):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      loNewNode = loApiController.createNode(int(parent_id))
      loNewNode.node_type     = pmd.PBNodeType.File
      loNewNode.data_label    = data_label
      loNewNode.data_content  = data_content

      loNewNode.data_file_name      = data_file.filename
      loNewNode.data_file_mime_type = data_file.type
      loNewNode.data_file_content   = data_file.file.read()

      pm.DBSession.flush()
      redirect(lurl('/document/%i'%(loNewNode.parent_id)))

    @expose()
    @require(can_read())
    def get_file_content(self, node_id=None, **kw):
      if node_id==None:
        return
      else:
        loCurrentUser   = pld.PODStaticController.getCurrentUser()
        loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
        loFile = loApiController.getNode(node_id)

        lsContentType = "application/x-download"
        if loFile.data_file_mime_type!='':
          tg.response.headers['Content-type'] = str(loFile.data_file_mime_type)

        tg.response.headers['Content-Type']        = lsContentType
        tg.response.headers['Content-Disposition'] = str('attachment; filename="%s"'%(loFile.data_file_name))
        return loFile.data_file_content

    @expose()
    def get_file_content_thumbnail(self, node_id=None, **kw):
      if node_id==None:
        return
      else:
        loCurrentUser   = pld.PODStaticController.getCurrentUser()
        loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
        
        loFile = loApiController.getNode(node_id)
        
        loJpegBytes = csio.StringIO(loFile.data_file_content)
        loImage     = pil.open(loJpegBytes)
        loImage.thumbnail([140,140], pil.ANTIALIAS)
        
        loResultBuffer = StringIO()
        loImage.save(loResultBuffer,"JPEG")
        tg.response.headers['Content-type'] = str(loFile.data_file_mime_type)
        return loResultBuffer.getvalue()

    @expose()
    @require(can_write())
    def set_parent_node(self, node_id, new_parent_id, **kw):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      # TODO - D.A. - 2013-11-07 - Check that new parent is accessible by the user !!!
      loNewNode = loApiController.getNode(node_id)
      if new_parent_id!='':
        loNewNode.parent_id = int(new_parent_id)
      pm.DBSession.flush()
      redirect(lurl('/document/%s'%(node_id)))

    @expose()
    @require(can_write())
    def move_node_upper(self, node_id=0):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      loNode = loApiController.getNode(node_id)
      if loApiController.moveNodeUpper(loNode)==FIXME_ERROR_CODE:
        flash(_('Document #%s can\'t move upper.')%(node_id))
      redirect(lurl('/document/%s'%(node_id)))

    @expose()
    @require(can_write())
    def move_node_lower(self, node_id=0):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      loNode = loApiController.getNode(node_id)
      if loApiController.moveNodeLower(loNode)==FIXME_ERROR_CODE:
        flash(_('Document #%s can\'t move lower.')%(node_id))
      redirect(lurl('/document/%s'%(node_id)))

    @expose()
    def create_document(self, parent_id=None, data_label='', data_content=''):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

      lsNodeName = 'Document with no name...'
      if int(parent_id)!=0:
        loParent = loApiController.getNode(parent_id)
        lsNodeName = 'Subdocument of (%s)' % loParent.data_label

      loNewNode = loApiController.createDummyNode(parent_id)
      loNewNode.data_label   = lsNodeName
      loNewNode.data_content = 'insert content...'

      if data_label!='':
        loNewNode.data_label = data_label
      if data_content!='':
        loNewNode.data_content = data_content

      if int(parent_id)!=0:
        loNewNode.parent_id = parent_id

      pm.DBSession.flush()
      redirect(lurl('/document/%i'%(loNewNode.node_id)))

    @expose()
    @require(can_write())
    def edit_status(self, node_id, node_status):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      loNode = loApiController.getNode(node_id)
      loNode.node_status = node_status
      redirect(lurl('/document/%s'%(node_id)))

    @expose()
    @require(can_write())
    def edit_label_and_content(self, node_id, data_label, data_content):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      loNode = loApiController.getNode(node_id)
      loNode.data_label   = data_label
      loNode.data_content = data_content
      redirect(lurl('/document/%s'%(node_id)))

    @expose()
    @require(can_write())
    def force_delete_node(self, node_id=None):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      loNode = loApiController.getNode(node_id)
      liParentId = loNode.parent_id
      if loNode.getChildNb()<=0:
        pm.DBSession.delete(loNode)
        flash(_('Document #%s has been deleted')%(node_id))
      else:
        flash(_('Document #%s can\'t be deleted because it is not empty.')%(node_id), 'error')
        redirect(lurl('/document/%s'%(node_id)))

      redirect(lurl('/document/%i'%(liParentId or 0)))

    @expose()
    def reindex_nodes(self, back_to_node_id=0):
      # FIXME - NOT SAFE
      loRootNodeList   = pm.DBSession.query(pmd.PBNode).order_by(pmd.PBNode.parent_id).all()
      for loNode in loRootNodeList:
        if loNode.parent_id==None:
          loNode.node_depth = 0
          loNode.parent_tree_path = '/'
        else:
          loNode.node_depth = loNode._oParent.node_depth+1
          loNode.parent_tree_path = '%s%i/'%(loNode._oParent.parent_tree_path,loNode.parent_id)
      
      pm.DBSession.flush()
      flash(_('Documents re-indexed'), 'info')
      redirect(lurl('/document/%s'%(back_to_node_id)))

    @expose()
    @require(can_write())
    def toggle_share_status(self, node_id):
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      loNode = loApiController.getNode(node_id)
      if loNode.owner_id==loCurrentUser.user_id:
        loNode.is_shared = not loNode.is_shared
      # FIXME - DA. - 2014-05-06
      # - if root node, then exception
      # - this redirect is done in order to be adapted to comment share status toggle
      redirect(lurl('/document/%s#tab-comments'%(loNode._oParent.node_id)))
