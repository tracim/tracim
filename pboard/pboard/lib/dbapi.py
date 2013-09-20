# -*- coding: utf-8 -*-
"""
"""
import os
from datetime import datetime
from hashlib import sha256
__all__ = ['User', 'Group', 'Permission']

from sqlalchemy import Table, ForeignKey, Column
from sqlalchemy.types import Unicode, Integer, DateTime, Text
from sqlalchemy.orm import relation, synonym
from sqlalchemy.orm import joinedload_all

from pboard.model import DeclarativeBase, metadata, DBSession
from pboard.model import data as pbmd
import pboard.model as pbm

def createNode():
  loNode = pbmd.PBNode()
  DBSession.add(loNode)
  return loNode

def getNode(liNodeId):
  return DBSession.query(pbmd.PBNode).options(joinedload_all("_lAllChildren")).filter(pbmd.PBNode.node_id==liNodeId).one()

def getParentNode(loNode):
  return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.node_id==loNode.parent_id).one()

def getSiblingNodes(poNode, pbReverseOrder=False):
  if pbReverseOrder:
    return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.parent_id==poNode.parent_id).order_by(pbmd.PBNode.node_order.desc()).all()
  else:
    return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.parent_id==poNode.parent_id).order_by(pbmd.PBNode.node_order).all()

def resetNodeOrderOfSiblingNodes(loSiblingNodes):
  liNewWeight = 0
  for loNode in loSiblingNodes:
    liNewWeight = liNewWeight + 1
    loNode.node_order = liNewWeight
  # DBSession.save()

def getNodeFileContent(liNodeId):
  return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.node_id==liNodeId).one().data_file_content


def moveNodeUpper(loNode):
  # FIXME - manage errors and logging
  
  loSiblingNodes = getSiblingNodes(loNode)
  resetNodeOrderOfSiblingNodes(loSiblingNodes)

  loPreviousItem = None
  for loItem in loSiblingNodes:
    if loItem==loNode:
      if loPreviousItem==None:
        # FIXME
        print "No previous node"
      else:
        liPreviousItemOrder       = loPreviousItem.node_order
        loPreviousItem.node_order = loNode.node_order
        loNode.node_order         = liPreviousItemOrder
        # DBSession.save()
        break
    loPreviousItem = loItem

def moveNodeLower(loNode):
  # FIXME - manage errors and logging
  
  loSiblingNodes = getSiblingNodes(loNode)
  resetNodeOrderOfSiblingNodes(loSiblingNodes)

  loPreviousItem = None
  for loItem in reversed(loSiblingNodes):
    if loItem==loNode:
      if loPreviousItem==None:
        # FIXME
        print "No previous node"
      else:
        liPreviousItemOrder       = loPreviousItem.node_order
        loPreviousItem.node_order = loNode.node_order
        loNode.node_order         = liPreviousItemOrder
        # DBSession.save()
        break
    loPreviousItem = loItem

def deleteNode(loNode):
  DBSession.delete(loNode)
  return

def buildTreeListForMenu():
  loNodeList = pbm.DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.node_type==pbmd.PBNodeType.Data).order_by(pbmd.PBNode.parent_tree_path).order_by(pbmd.PBNode.node_order).all()
  loTreeList = []
  loTmpDict = {}
  for loNode in loNodeList:
    loTmpDict[loNode.node_id] = loNode

    if loNode.parent_id==None:
      loTreeList.append(loNode)
    else:
      # append the node to the parent list
      loTmpDict[loNode.parent_id].appendStaticChild(loNode)

  print "=================="
  print loTmpDict[101].getStaticChildList()
  return loTreeList

