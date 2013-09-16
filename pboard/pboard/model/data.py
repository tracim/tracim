# -*- coding: utf-8 -*-
"""

Search activity on the dashboard:
select node_id, node_type, created_at as last_action, data_label, 'new data' as label from pb_nodes where updated_at=created_at
union
select node_id, node_type, updated_at as last_action, data_label, 'updated data' as label from pb_nodes where updated_at>created_at
union
select node_id, node_type, data_datetime as last_action, data_label, 'event' as label from pb_nodes where node_type='event'
order by last_action desc

"""
import os
import re
from datetime import datetime
from hashlib import sha256
__all__ = ['User', 'Group', 'Permission']

from sqlalchemy import Table, ForeignKey, Column, Sequence
from sqlalchemy.types import Unicode, Integer, DateTime, Text
from sqlalchemy.orm import relation, synonym

import tg
from pboard.model import DeclarativeBase, metadata, DBSession

# This is the association table for the many-to-many relationship between
# groups and permissions.
pb_node_table = Table('pb_nodes', metadata,
    Column('node_id', Integer, Sequence('pb_nodes__node_id__sequence'), primary_key=True),
    Column('parent_id', Integer, ForeignKey('pb_nodes.node_id'), nullable=True, default=None),
    Column('node_order', Integer, nullable=True, default=1),
    Column('node_type',   Unicode(16), unique=False, nullable=False, default=u'data'),
    Column('node_status', Unicode(16), unique=False, nullable=False, default=u'new'),

    Column('created_at', DateTime, unique=False, nullable=False),
    Column('updated_at', DateTime, unique=False, nullable=False),

    Column('data_label',   Unicode(1024), unique=False, nullable=False, default=u''),
    Column('data_content', Text(), unique=False, nullable=False, default=u''),
    Column('data_datetime', DateTime, unique=False, nullable=False),
    Column('data_reminder_datetime', DateTime, unique=False, nullable=True),
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
  def __init__(self, psStatusId, psStatusLabel, psStatusFamily, psIconId, psCssClass): #, psBackgroundColor):
    self._sStatusId     = psStatusId
    self._sStatusLabel  = psStatusLabel
    self._sStatusFamily = psStatusFamily
    self._sIconId   = psIconId
    self._sCssClass = psCssClass
    # self._sBackgroundColor = psBackgroundColor
  
  def getLabel(self):
    return self._sStatusLabel
    
  @property
  def status_family(self):
    return self._sStatusFamily
    
  @property
  def icon(self):
    return self._sIconId
    
  def getId(self):
    return self._sStatusId

  @property
  def css(self):
    return self._sCssClass

  @property
  def status_id(self):
    return self._sStatusId
    
  @property
  def icon_id(self):
    return self._sIconId

  @property
  def label(self):
    return self._sStatusLabel

class PBNodeStatus(object):
    
  StatusList = dict()
  StatusList['immortal']   = PBNodeStatusItem('immortal',   'Information', 'normal', 'icon-g-circle-info',            'pod-status-grey-light')
  StatusList['new']        = PBNodeStatusItem('new',        'New',         'open',   'icon-g-lightbulb icon-g-white', 'btn-success')
  StatusList['inprogress'] = PBNodeStatusItem('inprogress', 'In progress', 'open',   ' icon-g-roundabout icon-g-white', 'btn-info')
  StatusList['actiontodo'] = PBNodeStatusItem('actiontodo', 'Waiting for action',       'open',   'icon-g-clock icon-g-white', 'btn-info')
  StatusList['standby']    = PBNodeStatusItem('standby',    'Waiting for answer',  'open',   'icon-g-clock icon-g-white', 'btn-warning')
  StatusList['hot']        = PBNodeStatusItem('hot',        'Hot',         'open',   'icon-g-warning-sign icon-g-white', 'btn-danger')
  StatusList['done']       = PBNodeStatusItem('done',       'Done',        'closed', 'icon-g-ok-2', 'pod-status-grey-light')
  StatusList['closed']     = PBNodeStatusItem('closed',     'Closed',      'closed', 'icon-g-lightbulb', 'pod-status-grey-middle')
  StatusList['archived']   = PBNodeStatusItem('archived',   'Archived',    'invisible', 'icon-g-wallet', 'pod-status-grey-dark')
  StatusList['deleted']    = PBNodeStatusItem('deleted',    'Deleted',     'invisible', 'icon-g-bin',                    'pod-status-grey-dark')

  @classmethod
  def getList(cls):
    return [
      PBNodeStatus.StatusList['immortal'],
      PBNodeStatus.StatusList['new'],
      PBNodeStatus.StatusList['actiontodo'],
      PBNodeStatus.StatusList['inprogress'],
      PBNodeStatus.StatusList['standby'],
      PBNodeStatus.StatusList['hot'],
      PBNodeStatus.StatusList['done'],
      PBNodeStatus.StatusList['closed'],
      PBNodeStatus.StatusList['archived'],
      PBNodeStatus.StatusList['deleted']
    ]
    
    PBNodeStatus.StatusList.values()
    
  @classmethod
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
    return DBSession.query(PBNode).filter(PBNode.parent_id==self.node_id).filter(PBNode.node_type.in_(plNodeTypeList)).order_by(plSortingCriteria).all()
  
  
  def getChildNb(self):
    liChildNb = DBSession.query(PBNode).filter(PBNode.parent_id==self.node_id).filter(PBNode.node_type==PBNodeType.Data).count()
    return liChildNb

  def getChildren(self):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    return self.getChildrenOfType([PBNodeType.Node, PBNodeType.Folder, PBNodeType.Data], PBNode.node_order.asc())

  def getContacts(self):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    return self.getChildrenOfType([PBNodeType.Contact], PBNode.data_label.asc())

  def getEvents(self):
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

  def getTruncatedLabel(self, piCharNb):
    lsTruncatedLabel = u''
    liMaxLength = int(piCharNb)
    if len(self.data_label)>liMaxLength:
      lsTruncatedLabel = self.data_label[0:liMaxLength-1]+u'…'
    else:
      lsTruncatedLabel = self.data_label
    return lsTruncatedLabel

  def getTagList(self):
    loPattern = re.compile('(^|\s|@)@(\w+)')
    loResults = re.findall(loPattern, self.data_content)
    lsResultList = []
    for loResult in loResults:
      lsResultList.append(loResult[1].replace('@', '').replace('_', ' '))
    return lsResultList

  @classmethod
  def addTagReplacement(cls, matchobj):
    return " <span class='badge'>%s</span> " %(matchobj.group(0).replace('@', '').replace('_', ' '))

  @classmethod
  def addDocLinkReplacement(cls, matchobj):
    return " <a href='%s'>%s</a> " %(tg.url('/dashboard?node=%s')%(matchobj.group(1)), matchobj.group(0))

  def getContentWithTags(self):
    lsTemporaryResult = re.sub('(^|\s)@@(\w+)', '', self.data_content) # tags with @@ are explicitly removed from the body
    lsTemporaryResult = re.sub('#([0-9]*)', PBNode.addDocLinkReplacement, lsTemporaryResult) # tags with @@ are explicitly removed from the body
    return re.sub('(^|\s)@(\w+)', PBNode.addTagReplacement, lsTemporaryResult) # then, 'normal tags are transformed as labels'
    # FIXME - D.A. - 2013-09-12
    # Does not match @@ at end of content.



from sqlalchemy.orm import mapper
mapper(PBNode, pb_node_table)

