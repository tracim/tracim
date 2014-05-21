# -*- coding: utf-8 -*-

import os
import re
import datetime as datetimeroot
from datetime import datetime
from hashlib import sha256

import bs4
from sqlalchemy import Table, ForeignKey, Column, Sequence
import sqlalchemy as sqla
from sqlalchemy.sql.sqltypes import Boolean
from sqlalchemy.types import Unicode, Integer, DateTime, Text, LargeBinary
import sqlalchemy.types as sqlat
from sqlalchemy.orm import relation, synonym, relationship
from sqlalchemy.orm import backref
import sqlalchemy.orm as sqlao
import sqlalchemy.orm.query as sqlaoq
from sqlalchemy import orm as sqlao

from tg.i18n import ugettext as _, lazy_ugettext as l_

import tg
from pboard.model import DeclarativeBase, metadata, DBSession
from pboard.model import auth as pma


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
  StatusList['information'] = PBNodeStatusItem('information', 'Information',         'normal', 'fa fa-info-circle',            'pod-status-grey-light')
  StatusList['automatic']   = PBNodeStatusItem('automatic',   'Automatic',           'open',   'fa fa-flash',                  'pod-status-grey-light')
  StatusList['new']         = PBNodeStatusItem('new',         'New',                 'open',   'fa fa-lightbulb-o fa-inverse', 'btn-success')
  StatusList['inprogress']  = PBNodeStatusItem('inprogress',  'In progress',         'open',   'fa fa-gears fa-inverse',       'btn-info')
  StatusList['standby']     = PBNodeStatusItem('standby',     'In standby',          'open',   'fa fa-spinner fa-inverse',     'btn-warning')
  StatusList['done']        = PBNodeStatusItem('done',        'Done',                'closed', 'fa fa-check-square-o',         'pod-status-grey-light')
  StatusList['closed']      = PBNodeStatusItem('closed',      'Closed',              'closed', 'fa fa-lightbulb-o',            'pod-status-grey-middle')
  StatusList['deleted']     = PBNodeStatusItem('deleted',     'Deleted',             'closed', 'fa fa-trash-o',                'pod-status-grey-dark')

  @classmethod
  def getChoosableList(cls):
    return [
      PBNodeStatus.StatusList['information'],
      PBNodeStatus.StatusList['automatic'],
      PBNodeStatus.StatusList['new'],
      PBNodeStatus.StatusList['inprogress'],
      PBNodeStatus.StatusList['standby'],
      PBNodeStatus.StatusList['done'],
      PBNodeStatus.StatusList['closed'],
    ]

  @classmethod
  def getVisibleIdsList(cls):
    return ['information', 'automatic', 'new', 'inprogress', 'standby', 'done' ]

  @classmethod
  def getVisibleList(cls):
    return [
      PBNodeStatus.StatusList['information'],
      PBNodeStatus.StatusList['automatic'],
      PBNodeStatus.StatusList['new'],
      PBNodeStatus.StatusList['inprogress'],
      PBNodeStatus.StatusList['standby'],
      PBNodeStatus.StatusList['done'],
    ]

  @classmethod
  def getList(cls):
    return [
      PBNodeStatus.StatusList['information'],
      PBNodeStatus.StatusList['automatic'],
      PBNodeStatus.StatusList['new'],
      PBNodeStatus.StatusList['inprogress'],
      PBNodeStatus.StatusList['standby'],
      PBNodeStatus.StatusList['done'],
      PBNodeStatus.StatusList['closed'],
      PBNodeStatus.StatusList['deleted']
    ]

    
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


MINIMUM_DATE = datetimeroot.date(datetimeroot.MINYEAR, 1, 1)

class PBNode(DeclarativeBase):

  #def __init__(self):
  #  self._lStaticChildList = []

  @sqlao.reconstructor
  def init_on_load(self):
    self._lStaticChildList = []

  def appendStaticChild(self, loNode):
    print("%s has child %s" % (self.node_id, loNode.node_id))
    self._lStaticChildList.append(loNode)

  def getStaticChildList(self):
    return self._lStaticChildList

  def getStaticChildNb(self):
    return len(self._lStaticChildList)

  __tablename__ = 'pod_nodes'

  node_id          = Column(Integer, Sequence('pod_nodes__node_id__sequence'), primary_key=True)
  parent_id        = Column(Integer, ForeignKey('pod_nodes.node_id'), nullable=True, default=None)
  node_depth       = Column(Integer, unique=False, nullable=False, default=0)
  parent_tree_path = Column(Unicode(255), unique=False, nullable=False, default='')
  owner_id         = Column(Integer, ForeignKey('pod_user.user_id'), nullable=True, default=None)

  node_order   = Column(Integer, nullable=True, default=1)
  node_type    = Column(Unicode(16), unique=False, nullable=False, default='data')
  node_status = Column(Unicode(16), unique=False, nullable=False, default='new')

  created_at = Column(DateTime, unique=False, nullable=False)
  updated_at = Column(DateTime, unique=False, nullable=False)

  """
    if 1, the document is available for other users logged into pod.
    default is 0 (private document)
  """
  is_shared = Column(sqlat.Boolean, unique=False, nullable=False, default=False)
  """
    if 1, the document is available through a public - but obfuscated, url
    default is 0 (document not publicly available)
  """
  is_public = Column(sqlat.Boolean, unique=False, nullable=False, default=False)
  """
    here is the hash allowing to get the document publicly
  """
  public_url_key = Column(Unicode(1024), unique=False, nullable=False, default='')

  data_label   = Column(Unicode(1024), unique=False, nullable=False, default='')
  data_content = Column(Text(),        unique=False, nullable=False, default='')
  
  data_datetime          = Column(DateTime, unique=False, nullable=False)
  data_reminder_datetime = Column(DateTime, unique=False, nullable=True)
  
  data_file_name      = Column(Unicode(255),  unique=False, nullable=False, default='')
  data_file_mime_type = Column(Unicode(255),  unique=False, nullable=False, default='')
  data_file_content   = sqlao.deferred(Column(LargeBinary(), unique=False, nullable=False, default=None))

  _lRights = relationship('Rights', backref='_oNode', cascade = "all, delete-orphan")

  _oParent = relationship('PBNode', remote_side=[node_id], backref='_lAllChildren')
  _oOwner = relationship('User', remote_side=[pma.User.user_id], backref='_lAllNodes')


  def getChildrenOfType(self, plNodeTypeList, poKeySortingMethod=None, pbDoReverseSorting=False):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    llChildren = []
    for child in self._lAllChildren:
      if child.node_type in plNodeTypeList:
        llChildren.append(child)
    if poKeySortingMethod!=None:
      llChildren = sorted(llChildren, key=poKeySortingMethod, reverse=pbDoReverseSorting)
    return llChildren
  
  def getChildNbOfType(self, plNodeTypeList):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    liChildNb = 0
    for child in self._lAllChildren:
      if child.node_type in plNodeTypeList:
        liChildNb = liChildNb+1
    return liChildNb
    # return DBSession.query(PBNode).filter(PBNode.parent_id==self.node_id).filter(PBNode.node_type.in_(plNodeTypeList)).order_by(plSortingCriteria).all()
  
  def getChildNb(self):
    return self.getChildNbOfType([PBNodeType.Data])

  def getGroupsWithSomeAccess(self):
    llRights = []
    for loRight in self._lRights:
      if loRight.rights>0:
        llRights.append(loRight)
    return llRights

  def getChildren(self, pbIncludeDeleted=False):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    # return self.getChildrenOfType([PBNodeType.Node, PBNodeType.Folder, PBNodeType.Data])
    items = self.getChildrenOfType([PBNodeType.Node, PBNodeType.Folder, PBNodeType.Data])
    items2 = list()
    for item in items:
      if pbIncludeDeleted==True or item.node_status!='deleted':
        items2.append(item)
    return items2

  def getContacts(self):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    return self.getChildrenOfType([PBNodeType.Contact], PBNode.getSortingKeyForContact)

  def getContactNb(self):
    """return all children nodes of type 'data' or 'node' or 'folder'"""
    return self.getChildNbOfType([PBNodeType.Contact])

  @classmethod
  def getSortingKeyBasedOnDataDatetime(cls, poDataNode):
    return poDataNode.data_datetime or MINIMUM_DATE
    
  @classmethod
  def getSortingKeyForContact(cls, poDataNode):
    return poDataNode.data_label or ''

  @classmethod
  def getSortingKeyForComment(cls, poDataNode):
    return poDataNode.data_datetime or ''

  def getEvents(self):
    return self.getChildrenOfType([PBNodeType.Event], PBNode.getSortingKeyBasedOnDataDatetime, True)
    
  def getFiles(self):
    return self.getChildrenOfType([PBNodeType.File])

  def getComments(self):
    return self.getChildrenOfType([PBNodeType.Comment], PBNode.getSortingKeyBasedOnDataDatetime, True)

  def getIconClass(self):
    if self.node_type==PBNodeType.Data and self.getStaticChildNb()>0:
      return PBNode.getIconClassForNodeType('folder')
    else:
      return PBNode.getIconClassForNodeType(self.node_type)

  def getBreadCrumbNodes(self):
    loNodes = []
    if self._oParent!=None:
      loNodes = self._oParent.getBreadCrumbNodes()
      loNodes.append(self._oParent)
    return loNodes

  def getContentWithHighlightedKeywords(self, plKeywords, psPlainText):
    if len(plKeywords)<=0:
      return psPlainText

    lsPlainText = psPlainText

    for lsKeyword in plKeywords:
      lsPlainText = re.sub('(?i)(%s)' % lsKeyword, '<strong>\\1</strong>', lsPlainText)

    return lsPlainText


  @classmethod
  def getIconClassForNodeType(cls, psIconType):
    laIconClass = dict()
    laIconClass['node']   = 'fa fa-folder-open'
    laIconClass['folder'] = 'fa fa-folder-open'
    laIconClass['data']   = 'fa fa-file-text-o'

    laIconClass['file']   = 'fa fa-paperclip'
    laIconClass['event']  = 'fa fa-calendar'
    laIconClass['contact'] = 'fa fa-user'
    laIconClass['comment'] = 'fa fa-comments-o'
    return laIconClass[psIconType]


  def getUserFriendlyNodeType(self):
    laNodeTypesLng = dict()
    laNodeTypesLng['node']   = 'Document' # FIXME - D.A. - 2013-11-14 - Make text translatable
    laNodeTypesLng['folder'] = 'Document'
    laNodeTypesLng['data']   = 'Document'

    laNodeTypesLng['file']   = 'File'
    laNodeTypesLng['event']  = 'Event'
    laNodeTypesLng['contact'] = 'Contact'
    laNodeTypesLng['comment'] = 'Comment'

    if self.node_type==PBNodeType.Data and self.getStaticChildNb()>0:
      return laNodeTypesLng['folder']
    else:
      return laNodeTypesLng[self.node_type]

    
  def getFormattedDateTime(self, poDateTime, psDateTimeFormat = '%d/%m/%Y ~ %H:%M'):
    return poDateTime.strftime(psDateTimeFormat)

  def getFormattedDate(self, poDateTime, psDateTimeFormat = '%d/%m/%Y'):
    return poDateTime.strftime(psDateTimeFormat)

  def getFormattedTime(self, poDateTime, psDateTimeFormat = '%H:%M'):
    return poDateTime.strftime(psDateTimeFormat)

  def getStatus(self) -> PBNodeStatusItem:
    loStatus = PBNodeStatus.getStatusItem(self.node_status)
    if loStatus.status_id!='automatic':
      return loStatus
    else:
      # Compute the status:
      # - if at least one child is 'new' or 'in progress' or 'in standby' => status is inprogress
      # - else if all status are 'done', 'closed' or 'deleted' => 'done'
      lsRealStatusId = 'done'
      for loChild in self.getChildren():
        if loChild.getStatus().status_id in ('new', 'inprogress', 'standby'):
          lsRealStatusId = 'inprogress'
          break
      return PBNodeStatus.getStatusItem(lsRealStatusId)

  def getTruncatedLabel(self, piCharNb: int):
    """
    return a truncated version of the data_label property.
    if piCharNb is not > 0, then the full data_label is returned
    note: if the node is a file and the data_label is empty, the file name is returned
    """
    lsTruncatedLabel = self.data_label

    # 2014-05-06 - D.A. - HACK
    # if the node is a file and label empty, then use the filename as data_label
    if self.node_type==PBNodeType.File and lsTruncatedLabel=='':
      lsTruncatedLabel = self.data_file_name

    liMaxLength = int(piCharNb)
    if liMaxLength>0 and len(lsTruncatedLabel)>liMaxLength:
      lsTruncatedLabel = lsTruncatedLabel[0:liMaxLength-1]+'…'

    return lsTruncatedLabel

  def getTruncatedContentAsText(self, piCharNb):
    lsPlainText = ''.join(bs4.BeautifulSoup(self.data_content).findAll(text=True))
    lsTruncatedContent = ''

    liMaxLength = int(piCharNb)
    if len(lsPlainText)>liMaxLength:
      lsTruncatedContent = lsPlainText[0:liMaxLength-1]+'…'
    else:
      lsTruncatedContent = lsPlainText
    return lsTruncatedContent

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
  
  def getHistory(self):
      return DBSession.execute("select node_id, version_id, created_at from pod_nodes_history where node_id = :node_id order by created_at desc", {"node_id":self.node_id}).fetchall()


#####
#
# HACK - 2014-05-21 - D.A
#
# The following hack is a horrible piece of code that allow to map a raw SQL select to a mapped class
#
class DIRTY_GroupRightsOnNode(object):
    def hasSomeAccess(self):
        return self.rights >= pma.Rights.READ_ACCESS

    def hasReadAccess(self):
        return self.rights & pma.Rights.READ_ACCESS

    def hasWriteAccess(self):
        return self.rights & pma.Rights.WRITE_ACCESS

DIRTY_group_rights_on_node_query = Table('fake_table', metadata,
    Column('group_id', Integer, primary_key=True),
    Column('node_id', Integer, primary_key=True),

    Column('display_name', Unicode(255)),
    Column('personnal_group', Boolean),
    Column('rights', Integer, primary_key=True)
)

DIRTY_UserDedicatedGroupRightOnNodeSqlQuery = """
SELECT
    COALESCE(NULLIF(pg.display_name, ''), pu.display_name) AS display_name,
    pg.personnal_group,
    pg.group_id,
    :node_id AS node_id,
    COALESCE(pgn.rights, 0) AS rights
FROM
    pod_group AS pg
    LEFT JOIN
        pod_group_node AS pgn
    ON
        pg.group_id=pgn.group_id
        AND pgn.node_id=:node_id
    LEFT JOIN
        pod_user AS pu
    ON
        pu.user_id=-pg.group_id
WHERE
    pg.personnal_group='t'
ORDER BY
    display_name
;"""

DIRTY_RealGroupRightOnNodeSqlQuery = """
SELECT
    pg.display_name AS display_name,
    pg.personnal_group,
    pg.group_id,
    :node_id AS node_id,
    COALESCE(pgn.rights, 0) AS rights
FROM
    pod_group AS pg
    LEFT JOIN
        pod_group_node AS pgn
    ON
        pg.group_id=pgn.group_id
        AND pgn.node_id=:node_id
WHERE
    pg.personnal_group!='t'
ORDER BY
    display_name
;"""

sqlao.mapper(DIRTY_GroupRightsOnNode, DIRTY_group_rights_on_node_query)

