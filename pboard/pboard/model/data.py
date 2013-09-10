# -*- coding: utf-8 -*-
"""
"""
import os
from datetime import datetime
from hashlib import sha256
__all__ = ['User', 'Group', 'Permission']

from sqlalchemy import Table, ForeignKey, Column, Sequence
from sqlalchemy.types import Unicode, Integer, DateTime, Text
from sqlalchemy.orm import relation, synonym

from pboard.model import DeclarativeBase, metadata, DBSession

# This is the association table for the many-to-many relationship between
# groups and permissions.
pb_node_table = Table('pb_nodes', metadata,
    Column('node_id', Integer, Sequence('pb_nodes__node_id__sequence'), primary_key=True),
    Column('parent_id', Integer, ForeignKey('pb_nodes.node_id'), nullable=True, default=None),
    Column('node_order', Integer, nullable=True, default=1),
    Column('node_type',   Unicode(16), unique=False, nullable=False, default=u'data'),
    Column('node_status', Unicode(16), unique=False, nullable=False, default=u'open'),

    Column('created_at', DateTime, unique=False, nullable=False),
    Column('updated_at', DateTime, unique=False, nullable=False),

    Column('data_label',   Unicode(1024), unique=False, nullable=False, default=u''),
    Column('data_content', Text(), unique=False, nullable=False, default=u''),
    Column('data_datetime', DateTime, unique=False, nullable=False),
)
"""
- node_type

- node_created_at
- node_updated_at

- data_label
- data_content
- data_source_url
- data_status_id
"""

class PBNodeStatusItem(object):
  def __init__(self, psStatusId, psStatusLabel, psStatusFamily, psForegroundColor): #, psBackgroundColor):
    self._sStatusId     = psStatusId
    self._sStatusLabel  = psStatusLabel
    self._sStatusFamily = psStatusFamily
    self._sForegroundColor = psForegroundColor
    # self._sBackgroundColor = psBackgroundColor
  
  @property
  def label(self):
    return self._sStatusLabel
    
  def getId(self):
    return self._sStatusId


class PBNodeStatus(object):
    
  StatusList = dict()
  StatusList['immortal'] = PBNodeStatusItem('immortal',  'Information', 'normal', 'rgb(51,51,51)')
  StatusList['open']     = PBNodeStatusItem('open',      'Open',        'normal', 'rgb(91,183,91)')
  StatusList['standby']  = PBNodeStatusItem('standby',   'in Standby',  'normal', 'rgb(250, 167, 50)')
  StatusList['hot']      = PBNodeStatusItem('hot',       'Hot',         'normal', 'rgb(218, 79, 73)')
  StatusList['done']     = PBNodeStatusItem('done',      'Done',        'closed', 'rgb(51, 51, 51)')
  StatusList['closed']   = PBNodeStatusItem('closed',    'Closed',      'closed', 'rgb(51, 51, 51)')
  StatusList['archived'] = PBNodeStatusItem('archived',  'Archived',    'invisible', 'rgb(51, 51, 51)')
  StatusList['deleted']  = PBNodeStatusItem('deleted',   'Deleted',     'invisible', 'rgb(51, 51, 51)')

  @classmethod
  def getList(cls):
    return PBNodeStatus.StatusList.iteritems()
    
  def getStatusItem(cls, psStatusId):
    return PBNodeStatus.StatusList[psStatusId]

class PBNodeType(object):
  Node    = 'node'
  Folder  = 'folder'
  Data    = 'data'
  File    = 'file'
  Event   = 'event'
  Contact = 'contact'
  Comment = 'comment'


class PBNode(object):

  def getChildrenOfType(self, plNodeTypeList, plSortingCriteria):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    print "NODE = ", self.node_id
    print "######"
    print plNodeTypeList
    print "######"
    print "######"
    
    return DBSession.query(PBNode).filter(PBNode.parent_id==self.node_id).filter(PBNode.node_type.in_(plNodeTypeList)).order_by(plSortingCriteria).all()
  
  
  def getChildNb(self):
    liChildNb = DBSession.query(PBNode).filter(PBNode.parent_id==self.node_id).filter(PBNode.node_type==PBNodeType.Data).count()
    print "CHILDREN of ", self.node_id, " are ", liChildNb
    return liChildNb

  def getChildren(self):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    return self.getChildrenOfType([PBNodeType.Node, PBNodeType.Folder, PBNodeType.Data], PBNode.node_order.asc())

  def getContacts(self):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    return self.getChildrenOfType([PBNodeType.Contact], PBNode.data_label.asc())

  def getEvents(self):
    """print "---------------------------"
    print self.getChildrenOfType((PBNodeType.Event,), PBNode.data_datetime.desc())
    print "---------------------------"
    print "---------------------------"
    return self.getChildrenOfType((PBNodeType.Event,), PBNode.data_datetime.desc())
    """
    return DBSession.query(PBNode).filter(PBNode.parent_id==self.node_id).filter(PBNode.node_type==PBNodeType.Event).order_by(PBNode.data_datetime.desc()).all()
    return []
    
  def getIconClass(self):
    laIconClass = dict()
    laIconClass['node']   = 'icon-g-folder-open'
    laIconClass['folder'] = 'icon-g-folder-open'
    laIconClass['data']   = 'icon-g-file'

    laIconClass['file']   = 'icon-file'
    laIconClass['event']  = 'icon-time' # icon-calendar
    laIconClass['contact'] = 'icon-user'
    laIconClass['comment'] = 'icon-comment'

    if self.node_type==PBNodeType.Data and self.getChildNb()>0:
      return laIconClass['folder']
    else:
      return laIconClass[self.node_type]
      
      
  def getFormattedDateTime(self, poDateTime, psDateTimeFormat = '%d/%m/%Y @ %H:%M'):
    return poDateTime.strftime(psDateTimeFormat)

  def getFormattedDate(self, poDateTime, psDateTimeFormat = '%d/%m/%Y'):
    return poDateTime.strftime(psDateTimeFormat)

  def getFormattedTime(self, poDateTime, psDateTimeFormat = '%H:%M'):
    return poDateTime.strftime(psDateTimeFormat)

  def getStatus(self):
    return PBNodeStatus.getStatusItem(self.node_status)

from sqlalchemy.orm import mapper
mapper(PBNode, pb_node_table)

