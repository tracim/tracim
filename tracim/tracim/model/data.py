# -*- coding: utf-8 -*-

from bs4 import BeautifulSoup

import json
import re
import datetime as datetimeroot
from datetime import datetime
from hashlib import sha256

from sqlalchemy import Table, ForeignKey, Column, Sequence
import sqlalchemy as sqla
from sqlalchemy.sql.sqltypes import Boolean
from sqlalchemy.types import Unicode, Integer, DateTime, Text, LargeBinary
import sqlalchemy.types as sqlat
from sqlalchemy.ext.orderinglist import ordering_list
from sqlalchemy.orm import relation, synonym, relationship
from sqlalchemy.orm import backref
import sqlalchemy.orm as sqlao
import sqlalchemy.orm.query as sqlaoq
from sqlalchemy import orm as sqlao
from sqlalchemy.ext.hybrid import hybrid_property

from tg.i18n import ugettext as _, lazy_ugettext as l_

import tg
from tracim.model import DeclarativeBase, metadata, DBSession
# from tracim.model import auth as pma

from tracim.model.auth import User
from tracim.model.auth import Rights
from tracim.model.auth import user_group_table

from tracim.lib.base import current_user

class BreadcrumbItem(object):

    def __init__(self, icon_string: str, label: str, url: str, is_active: bool = False):
        """
            A BreadcrumbItem contains minimal information required to build a breadcrumb
            icon_string: this is the Tango related id, eg 'places/remote-folder'
        """
        self.icon = icon_string
        self.label = label
        self.url = url
        self.is_active =is_active

class Workspace(DeclarativeBase):

    __tablename__ = 'pod_workspaces'

    workspace_id = Column(Integer, Sequence('pod_workspaces__workspace_id__sequence'), primary_key=True)

    data_label   = Column(Unicode(1024), unique=False, nullable=False, default='')
    data_comment = Column(Text(),        unique=False, nullable=False, default='')

    created_at = Column(DateTime, unique=False, nullable=False)
    updated_at = Column(DateTime, unique=False, nullable=False)

    is_deleted = Column(sqlat.Boolean, unique=False, nullable=False, default=False)

    def get_user_role(self, user: User) -> int:
        for role in user.roles:
            if role.workspace.workspace_id==self.workspace_id:
                return role.role
        return UserRoleInWorkspace.NOT_APPLICABLE



class UserRoleInWorkspace(DeclarativeBase):

    __tablename__ = 'pod_user_workspace'

    user_id = Column(Integer, ForeignKey('pod_user.user_id'), nullable=False, default=None, primary_key=True)
    workspace_id = Column(Integer, ForeignKey('pod_workspaces.workspace_id'), nullable=False, default=None, primary_key=True)
    role = Column(Integer, nullable=False, default=0, primary_key=False)

    workspace = relationship('Workspace', remote_side=[Workspace.workspace_id], backref='roles', lazy='joined')
    user = relationship('User', remote_side=[User.user_id], backref='roles')

    NOT_APPLICABLE = 0
    READER = 1
    CONTRIBUTOR = 2
    CONTENT_MANAGER = 4
    WORKSPACE_MANAGER = 8

    LABEL = dict()
    LABEL[0] = l_('N/A')
    LABEL[1] = l_('Reader')
    LABEL[2] = l_('Contributor')
    LABEL[4] = l_('Content Manager')
    LABEL[8] = l_('Workspace Manager')

    STYLE = dict()
    STYLE[0] = ''
    STYLE[1] = 'color: #1fdb11;'
    STYLE[2] = 'color: #759ac5;'
    STYLE[4] = 'color: #ea983d;'
    STYLE[8] = 'color: #F00;'


    @property
    def style(self):
        return UserRoleInWorkspace.STYLE[self.role]

    def role_as_label(self):
        return UserRoleInWorkspace.LABEL[self.role]

    @classmethod
    def get_all_role_values(self):
        return [
            UserRoleInWorkspace.READER,
            UserRoleInWorkspace.CONTRIBUTOR,
            UserRoleInWorkspace.CONTENT_MANAGER,
            UserRoleInWorkspace.WORKSPACE_MANAGER
        ]

class RoleType(object):
    def __init__(self, role_id):
        self.role_type_id = role_id
        self.role_label = UserRoleInWorkspace.LABEL[role_id]
        self.css_style = UserRoleInWorkspace.STYLE[role_id]


class LinkItem(object):
    def __init__(self, href, label):
        self.href = href
        self.label = label

class ActionDescription(object):
    """
    Allowed status are:
    - open
    - closed-validated
    - closed-invalidated
    - closed-deprecated
    """

    ARCHIVING = 'archiving'
    COMMENT = 'content-comment'
    CREATION = 'creation'
    DELETION = 'deletion'
    EDITION = 'edition' # Default action if unknow
    REVISION = 'revision'
    STATUS_UPDATE = 'status-update'
    UNARCHIVING = 'unarchiving'
    UNDELETION = 'undeletion'

    _ICONS = {
        'archiving': 'mimetypes/package-x-generic',
        'content-comment': 'apps/internet-group-chat',
        'creation': 'apps/accessories-text-editor',
        'deletion': 'status/user-trash-full',
        'edition': 'apps/accessories-text-editor',
        'revision': 'apps/accessories-text-editor',
        'status-update': 'apps/utilities-system-monitor',
        'unarchiving': 'mimetypes/package-x-generic',
        'undeletion': 'places/user-trash'
    }

    _LABELS = {
        'archiving': l_('Item archived'),
        'content-comment': l_('Item commented'),
        'creation': l_('Item created'),
        'deletion': l_('Item deleted'),
        'edition': l_('Item modified'),
        'revision': l_('New revision'),
        'status-update': l_('Status modified'),
        'unarchiving': l_('Item un-archived'),
        'undeletion': l_('Item undeleted'),
    }


    def __init__(self, id):
        assert id in ActionDescription.allowed_values()
        self.id = id
        self.label = ''
        self.icon = ActionDescription._ICONS[id]

    @classmethod
    def allowed_values(cls):
        return [cls.ARCHIVING,
                cls.COMMENT,
                cls.CREATION,
                cls.DELETION,
                cls.EDITION,
                cls.REVISION,
                cls.STATUS_UPDATE,
                cls.UNARCHIVING,
                cls.UNDELETION]


class ContentStatus(object):
    """
    Allowed status are:
    - open
    - closed-validated
    - closed-invalidated
    - closed-deprecated
    """

    OPEN = 'open'
    CLOSED_VALIDATED = 'closed-validated'
    CLOSED_UNVALIDATED = 'closed-unvalidated'
    CLOSED_DEPRECATED = 'closed-deprecated'

    _LABELS = {'open': l_('work in progress'),
               'closed-validated': l_('closed — validated'),
               'closed-unvalidated': l_('closed — cancelled'),
               'closed-deprecated': l_('deprecated')}

    _LABELS_THREAD = {'open': l_('subject in progress'),
                      'closed-validated': l_('subject closed — resolved'),
                      'closed-unvalidated': l_('subject closed — cancelled'),
                      'closed-deprecated': l_('deprecated')}

    _LABELS_FILE = {'open': l_('work in progress'),
                    'closed-validated': l_('closed — validated'),
                    'closed-unvalidated': l_('closed — cancelled'),
                    'closed-deprecated': l_('deprecated')}

    _ICONS = {
        'open': 'status/status-open',
        'closed-validated': 'emblems/emblem-checked',
        'closed-unvalidated': 'emblems/emblem-unreadable',
        'closed-deprecated': 'status/status-outdated',
    }

    _CSS = {
        'open': 'tracim-status-open',
        'closed-validated': 'tracim-status-closed-validated',
        'closed-unvalidated': 'tracim-status-closed-unvalidated',
        'closed-deprecated': 'tracim-status-closed-deprecated',
    }

    def __init__(self, id, node_type=''):
        self.id = id
        print('ID', id)
        self.icon = ContentStatus._ICONS[id]
        self.css = ContentStatus._CSS[id]

        if node_type==PBNodeType.Thread:
            self.label = ContentStatus._LABELS_THREAD[id]
        elif node_type==PBNodeType.File:
            self.label = ContentStatus._LABELS_FILE[id]
        else:
            self.label = ContentStatus._LABELS[id]


    @classmethod
    def all(cls, node_type='') -> ['ContentStatus']:
        all = []
        all.append(ContentStatus('open', node_type))
        all.append(ContentStatus('closed-validated', node_type))
        all.append(ContentStatus('closed-unvalidated', node_type))
        all.append(ContentStatus('closed-deprecated', node_type))
        return all

    @classmethod
    def allowed_values(cls):
        return ContentStatus._LABELS.keys()

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
  StatusList['information'] = PBNodeStatusItem('information', 'Information',         'normal', 'fa fa-info-circle',            'tracim-status-grey-light')
  StatusList['automatic']   = PBNodeStatusItem('automatic',   'Automatic',           'open',   'fa fa-flash',                  'tracim-status-grey-light')
  StatusList['new']         = PBNodeStatusItem('new',         'New',                 'open',   'fa fa-lightbulb-o fa-inverse', 'btn-success')
  StatusList['inprogress']  = PBNodeStatusItem('inprogress',  'In progress',         'open',   'fa fa-gears fa-inverse',       'btn-info')
  StatusList['standby']     = PBNodeStatusItem('standby',     'In standby',          'open',   'fa fa-spinner fa-inverse',     'btn-warning')
  StatusList['done']        = PBNodeStatusItem('done',        'Done',                'closed', 'fa fa-check-square-o',         'tracim-status-grey-light')
  StatusList['closed']      = PBNodeStatusItem('closed',      'Closed',              'closed', 'fa fa-lightbulb-o',            'tracim-status-grey-middle')
  StatusList['deleted']     = PBNodeStatusItem('deleted',     'Deleted',             'closed', 'fa fa-trash-o',                'tracim-status-grey-dark')

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
    Any = 'any'

    Folder  = 'folder'
    File    = 'file'
    Comment = 'comment'
    Thread = 'thread'
    Page = 'page'

    # Obsolete ones - to be removed
    Node    = 'node'
    Data    = 'data'
    Event   = 'event'
    Contact = 'contact'

    # Fake types, used for breadcrumb only
    FAKE_Dashboard = 'dashboard'
    FAKE_Workspace = 'workspace'

    _STRING_LIST_SEPARATOR = ','

    _ICONS = {
        'dashboard': 'places/user-desktop',
        'workspace': 'places/folder-remote',
        'folder': 'places/jstree-folder',
        'file': 'mimetypes/text-x-generic-template',
        'page': 'mimetypes/text-html',
        'thread': 'apps/internet-group-chat',
        'comment': 'apps/internet-group-chat',
    }

    @classmethod
    def icon(cls, type: str):
        assert(type in PBNodeType._ICONS) # DYN_REMOVE
        return PBNodeType._ICONS[type]

    @classmethod
    def allowed_types(cls):
        return [cls.Folder, cls.File, cls.Comment, cls.Thread, cls.Page]

    @classmethod
    def allowed_types_from_str(cls, allowed_types_as_string: str):
        allowed_types = []
        # HACK - THIS
        for item in allowed_types_as_string.split(PBNodeType._STRING_LIST_SEPARATOR):
            if item and item in PBNodeType.allowed_types():
                allowed_types.append(item)
        return allowed_types

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

    revision_to_serialize = -0  # This flag allow to serialize a given revision if required by the user

    node_id          = Column(Integer, Sequence('pod_nodes__node_id__sequence'), primary_key=True)
    parent_id        = Column(Integer, ForeignKey('pod_nodes.node_id'), nullable=True, default=None)
    node_depth       = Column(Integer, unique=False, nullable=False, default=0)
    parent_tree_path = Column(Unicode(255), unique=False, nullable=False, default='')
    owner_id         = Column(Integer, ForeignKey('pod_user.user_id'), nullable=True, default=None)

    node_order   = Column(Integer, nullable=True, default=1)
    node_type    = Column(Unicode(32), unique=False, nullable=False)
    node_status = Column(Unicode(32), unique=False, nullable=False, default=ContentStatus.OPEN)

    created_at = Column(DateTime, unique=False, nullable=False)
    updated_at = Column(DateTime, unique=False, nullable=False)

    workspace_id = Column(Integer, ForeignKey('pod_workspaces.workspace_id'), unique=False, nullable=True)

    workspace = relationship('Workspace', remote_side=[Workspace.workspace_id], backref='contents')


    is_deleted = Column(sqlat.Boolean, unique=False, nullable=False, default=False)
    is_archived = Column(sqlat.Boolean, unique=False, nullable=False, default=False)

    is_shared = Column(sqlat.Boolean, unique=False, nullable=False, default=False)
    is_public = Column(sqlat.Boolean, unique=False, nullable=False, default=False)
    public_url_key = Column(Unicode(1024), unique=False, nullable=False, default='')

    data_label = Column(Unicode(1024), unique=False, nullable=False, default='')
    data_content = Column(Text(), unique=False, nullable=False, default='')
    _properties = Column('properties', Text(), unique=False, nullable=False, default='')

    data_datetime = Column(DateTime, unique=False, nullable=False)
    data_reminder_datetime = Column(DateTime, unique=False, nullable=True)

    data_file_name = Column(Unicode(255),  unique=False, nullable=False, default='')
    data_file_mime_type = Column(Unicode(255),  unique=False, nullable=False, default='')
    data_file_content = sqlao.deferred(Column(LargeBinary(), unique=False, nullable=False, default=None))

    last_action = Column(Unicode(32), unique=False, nullable=False, default='')

    _lRights = relationship('Rights', backref='_oNode', cascade = "all, delete-orphan")

    parent = relationship('PBNode', remote_side=[node_id], backref='children')
    owner = relationship('User', remote_side=[User.user_id], backref='_lAllNodes')

    @hybrid_property
    def _lAllChildren(self):
        # for backward compatibility method
        return self.children

    @property
    def _oOwner(self):
        # for backward compatibility method
        return self.owner

    @property
    def _oParent(self):
        # for backward compatibility method
        return self.parent

    @hybrid_property
    def properties(self):
        """ return a structure decoded from json content of _properties """
        if not self._properties:
            ContentChecker.reset_properties(self)
        return json.loads(self._properties)

    @properties.setter
    def properties(self, properties_struct):
        """ encode a given structure into json and store it in _properties attribute"""
        self._properties = json.dumps(properties_struct)
        ContentChecker.check_properties(self)

    def extract_links_from_content(self, other_content: str=None) -> [LinkItem]:
        """
        parse html content and extract links. By default, it works on the data_content property
        :param other_content: if not empty, then parse the given html content instead of data_content
        :return: a list of LinkItem
        """
        links = []
        soup = BeautifulSoup(self.data_content if not other_content else other_content)
        for link in soup.findAll('a'):
            href = link.get('href')
            print(href)
            label = link.contents
            links.append(LinkItem(href, label))
        links.sort(key=lambda link: link.href if link.href else '')

        sorted_links = sorted(links, key=lambda link: link.label if link.label else link.href, reverse=True)
        ## FIXME - Does this return a sorted list ???!
        return sorted_links


    def getChildrenOfType(self, plNodeTypeList, poKeySortingMethod=None, pbDoReverseSorting=False):
        """return all children nodes of type 'data' or 'node' or 'folder'"""
        llChildren = []
        user_id = current_user().user_id
        llChildren = DBSession.query(PBNode).outerjoin(Rights)\
                .outerjoin(user_group_table, Rights.group_id==user_group_table.columns['group_id'])\
                .filter(PBNode.parent_id==self.node_id)\
                .filter((PBNode.owner_id==user_id) | ((user_group_table.c.user_id==user_id) & (PBNode.is_shared == True)))\
                .filter(PBNode.node_type.in_(plNodeTypeList))\
                .all()
        if poKeySortingMethod!=None:
          llChildren = sorted(llChildren, key=poKeySortingMethod, reverse=pbDoReverseSorting)
        return llChildren

    def get_child_nb(self, content_type: PBNodeType, content_status = ''):
        # V2 method - to keep
        child_nb = 0
        for child in self._lAllChildren:
            if child.node_type==content_type:
                if not content_status:
                    child_nb = child_nb+1
                elif content_status==child.node_status:
                    child_nb = child_nb+1
        return child_nb

    def get_status(self) -> ContentStatus:
        return ContentStatus(self.node_status, self.node_type.__str__())

    def get_last_action(self) -> ActionDescription:
        return ActionDescription(self.last_action)

    def get_comments(self):
        children = []
        for child in self.children:
            if child.node_type==PBNodeType.Comment:
                children.append(child)
        return children





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

    def getIconClass(self):
        if self.node_type==PBNodeType.Data and self.getStaticChildNb()>0:
            return PBNode.getIconClassForNodeType('folder')
        else:
            return PBNode.getIconClassForNodeType(self.node_type)

    def getBreadCrumbNodes(self) -> list('PBNode'):
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

        # default case
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

        if lsTruncatedLabel=='':
            lsTruncatedLabel = _('Titleless Document')

        return lsTruncatedLabel

    def getTruncatedContentAsText(self, piCharNb):
        lsPlainText = ''.join(BeautifulSoup(self.data_content).findAll(text=True))
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


class ContentChecker(object):

    @classmethod
    def check_properties(cls, item: PBNode):
        if item.node_type==PBNodeType.Folder:
            properties = item.properties
            if 'allowed_content' not in properties.keys():
                return False
            if 'folders' not in properties['allowed_content']:
                return False
            if 'files' not in properties['allowed_content']:
                return False
            if 'pages' not in properties['allowed_content']:
                return False
            if 'threads' not in properties['allowed_content']:
                return False

            return True

        raise NotImplementedError

    @classmethod
    def reset_properties(cls, item: PBNode):
        if item.node_type==PBNodeType.Folder:
            item.properties = dict(
                allowed_content = dict (
                    folder = True,
                    file = True,
                    page = True,
                    thread = True
                )
            )
            return

        print('NODE TYPE', item.node_type)
        raise NotImplementedError

class ContentRevisionRO(DeclarativeBase):

    __tablename__ = 'pod_nodes_history'

    version_id = Column(Integer, primary_key=True)
    node_id = Column(Integer, ForeignKey('pod_nodes.node_id'))
    # parent_id = Column(Integer, ForeignKey('pod_nodes.node_id'), nullable=True)
    owner_id = Column(Integer, ForeignKey('pod_user.user_id'), nullable=True)
    data_label = Column(Unicode(1024), unique=False, nullable=False)
    data_content = Column(Text(), unique=False, nullable=False, default='')
    data_file_name = Column(Unicode(255),  unique=False, nullable=False, default='')
    data_file_mime_type = Column(Unicode(255),  unique=False, nullable=False, default='')
    data_file_content = sqlao.deferred(Column(LargeBinary(), unique=False, nullable=False, default=None))

    node_status = Column(Unicode(32), unique=False, nullable=False)
    created_at = Column(DateTime, unique=False, nullable=False)
    updated_at = Column(DateTime, unique=False, nullable=False)
    is_deleted = Column(sqlat.Boolean, unique=False, nullable=False)
    is_archived = Column(sqlat.Boolean, unique=False, nullable=False)
    last_action = Column(Unicode(32), unique=False, nullable=False, default='')

    workspace_id = Column(Integer, ForeignKey('pod_workspaces.workspace_id'), unique=False, nullable=True)
    workspace = relationship('Workspace', remote_side=[Workspace.workspace_id])

    node = relationship('PBNode', remote_side=[PBNode.node_id], backref='revisions')
    owner = relationship('User', remote_side=[User.user_id])
    # parent = relationship('PBNode', remote_side=[PBNode.node_id])

    def get_status(self):
        return ContentStatus(self.node_status)

    def get_last_action(self) -> ActionDescription:
        return ActionDescription(self.last_action)


class NodeTreeItem(object):
    """
        This class implements a model that allow to simply represents the left-panel menu items
         This model is used by dbapi but is not directly related to sqlalchemy and database
    """
    def __init__(self, node: PBNode, children: list('NodeTreeItem'), is_selected = False):
        self.node = node
        self.children = children
        self.is_selected = is_selected




#####
#
# HACK - 2014-05-21 - D.A
#
# The following hack is a horrible piece of code that allow to map a raw SQL select to a mapped class
#
class DIRTY_GroupRightsOnNode(object):
    def hasSomeAccess(self):
        return self.rights >= Rights.READ_ACCESS

    def hasReadAccess(self):
        return self.rights & Rights.READ_ACCESS

    def hasWriteAccess(self):
        return self.rights & Rights.WRITE_ACCESS

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

