# -*- coding: utf-8 -*-

from bs4 import BeautifulSoup
import datetime as datetime_root
import json

from sqlalchemy import Column
from sqlalchemy import ForeignKey

from sqlalchemy.ext.hybrid import hybrid_property

from sqlalchemy.orm import relationship
from sqlalchemy.orm import deferred

from sqlalchemy.types import Boolean
from sqlalchemy.types import DateTime
from sqlalchemy.types import Integer
from sqlalchemy.types import LargeBinary
from sqlalchemy.types import Text
from sqlalchemy.types import Unicode

from tg.i18n import lazy_ugettext as l_

from tracim.model import DeclarativeBase
from tracim.model.auth import User

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

    __tablename__ = 'workspaces'

    workspace_id = Column(Integer, autoincrement=True, primary_key=True)

    label   = Column(Unicode(1024), unique=False, nullable=False, default='')
    description = Column(Text(), unique=False, nullable=False, default='')

    created = Column(DateTime, unique=False, nullable=False)
    updated = Column(DateTime, unique=False, nullable=False)

    is_deleted = Column(Boolean, unique=False, nullable=False, default=False)

    def get_user_role(self, user: User) -> int:
        for role in user.roles:
            if role.workspace.workspace_id==self.workspace_id:
                return role.role
        return UserRoleInWorkspace.NOT_APPLICABLE



class UserRoleInWorkspace(DeclarativeBase):

    __tablename__ = 'user_workspace'

    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False, default=None, primary_key=True)
    workspace_id = Column(Integer, ForeignKey('workspaces.workspace_id'), nullable=False, default=None, primary_key=True)
    role = Column(Integer, nullable=False, default=0, primary_key=False)
    do_notify = Column(Boolean, unique=False, nullable=False, default=False)

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
        'creation': 'actions/document-new',
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
        self.label = ActionDescription._LABELS[id]
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

    def __init__(self, id, type=''):
        self.id = id
        self.icon = ContentStatus._ICONS[id]
        self.css = ContentStatus._CSS[id]

        if type==ContentType.Thread:
            self.label = ContentStatus._LABELS_THREAD[id]
        elif type==ContentType.File:
            self.label = ContentStatus._LABELS_FILE[id]
        else:
            self.label = ContentStatus._LABELS[id]


    @classmethod
    def all(cls, type='') -> ['ContentStatus']:
        all = []
        all.append(ContentStatus('open', type))
        all.append(ContentStatus('closed-validated', type))
        all.append(ContentStatus('closed-unvalidated', type))
        all.append(ContentStatus('closed-deprecated', type))
        return all

    @classmethod
    def allowed_values(cls):
        return ContentStatus._LABELS.keys()

class ContentType(object):
    Any = 'any'

    Folder  = 'folder'
    File    = 'file'
    Comment = 'comment'
    Thread = 'thread'
    Page = 'page'

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
        assert(type in ContentType._ICONS) # DYN_REMOVE
        return ContentType._ICONS[type]

    @classmethod
    def allowed_types(cls):
        return [cls.Folder, cls.File, cls.Comment, cls.Thread, cls.Page]

    @classmethod
    def allowed_types_from_str(cls, allowed_types_as_string: str):
        allowed_types = []
        # HACK - THIS
        for item in allowed_types_as_string.split(ContentType._STRING_LIST_SEPARATOR):
            if item and item in ContentType.allowed_types():
                allowed_types.append(item)
        return allowed_types

class Content(DeclarativeBase):
    __tablename__ = 'contents'

    revision_to_serialize = -0  # This flag allow to serialize a given revision if required by the user

    content_id = Column(Integer, autoincrement=True, primary_key=True)
    parent_id = Column(Integer, ForeignKey('contents.content_id'), nullable=True, default=None)
    node_depth = Column(Integer, unique=False, nullable=False, default=0)
    parent_tree_path = Column(Unicode(255), unique=False, nullable=False, default='')
    owner_id = Column(Integer, ForeignKey('users.user_id'), nullable=True, default=None)

    type = Column(Unicode(32), unique=False, nullable=False)
    status = Column(Unicode(32), unique=False, nullable=False, default=ContentStatus.OPEN)

    created = Column(DateTime, unique=False, nullable=False)
    updated = Column(DateTime, unique=False, nullable=False)

    workspace_id = Column(Integer, ForeignKey('workspaces.workspace_id'), unique=False, nullable=True)

    workspace = relationship('Workspace', remote_side=[Workspace.workspace_id], backref='contents')


    is_deleted = Column(Boolean, unique=False, nullable=False, default=False)
    is_archived = Column(Boolean, unique=False, nullable=False, default=False)

    label = Column(Unicode(1024), unique=False, nullable=False, default='')
    description = Column(Text(), unique=False, nullable=False, default='')
    _properties = Column('properties', Text(), unique=False, nullable=False, default='')

    file_name = Column(Unicode(255),  unique=False, nullable=False, default='')
    file_mimetype = Column(Unicode(255),  unique=False, nullable=False, default='')
    file_content = deferred(Column(LargeBinary(), unique=False, nullable=False, default=None))

    revision_type = Column(Unicode(32), unique=False, nullable=False, default='')

    parent = relationship('Content', remote_side=[content_id], backref='children')
    owner = relationship('User', remote_side=[User.user_id])

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
        parse html content and extract links. By default, it works on the description property
        :param other_content: if not empty, then parse the given html content instead of description
        :return: a list of LinkItem
        """
        links = []
        soup = BeautifulSoup(self.description if not other_content else other_content)
        for link in soup.findAll('a'):
            href = link.get('href')
            label = link.contents
            links.append(LinkItem(href, label))
        links.sort(key=lambda link: link.href if link.href else '')

        sorted_links = sorted(links, key=lambda link: link.label if link.label else link.href, reverse=True)
        ## FIXME - Does this return a sorted list ???!
        return sorted_links


    def get_child_nb(self, content_type: ContentType, content_status = ''):
        child_nb = 0
        for child in self.children:
            if child.type==content_type:
                if not content_status:
                    child_nb = child_nb+1
                elif content_status==child.status:
                    child_nb = child_nb+1
        return child_nb

    def get_status(self) -> ContentStatus:
        return ContentStatus(self.status, self.type.__str__())


    def get_last_action(self) -> ActionDescription:
        return ActionDescription(self.revision_type)


    def get_comments(self):
        children = []
        for child in self.children:
            if child.type==ContentType.Comment:
                children.append(child)
        return children



class ContentChecker(object):

    @classmethod
    def check_properties(cls, item: Content):
        if item.type==ContentType.Folder:
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
    def reset_properties(cls, item: Content):
        if item.type==ContentType.Folder:
            item.properties = dict(
                allowed_content = dict (
                    folder = True,
                    file = True,
                    page = True,
                    thread = True
                )
            )
            return

        raise NotImplementedError


class ContentRevisionRO(DeclarativeBase):

    __tablename__ = 'content_revisions'

    revision_id = Column(Integer, primary_key=True)
    content_id = Column(Integer, ForeignKey('contents.content_id'))
    owner_id = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    label = Column(Unicode(1024), unique=False, nullable=False)
    description = Column(Text(), unique=False, nullable=False, default='')
    file_name = Column(Unicode(255),  unique=False, nullable=False, default='')
    file_mimetype = Column(Unicode(255),  unique=False, nullable=False, default='')
    file_content = deferred(Column(LargeBinary(), unique=False, nullable=False, default=None))

    status = Column(Unicode(32), unique=False, nullable=False)
    created = Column(DateTime, unique=False, nullable=False)
    updated = Column(DateTime, unique=False, nullable=False)
    is_deleted = Column(Boolean, unique=False, nullable=False)
    is_archived = Column(Boolean, unique=False, nullable=False)
    revision_type = Column(Unicode(32), unique=False, nullable=False, default='')

    workspace_id = Column(Integer, ForeignKey('workspaces.workspace_id'), unique=False, nullable=True)
    workspace = relationship('Workspace', remote_side=[Workspace.workspace_id])

    node = relationship('Content', remote_side=[Content.content_id], backref='revisions')
    owner = relationship('User', remote_side=[User.user_id])

    def get_status(self):
        return ContentStatus(self.status)

    def get_last_action(self) -> ActionDescription:
        return ActionDescription(self.revision_type)


class NodeTreeItem(object):
    """
        This class implements a model that allow to simply represents the left-panel menu items
         This model is used by dbapi but is not directly related to sqlalchemy and database
    """
    def __init__(self, node: Content, children: list('NodeTreeItem'), is_selected = False):
        self.node = node
        self.children = children
        self.is_selected = is_selected
