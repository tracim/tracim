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

from pboard.model import DeclarativeBase, metadata, DBSession
from pboard.model import data as pbmd

def createNode():
  loNode = pbmd.PBNode()
  DBSession.add(loNode)
  return loNode

def getNode(liNodeId):
  return DBSession.query(pbmd.PBNode).filter(pbmd.PBNode.node_id==liNodeId).one()

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

