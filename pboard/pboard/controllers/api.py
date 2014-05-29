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
from pboard.model import auth as pma
from pboard.model import serializers as pms
from pboard import model as pm
from pboard.lib.auth import can_read, can_write

from pboard.controllers import apimenu as pcam


FIXME_ERROR_CODE=-1


class PODApiController(BaseController):
    """Sample controller-wide authorization"""
    
    allow_only = tgp.in_group('user', msg=l_('You need to login in order to access this ressource'))

    menu = pcam.PODApiMenuController()

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
        
        loResultBuffer = csio.StringIO()
        loImage.save(loResultBuffer,"JPEG")
        tg.response.headers['Content-type'] = str(loFile.data_file_mime_type)
        return loResultBuffer.getvalue()

    @expose()
    @require(can_write())
    def set_parent_node(self, node_id, new_parent_id, **kw):
      """ @see reindex_nodes() """
      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)
      
      # TODO - D.A. - 2013-11-07 - Check that new parent is accessible by the user !!!
      loNewNode = loApiController.getNode(node_id)
      if new_parent_id!='':
        if new_parent_id==0:
          new_parent_id = None
        loNewNode.parent_id = int(new_parent_id)
        self._updateParentTreePathForNodeAndChildren(loNewNode)
      pm.DBSession.flush()
      redirect(lurl('/document/%s'%(node_id)))

    def _updateParentTreePathForNodeAndChildren(self, moved_node: pmd.PBNode):
      """ propagate the move to all child nodes and update there node_depth and parent_tree_path properties """
      parent_node = moved_node._oParent
      if parent_node==None:
        new_parent_tree_path = '/'
        moved_node.node_depth = 0
      else:
        new_parent_tree_path = '{0}{1}/'.format(parent_node.parent_tree_path, parent_node.node_id)
        moved_node.node_depth = parent_node.node_depth+1
      moved_node.parent_tree_path = new_parent_tree_path

      for child_node in moved_node._lAllChildren:
        self._updateParentTreePathForNodeAndChildren(child_node)


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

    def reindex_nodes(self, back_to_node_id=0):
      # DA - INFO - 2014-05-26
      #
      #  The following query allows to detect which not are not up-to-date anymore.
      # These up-to-date failure is related to the node_depth and parent_tree_path being out-dated.
      # This mainly occured when "move node" feature was not working correctly.
      #
      # The way to fix the data is the following:
      # - run mannually the following command
      # - for each result, call manually /api/set_parent_node?node_id=parent_node_id&new_parent_id=parent_parent_id
      #
      sql_query = """
        select
            pn.node_id as child_node_id,
            pn.parent_id as child_parent_id,
            pn.parent_tree_path as child_parent_tree_path,
            pn.node_depth as child_node_depth,
            pnn.node_id as parent_node_id,
            pnn.parent_id as parent_parent_id,
            pnn.parent_tree_path as parent_parent_tree_path,
            pnn.node_depth as parent_node_depth

        from
            pod_nodes as pn,
            pod_nodes as pnn
        where
            pn.parent_id = pnn.node_id
            and pn.parent_tree_path not like pnn.parent_tree_path||'%'
      """
      return 


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

    @expose()
    @require(can_read())
    def set_access_management(self, node_id, is_shared='off', read=[0], write=[0]):

      llReadAccessGroupIds = [int(liGroupId) for liGroupId in read]
      llWriteAccessGroupIds = [int(liGroupId) for liGroupId in write]

      # HACK - D.A. - 2015-058-20
      # the 0 values are added in order to get a read and write parameters as list even if only one value is inside
      # (the default behavior of TG2 is to convert it to a string value if only one value is sent
      #
      llReadAccessGroupIds.remove(0) # remove useless value
      llWriteAccessGroupIds.remove(0) # remove useless value

      loCurrentUser   = pld.PODStaticController.getCurrentUser()
      loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

      loNode = loApiController.getNode(node_id)

      is_shared_b = False if is_shared=='off' else True


      # Only the node owner can modify is_shared
      if is_shared_b != loNode.is_shared and loNode.owner_id != loCurrentUser.user_id:
        self.back_with_error(_("You can't share a document that doesn't belong to you."))
      else:
        loNode.is_shared = is_shared_b
        if not is_shared_b:
          # SHARE IS OFF, so deactivate the document share (and do not change "shared-with" group configuration
          pm.DBSession.flush()
          redirect(lurl('/document/%s#tab-accessmanagement'%(loNode.node_id)))

      # remove all current shares and set the new ones

      for loRight in loNode._lRights:
        pm.DBSession.delete(loRight)
      pm.DBSession.flush()

      ldNewRights = dict()
      for liGroupId in llReadAccessGroupIds:
        ldNewRights[liGroupId] = pma.Rights.READ_ACCESS

      for liGroupId in llWriteAccessGroupIds:
        liOldValue = 0
        if liGroupId in ldNewRights:
          liOldValue = ldNewRights[liGroupId]
        ldNewRights[liGroupId] = liOldValue + pma.Rights.WRITE_ACCESS

      user_list = loApiController._getUserIdListForFiltering()
      comments = pm.DBSession.query(pmd.PBNode).filter(pmd.PBNode.parent_id==node_id).\
              filter((pmd.PBNode.owner_id.in_(user_list)) | (pma.user_group_table.c.user_id.in_(user_list))).\
              filter(pmd.PBNode.node_type=='comment').all()
      for comment in comments:
          pm.DBSession.add(comment)

      for liGroupId, liRightLevel in ldNewRights.items():
        loNewRight = loApiController.createRight()
        loNewRight.group_id = liGroupId
        loNewRight.node_id = node_id
        loNewRight.rights = liRightLevel
        loNode._lRights.append(loNewRight)
        for comment in comments:
            comment_right = loApiController.createRight()
            comment_right.group_id = liGroupId
            comment_right.node_id = comment.node_id
            comment_right.rights = liRightLevel

      redirect(lurl('/document/%s#tab-accessmanagement'%(loNode.node_id)))
