# -*- coding: utf-8 -*-
"""
"""
import os
from datetime import datetime
from hashlib import sha256

from sqlalchemy import Table, ForeignKey, Column
from sqlalchemy.types import Unicode, Integer, DateTime, Text
from sqlalchemy.orm import relation, synonym
from sqlalchemy.orm import joinedload_all
import sqlalchemy.orm as sqlao
import sqlalchemy as sqla

from pboard.model import data as pbmd
from pboard.model import auth as pbma
import pboard.model as pbm

import tg

FIXME_ERROR_CODE=-1

class PODStaticController(object):

  @classmethod
  def getCurrentUser(cls):
    loCurrentUser = pbma.User.by_email_address(tg.request.identity['repoze.who.userid'])
    return loCurrentUser

  @classmethod
  def getUserByEmailAddress(cls, psEmailAddress):
    loUser = pbma.User.by_email_address(psEmailAddress)
    return loUser
  
  @classmethod
  def createNewUser(cls, real_name, email_address, password, groups):
    loUser = pbma.User()
    new_user = pbma.User()
    new_user.email_address = email_address
    new_user.display_name  = real_name if real_name!='' else email_address
    new_user.password      = password

    public_group = cls.getGroupById(pbma.Group.GROUP_ID_ALL_USERS)
    public_group.users.append(new_user)

    pbm.DBSession.add(new_user)
    pbm.DBSession.flush()
    pbm.DBSession.refresh(new_user)

    user_dedicated_group = cls.createGroup()
    user_dedicated_group.group_id = 0-new_user.user_id # group id of a given user is the opposite of the user id
    user_dedicated_group.group_name = 'user_%d' % new_user.user_id
    user_dedicated_group.personnal_group = True
    user_dedicated_group.users.append(new_user)

    for group_id in groups:
        selected_group = cls.getGroupById(group_id)
        selected_group.users.append(new_user)

    pbm.DBSession.flush()

    return new_user

  @classmethod
  def updateUser(cls, user_id, real_name, email, group_ids):

      group_ids = list(map(int, group_ids))
      group_ids.append(pbma.Group.GROUP_ID_ALL_USERS)
      print('new group ids:', group_ids)
      user_to_update = pbm.DBSession.query(pbma.User).filter(pbma.User.user_id==user_id).one()
      user_to_update.display_name = real_name
      user_to_update.email_address = email

      merged_new_groups = []

      for group in user_to_update.groups:
          if group.group_id==pbma.Group.GROUP_ID_MANAGERS:
              print('adding group (3)', group.group_id)
              merged_new_groups.append(group)

          elif group.group_id==pbma.Group.GROUP_ID_ALL_USERS:
              print('adding group (2)', group.group_id)
              merged_new_groups.append(group)

          elif group.group_id in group_ids:
              print('adding group', group.group_id)
              merged_new_groups.append(group)

          else:
              print('remove group', group.group_id)
              user_to_update.groups.remove(group)

      for group_id in group_ids:
          group = cls.getGroupById(group_id)

          if group not in merged_new_groups:
              merged_new_groups.append(group)

      user_to_update.groups = merged_new_groups

      for group in merged_new_groups:
          print("group => ", group.group_id)
      pbm.DBSession.flush()

  @classmethod
  def deleteUser(cls, user_id):
      user_to_delete = pbm.DBSession.query(pbma.User).filter(pbma.User.user_id==user_id).one()
      user_dedicated_group = pbm.DBSession.query(pbma.Group).filter(pbma.Group.group_id==-user_id).one()
      pbm.DBSession.delete(user_to_delete)
      pbm.DBSession.delete(user_dedicated_group)
      pbm.DBSession.flush()

  @classmethod
  def getGroup(cls, psGroupName):
    loGroup = pbma.Group.by_group_name(psGroupName)
    return loGroup

  @classmethod
  def getGroupById(cls, group_id):
    return pbm.DBSession.query(pbma.Group).filter(pbma.Group.group_id==group_id).one()

  @classmethod
  def createGroup(cls):
    loGroup = pbma.Group()
    return loGroup

  @classmethod
  def getGroups(cls):
    loGroups = pbma.Group.real_groups_first()
    return loGroups

  @classmethod
  def getRealGroupRightsOnNode(cls, piNodeId: int) -> pbmd.DIRTY_GroupRightsOnNode:

    groupRightsOnNodeCustomSelect = pbm.DBSession\
        .query(pbmd.DIRTY_GroupRightsOnNode)\
        .from_statement(pbmd.DIRTY_RealGroupRightOnNodeSqlQuery)\
        .params(node_id=piNodeId)\
        .all()

    return groupRightsOnNodeCustomSelect

  @classmethod
  def getUserDedicatedGroupRightsOnNode(cls, node: pbmd.PBNode) -> pbmd.DIRTY_GroupRightsOnNode:

    group_rights_on_node = []
    if node:
        group_rights_on_node = pbm.DBSession\
            .query(pbmd.DIRTY_GroupRightsOnNode)\
            .from_statement(pbmd.DIRTY_UserDedicatedGroupRightOnNodeSqlQuery)\
            .params(node_id=node.node_id)\
            .all()

    return group_rights_on_node



class PODUserFilteredApiController(object):
  
  def __init__(self, piUserId, piExtraUserIdList=[]):
    self._iCurrentUserId       = piUserId
    self._iExtraUserIdList     = piExtraUserIdList
    self._iUserIdFilteringList = None
    self._cache_allowed_nodes = None

  def _getUserIdListForFiltering(self):
    if self._iUserIdFilteringList==None:
      self._iUserIdFilteringList = list()
      self._iUserIdFilteringList.append(self._iCurrentUserId)
      for liUserId in self._iExtraUserIdList:
        self._iUserIdFilteringList.append(liUserId)
    return self._iUserIdFilteringList


  def createNode(self, parent_id=0, inherit_rights=True):
    loNode          = pbmd.PBNode()
    loNode.owner_id = self._iCurrentUserId
    if int(parent_id)!=0:
        loNode.parent_id = parent_id

    if inherit_rights:
        parent_node = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.node_id==parent_id).one()
        self.copy_rights(parent_node, loNode)

    pbm.DBSession.add(loNode)

    return loNode

  def copy_rights(self, from_node: pbmd.PBNode, to_node: pbmd.PBNode, copy_also_is_shared=True):
    """
    copy rights from first node to second one
    """
    for parent_right in from_node._lRights:
        new_right = self.createRight()
        new_right.group_id = parent_right.group_id
        new_right.rights = parent_right.rights
        to_node._lRights.append(new_right)

    if copy_also_is_shared:
        to_node.is_shared = from_node.is_shared

  def createDummyNode(self, parent_id, inherit_rights=True):
    loNewNode = self.createNode(parent_id, inherit_rights)
    loNewNode.data_label   = ''
    loNewNode.data_content = ''
    return loNewNode


  def getNode(self, liNodeId: int) -> pbmd.PBNode:

    lsSqlSelectQuery = """pod_nodes.node_id IN
        (SELECT
            pgn.node_id
        FROM
            pod_group_node AS pgn
            join pod_user_group AS pug ON pug.group_id = pgn.group_id
            join pod_user AS pu ON pug.user_id = pu.user_id
        WHERE
            rights > 0
            AND pu.user_id = %s)
    """
    lsNodeIdFiltering = lsSqlSelectQuery % (str(self._iCurrentUserId))

    if liNodeId!=None and liNodeId!=0:
      return pbm.DBSession.query(pbmd.PBNode).options(sqlao.joinedload_all("_oParent"), sqlao.joinedload_all("_lAllChildren"))\
        .filter(pbmd.PBNode.node_id==liNodeId)\
        .filter(
          sqla.or_(
            pbmd.PBNode.owner_id==self._iCurrentUserId,
            lsNodeIdFiltering
          )
        )\
        .one()
    return None

  def getLastModifiedNodes(self, piMaxNodeNb: int):
    """
    Returns a list of nodes order by modification time and limited to piMaxNodeNb nodes
    """
    liOwnerIdList = self._getUserIdListForFiltering()
    return pbm.DBSession.query(pbmd.PBNode)\
        .outerjoin(pbma.Rights)\
        .outerjoin(pbma.user_group_table, pbma.Rights.group_id==pbma.user_group_table.columns['group_id'])\
        .options(joinedload_all("_lAllChildren"))\
        .filter((pbmd.PBNode.owner_id.in_(liOwnerIdList)) | ((pbma.user_group_table.c.user_id.in_(liOwnerIdList)) & (pbmd.PBNode.is_shared == True)))\
        .order_by(pbmd.PBNode.updated_at.desc())\
        .limit(piMaxNodeNb).all()


  def getListOfAllowedNodes(self, reset_cache=False) -> pbmd.PBNode:
      if self._cache_allowed_nodes==None or reset_cache==True:
        lsSqlQuery = """
            SELECT
                pn.node_id,
                pn.parent_id,
                pn.node_order,
                pn.node_type,
                pn.created_at,
                pn.updated_at,
                pn.data_label,
                pn.data_content,
                pn.data_datetime,
                pn.node_status,
                pn.data_reminder_datetime,
                pn.parent_tree_path,
                pn.node_depth,
                pn.owner_id,
                pn.is_shared,
                pn.is_public,
                pn.public_url_key
            FROM
                pod_group_node AS pgn
                join pod_user_group AS pug ON pug.group_id = pgn.group_id
                join pod_nodes AS pn ON pgn.node_id=pn.node_id AND pn.is_shared='t'
            WHERE
                pn.node_type='data'
                AND pn.node_status NOT IN ('deleted', 'closed')
                AND pn.node_id=pgn.node_id
                AND pgn.rights > 0
                AND pug.user_id = :owner_id

            UNION
                SELECT
                    pn.node_id,
                    pn.parent_id,
                    pn.node_order,
                    pn.node_type,
                    pn.created_at,
                    pn.updated_at,
                    pn.data_label,
                    pn.data_content,
                    pn.data_datetime,
                    pn.node_status,
                    pn.data_reminder_datetime,
                    pn.parent_tree_path,
                    pn.node_depth,
                    pn.owner_id,
                    pn.is_shared,
                    pn.is_public,
                    pn.public_url_key
                FROM
                    pod_nodes AS pn
                WHERE
                    pn.node_type = 'data'
                    AND pn.node_status NOT IN ('deleted', 'closed')
                    AND pn.owner_id = :owner_id

            ORDER BY node_id ASC
        """

        loNodeListResult = pbm.DBSession.query(pbmd.PBNode).\
            from_statement(lsSqlQuery).\
            params(owner_id=self._iCurrentUserId)
        allowed_nodes = loNodeListResult.all()

        self._cache_allowed_nodes = allowed_nodes

      return self._cache_allowed_nodes


  def searchNodesByText(self, plKeywordList: [str], piMaxNodeNb=100):
    """
    Returns a list of nodes order by type, nodes which contain at least one of the keywords
    """
    liOwnerIdList = self._getUserIdListForFiltering()

    loKeywordFilteringClauses = []
    for keyword in plKeywordList:
        loKeywordFilteringClauses.append(pbmd.PBNode.data_label.ilike('%'+keyword+'%'))
        loKeywordFilteringClauses.append(pbmd.PBNode.data_content.ilike('%'+keyword+'%'))
        loKeywordFilteringClauses.append(pbmd.PBNode.data_file_name.ilike('%'+keyword+'%'))

    loKeywordFilteringClausesAsOr = sqla.or_(*loKeywordFilteringClauses) # Combine them with or to a BooleanClauseList

    loResultsForSomeKeywords = pbm.DBSession.query(pbmd.PBNode).options(joinedload_all("_lAllChildren")).join(pbma.Rights).join(pbma.user_group_table, pbma.Rights.group_id==pbma.user_group_table.columns['group_id'])\
        .filter(loKeywordFilteringClausesAsOr)\
        .filter((pbmd.PBNode.owner_id.in_(liOwnerIdList)) | (pbma.user_group_table.c.user_id.in_(liOwnerIdList) & pbmd.PBNode.is_shared))\
        .order_by(sqla.desc(pbmd.PBNode.node_type))\
        .limit(piMaxNodeNb)\
        .all()

    return loResultsForSomeKeywords

  def getNodesByStatus(self, psNodeStatus, piMaxNodeNb=5):
    liOwnerIdList = self._getUserIdListForFiltering()
    return pbm.DBSession.query(pbmd.PBNode).options(joinedload_all("_lAllChildren")).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.node_status==psNodeStatus).order_by(pbmd.PBNode.updated_at).limit(piMaxNodeNb).all()


  def getChildNodesForMenu(self, poParentNode: pbmd.PBNode, allowed_nodes: [pbmd.PBNode]) -> [pbmd.PBNode]:
    visible_child_nodes = []

    if poParentNode!=None:
        # standard case
        print(" -------------- BEFORE @@@@@@@@@@@@@@@@ ")
        all_child_nodes = poParentNode.getChildren()
        print("@@@@@@@@@@@@@@@@ AFTER @@@@@@@@@@@@@@@@ ")
        for child_node in all_child_nodes:
          if child_node in allowed_nodes:
            visible_child_nodes.append(child_node)
    else:
        # Root case
        parent_nodes = pbm.DBSession
        for allowed_node in allowed_nodes:
            print("     @@@@@@@@@@@@@@@@ BEFORE @@@@@@@@@@@@@@@@ ")
            # loParent = allowed_node._oParent
            # print("@@@@@@@@@@@@@@@@ AFTER @@@@@@@@@@@@@@@@ {0}".format(allowed_node._oParent.node_id if allowed_node._oParent!=None else '0'))
            # print("==== EXTRA {0}".format(allowed_node._oParent.node_id if allowed_node._oParent!=None else '0'))
            print("====> ")

            if allowed_node._oParent is None or allowed_node._oParent==allowed_node:
                # D.A. - HACK - 2014-05-27
                # I don't know why, but as from now (with use of sqlao.contains_eager in getListOfAllowedNodes()
                # the root items have at first iteration itself as parent
                print("==== EXTRA END")
                # this is a root item => add it
                visible_child_nodes.append(allowed_node)
            else:
                if allowed_node._oParent not in allowed_nodes:
                    # the node is visible but not the parent => put it at the root
                    visible_child_nodes.append(allowed_node)
                else:
                    print("==== EXTRA END 2 {0}".format(allowed_node._oParent.node_id))

    print(" @@@@@@@@@@@@@@@@ PRE FAILURE @@@@@@@@@@@@@@@@ ")
    return visible_child_nodes




  def buildTreeListForMenu(self, current_node: pbmd.PBNode, allowed_nodes: [pbmd.PBNode]) -> [pbmd.NodeTreeItem]:
    # The algorithm is:
    # 1. build an intermediate tree containing only current node and parent path
    #    + complete it with sibling at each level (except root)
    # 2. add sibling nodes at root level
    # 3. complete it with shared documents (which are not at root but shared with current user)

    node_tree = []

    previous_tree_item = None
    tmp_children_nodes = []

    if current_node is not None:
        breadcrumb_nodes = current_node.getBreadCrumbNodes()
        breadcrumb_nodes.append(current_node) # by default the current node is not included

        for breadcrumb_node in reversed(breadcrumb_nodes):
            if previous_tree_item is None:
                # First iteration. We add all current_node children
                for child_node in breadcrumb_node.getChildren():
                    if child_node in allowed_nodes:
                        child_item = pbmd.NodeTreeItem(child_node, [])
                        tmp_children_nodes.append(child_item)

                previous_tree_item = pbmd.NodeTreeItem(breadcrumb_node, tmp_children_nodes)

            else:
                tmp_children_nodes = []
                for child_node in breadcrumb_node.getChildren():
                    if child_node in allowed_nodes:
                        if child_node == previous_tree_item.node:
                            tmp_children_nodes.append(previous_tree_item)
                        else:
                            sibling_node = pbmd.NodeTreeItem(child_node, [])
                            tmp_children_nodes.append(sibling_node)

                previous_tree_item = pbmd.NodeTreeItem(breadcrumb_node, tmp_children_nodes)

    for node in allowed_nodes:
        # This part of the algorithm insert root items
        if node.parent_id==0 or node.parent_id is None:
            if previous_tree_item is not None and node == previous_tree_item.node:
                assert(isinstance(previous_tree_item, pbmd.NodeTreeItem))
                node_tree.append(previous_tree_item)
            else:
                node_tree.append(pbmd.NodeTreeItem(node, []))
        else:
            # Try to add nodes shared with me but with a parent which is not shared
            if node.owner_id!=self._iCurrentUserId:
                # this is a node shared with me
                if node._oParent!=None and node._oParent not in allowed_nodes:
                    # the node is shared but not the parent => put it in the root
                    node_tree.append(pbmd.NodeTreeItem(node, []))


    return node_tree



  def DIRTY_OLDbuildTreeListForMenu(self, plViewableStatusId: []) -> [pbmd.PBNode]:

    liOwnerIdList = self._getUserIdListForFiltering()
    
    # loNodeList = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.node_type==pbmd.PBNodeType.Data).filter(pbmd.PBNode.node_status.in_(plViewableStatusId)).order_by(pbmd.PBNode.parent_tree_path).order_by(pbmd.PBNode.node_order).order_by(pbmd.PBNode.node_id).all()
    loNodeListNotFiltered = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.node_type==pbmd.PBNodeType.Data).filter(pbmd.PBNode.node_status.in_(plViewableStatusId)).order_by(pbmd.PBNode.parent_tree_path).order_by(pbmd.PBNode.node_order).order_by(pbmd.PBNode.node_id).all()

    loNodeList = []
    for loNode in loNodeListNotFiltered:
      if loNode.owner_id in self._getUserIdListForFiltering():
        loNodeList.append(loNode)
      else:
        for loRight in loNode._lRights:
          for loUser in loRight._oGroup.users:
            if loUser.user_id in self._getUserIdListForFiltering():
              loNodeList.append(loNode)

    loTreeList = []
    loTmpDict = {}
    for loNode in loNodeList:
      loTmpDict[loNode.node_id] = loNode
  
      if loNode.parent_id==None or loNode.parent_id==0:
        loTreeList.append(loNode)
      else:
        # append the node to the parent list
        # FIXME - D.A - 2013-10-08
        # The following line may raise an exception
        # We suppose that the parent node has already been added
        # this *should* be the case, but the code does not check it
        if loNode.parent_id not in loTmpDict.keys():
          try:

            loTmpDict[loNode.parent_id] = self.getNode(loNode.parent_id)
          except Exception as e:
            # loTreeList.append(
            # FIXME - D.A. - 2014-05-22 This may be wrong code:
            # we are in the case when the node parent is not shared with the current user
            # So the node should be added at the root
            pass
        if loNode.parent_id in loTmpDict.keys():
          # HACK- D.A. - 2014-05-22 - See FIXME upper
          loTmpDict[loNode.parent_id].appendStaticChild(loNode)
  
    return loTreeList

  def getParentNode(self, loNode):
    liOwnerIdList = self._getUserIdListForFiltering()
    return pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.node_id==loNode.parent_id).one()

  def getSiblingNodes(self, poNode, pbReverseOrder=False):
    liOwnerIdList = self._getUserIdListForFiltering()
    
    if pbReverseOrder:
      return pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.parent_id==poNode.parent_id).order_by(pbmd.PBNode.node_order.desc()).all()
    else:
      return pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.parent_id==poNode.parent_id).order_by(pbmd.PBNode.node_order).all()

  def resetNodeOrderOfSiblingNodes(self, loSiblingNodes):
    liNewWeight = 0
    for loNode in loSiblingNodes:
      liNewWeight = liNewWeight + 1
      loNode.node_order = liNewWeight
    # DBSession.save()

  def moveNodeUpper(self, loNode):
    # FIXME - manage errors and logging
    
    loSiblingNodes = self.getSiblingNodes(loNode)
    self.resetNodeOrderOfSiblingNodes(loSiblingNodes)
  
    loPreviousItem = None
    for loItem in loSiblingNodes:
      if loItem==loNode:
        if loPreviousItem==None:
          return FIXME_ERROR_CODE # FIXME - D.A. Do not use hard-coded error codes
          print("No previous node")
        else:
          liPreviousItemOrder       = loPreviousItem.node_order
          loPreviousItem.node_order = loNode.node_order
          loNode.node_order         = liPreviousItemOrder
          # DBSession.save()
          break
      loPreviousItem = loItem

  def moveNodeLower(self, loNode):
    # FIXME - manage errors and logging
    
    loSiblingNodes = self.getSiblingNodes(loNode)
    self.resetNodeOrderOfSiblingNodes(loSiblingNodes)
  
    loPreviousItem = None
    for loItem in reversed(loSiblingNodes):
      if loItem==loNode:
        if loPreviousItem==None:
          return FIXME_ERROR_CODE # FIXME - D.A. Do not use hard-coded error codes
          # FIXME
          print("No previous node")
        else:
          liPreviousItemOrder       = loPreviousItem.node_order
          loPreviousItem.node_order = loNode.node_order
          loNode.node_order         = liPreviousItemOrder
          # DBSession.save()
          break
      loPreviousItem = loItem

  def getNodeFileContent(self, liNodeId):
    liOwnerIdList = self._getUserIdListForFiltering()
    return pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.node_id==liNodeId).one().data_file_content

  def deleteNode(loNode):
    # INFO - D.A. - 2013-11-07 - should be save as getNode should return only accessible nodes
    pbm.DBSession.delete(loNode)
    return

  def createRight(self):
    loRight = pbma.Rights()
    return loRight
