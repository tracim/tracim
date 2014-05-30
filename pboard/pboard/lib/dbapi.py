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
import sqlalchemy as sqla

from pboard.model import DeclarativeBase, metadata, DBSession
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
  def createUser(cls):
    loUser = pbma.User()
    return loUser
  
  @classmethod
  def getGroup(cls, psGroupName):
    loGroup = pbma.Group.by_group_name(psGroupName)
    return loGroup

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

    groupRightsOnNodeCustomSelect = DBSession\
        .query(pbmd.DIRTY_GroupRightsOnNode)\
        .from_statement(pbmd.DIRTY_RealGroupRightOnNodeSqlQuery)\
        .params(node_id=piNodeId)\
        .all()

    return groupRightsOnNodeCustomSelect

  @classmethod
  def getUserDedicatedGroupRightsOnNode(cls, piNodeId: int) -> pbmd.DIRTY_GroupRightsOnNode:

    groupRightsOnNodeCustomSelect = DBSession\
        .query(pbmd.DIRTY_GroupRightsOnNode)\
        .from_statement(pbmd.DIRTY_UserDedicatedGroupRightOnNodeSqlQuery)\
        .params(node_id=piNodeId)\
        .all()

    return groupRightsOnNodeCustomSelect



class PODUserFilteredApiController(object):
  
  def __init__(self, piUserId, piExtraUserIdList=[]):
    self._iCurrentUserId       = piUserId
    self._iExtraUserIdList     = piExtraUserIdList
    self._iUserIdFilteringList = None
  

  def _getUserIdListForFiltering(self):
    if self._iUserIdFilteringList==None:
      self._iUserIdFilteringList = list()
      self._iUserIdFilteringList.append(self._iCurrentUserId)
      for liUserId in self._iExtraUserIdList:
        self._iUserIdFilteringList.append(liUserId)
    return self._iUserIdFilteringList


  def createNode(self, parent_id=0):
    loNode          = pbmd.PBNode()
    loNode.owner_id = self._iCurrentUserId
    if int(parent_id)!=0:
      loNode.parent_id = parent_id
    parent_rights = DBSession.query(pbma.Rights).filter(pbma.Rights.node_id==parent_id).all()
    loNode.rights = parent_rights
    loNode.rights = [pbma.Rights(group_id=r.group_id, rights=r.rights) for r in parent_rights]
    DBSession.add(loNode)
    return loNode
  
  def createDummyNode(self, parent_id):
    loNewNode = self.createNode(parent_id)
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
      return DBSession.query(pbmd.PBNode).options(joinedload_all("_lAllChildren"))\
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
    return DBSession.query(pbmd.PBNode).options(joinedload_all("_lAllChildren")).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).order_by(pbmd.PBNode.updated_at.desc()).limit(piMaxNodeNb).all()


  def getListOfAllowedNodes(self) -> pbmd.PBNode:
    lsSqlQuery = """
        SELECT
            pgn.node_id
        FROM
            pod_group_node AS pgn
            join pod_user_group AS pug ON pug.group_id = pgn.group_id
        WHERE
            pgn.rights > 0
            AND pug.user_id = :owner_id
        UNION
            SELECT
                node_id
            FROM
                pod_nodes
            WHERE
            owner_id=:owner_id;
    """

    loNodeListResult = DBSession.query(pbmd.PBNode).from_statement(lsSqlQuery).params(owner_id=self._iCurrentUserId)

    return loNodeListResult.all()


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

    loResultsForSomeKeywords = DBSession.query(pbmd.PBNode).options(joinedload_all("_lAllChildren")).join(pbma.Rights).join(pbma.user_group_table, pbma.Rights.group_id==pbma.user_group_table.columns['group_id'])\
        .filter(loKeywordFilteringClausesAsOr)\
        .filter((pbmd.PBNode.owner_id.in_(liOwnerIdList)) | (pbma.user_group_table.c.user_id.in_(liOwnerIdList) & pbmd.PBNode.is_shared))\
        .order_by(sqla.desc(pbmd.PBNode.node_type))\
        .limit(piMaxNodeNb)\
        .all()

    return loResultsForSomeKeywords

  def getNodesByStatus(self, psNodeStatus, piMaxNodeNb=5):
    liOwnerIdList = self._getUserIdListForFiltering()
    return DBSession.query(pbmd.PBNode).options(joinedload_all("_lAllChildren")).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.node_status==psNodeStatus).order_by(pbmd.PBNode.updated_at).limit(piMaxNodeNb).all()


  def buildTreeListForMenu(self, poCurrentNode: pbmd.PBNode, plViewableStatusId: [], plAllowedNodes: [pbmd.PBNode]) -> [pbmd.NodeTreeItem]:
    # The algorithm is:
    # 1. build an intermediate tree containing only current node and parent path
    #    + complete it with sibling at each level (except root)
    # 2. add sibling nodes at root level
    # 3. complete it with shared documents (which are not at root but shared with current user)

    node_tree = []

    previous_tree_item = None
    tmp_children_nodes = []

    if poCurrentNode is not None:
        breadcrumb_nodes = poCurrentNode.getBreadCrumbNodes()
        breadcrumb_nodes.append(poCurrentNode) # by default the current node is not included

        for breadcrumb_node in reversed(breadcrumb_nodes):
            if previous_tree_item is None:
                # First iteration. We add all current_node children
                for child_node in breadcrumb_node.getChildren():
                    child_item = pbmd.NodeTreeItem(child_node, [])
                    tmp_children_nodes.append(child_item)
                previous_tree_item = pbmd.NodeTreeItem(breadcrumb_node, tmp_children_nodes)
            else:
                tmp_children_nodes = []
                for child_node in breadcrumb_node.getChildren():
                    if child_node == previous_tree_item.node:
                        tmp_children_nodes.append(previous_tree_item)
                    else:
                        sibling_node = pbmd.NodeTreeItem(child_node, [])
                        tmp_children_nodes.append(sibling_node)

                previous_tree_item = pbmd.NodeTreeItem(breadcrumb_node, tmp_children_nodes)

    for node in plAllowedNodes:
        if node.parent_id==0 or node.parent_id is None:
            if previous_tree_item is not None and node == previous_tree_item.node:
                node_tree.append(previous_tree_item)
            else:
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
    return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.node_id==loNode.parent_id).one()

  def getSiblingNodes(self, poNode, pbReverseOrder=False):
    liOwnerIdList = self._getUserIdListForFiltering()
    
    if pbReverseOrder:
      return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.parent_id==poNode.parent_id).order_by(pbmd.PBNode.node_order.desc()).all()
    else:
      return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.parent_id==poNode.parent_id).order_by(pbmd.PBNode.node_order).all()

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
    return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.owner_id.in_(liOwnerIdList)).filter(pbmd.PBNode.node_id==liNodeId).one().data_file_content

  def deleteNode(loNode):
    # INFO - D.A. - 2013-11-07 - should be save as getNode should return only accessible nodes
    DBSession.delete(loNode)
    return

  def createRight(self):
    loRight = pbma.Rights()
    return loRight
