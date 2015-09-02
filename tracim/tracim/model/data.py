# -*- coding: utf-8 -*-

import tg
from datetime import datetime
from babel.dates import format_timedelta

from bs4 import BeautifulSoup
import datetime as datetime_root
import json

from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import Column
from sqlalchemy import func
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence

from sqlalchemy.ext.hybrid import hybrid_property

from sqlalchemy.orm import backref
from sqlalchemy.orm import relationship
from sqlalchemy.orm import deferred
from sqlalchemy.orm.collections import attribute_mapped_collection

from sqlalchemy.types import Boolean
from sqlalchemy.types import DateTime
from sqlalchemy.types import Integer
from sqlalchemy.types import LargeBinary
from sqlalchemy.types import Text
from sqlalchemy.types import Unicode

from tg.i18n import lazy_ugettext as l_, ugettext as _

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

    workspace_id = Column(Integer, Sequence('seq__workspaces__workspace_id'), autoincrement=True, primary_key=True)

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

    def get_label(self):
        """ this method is for interoperability with Content class"""
        return self.label

    def get_allowed_content_types(self):
        # @see Content.get_allowed_content_types()
        return [ContentType('folder')]

    def get_valid_children(self, content_types: list=None):
        for child in self.contents:
            # we search only direct children
            if not child.parent \
                    and not child.is_deleted \
                    and not child.is_archived:
                if not content_types or child.type in content_types:
                    yield child

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

    ICON = dict()
    ICON[0] = ''
    ICON[1] = 'fa-eye'
    ICON[2] = 'fa-pencil'
    ICON[4] = 'fa-graduation-cap'
    ICON[8] = 'fa-legal'


    @property
    def icon(self):
        return UserRoleInWorkspace.ICON[self.role]

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
        self.icon = UserRoleInWorkspace.ICON[role_id]
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
    MOVE = 'move'

    _ICONS = {
        'archiving': 'fa fa-archive',
        'content-comment': 'fa-comment-o',
        'creation': 'fa-magic',
        'deletion': 'fa-trash',
        'edition': 'fa-edit',
        'revision': 'fa-history',
        'status-update': 'fa-random',
        'unarchiving': 'fa-file-archive-o',
        'undeletion': 'fa-trash-o',
        'move': 'fa-arrows'
    }

    _LABELS = {
        'archiving': l_('archive'),
        'content-comment': l_('Item commented'),
        'creation': l_('Item created'),
        'deletion': l_('Item deleted'),
        'edition': l_('item modified'),
        'revision': l_('New revision'),
        'status-update': l_('New status'),
        'unarchiving': l_('Item unarchived'),
        'undeletion': l_('Item undeleted'),
        'move': l_('Item moved')
    }

    def __init__(self, id):
        assert id in ActionDescription.allowed_values()
        self.id = id
        self.label = ActionDescription._LABELS[id]
        self.icon = ActionDescription._ICONS[id]
        self.css = ''

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
                cls.UNDELETION,
                cls.MOVE]


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
        'open': 'fa fa-square-o',
        'closed-validated': 'fa fa-check-square-o',
        'closed-unvalidated': 'fa fa-close',
        'closed-deprecated': 'fa fa-warning',
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

    _ICONS = {  # Deprecated
        'dashboard': 'fa-home',
        'workspace': 'fa-bank',
        'folder': 'fa fa-folder-open-o',
        'file': 'fa fa-paperclip',
        'page': 'fa fa-file-text-o',
        'thread': 'fa fa-comments-o',
        'comment': 'fa fa-comment-o',
    }

    _CSS_ICONS = {
        'dashboard': 'fa fa-home',
        'workspace': 'fa fa-bank',
        'folder': 'fa fa-folder-open-o',
        'file': 'fa fa-paperclip',
        'page': 'fa fa-file-text-o',
        'thread': 'fa fa-comments-o',
        'comment': 'fa fa-comment-o'
    }

    _CSS_COLORS = {
        'dashboard': 't-dashboard-color',
        'workspace': 't-less-visible',
        'folder': 't-folder-color',
        'file': 't-file-color',
        'page': 't-page-color',
        'thread': 't-thread-color',
        'comment': 't-thread-color'
    }

    _ORDER_WEIGHT = {
        'folder': 0,
        'page': 1,
        'thread': 2,
        'file': 3,
        'comment': 4,
    }

    _LABEL = {
        'dashboard': '',
        'workspace': l_('workspace'),
        'folder': l_('folder'),
        'file': l_('file'),
        'page': l_('page'),
        'thread': l_('thread'),
        'comment': l_('comment'),
    }

    _DELETE_LABEL = {
        'dashboard': '',
        'workspace': l_('Delete this workspace'),
        'folder': l_('Delete this folder'),
        'file': l_('Delete this file'),
        'page': l_('Delete this page'),
        'thread': l_('Delete this thread'),
        'comment': l_('Delete this comment'),
    }

    @classmethod
    def get_icon(cls, type: str):
        assert(type in ContentType._ICONS) # DYN_REMOVE
        return ContentType._ICONS[type]

    @classmethod
    def all(cls):
        return cls.allowed_types()

    @classmethod
    def allowed_types(cls):
        return [cls.Folder, cls.File, cls.Comment, cls.Thread, cls.Page]

    @classmethod
    def allowed_types_for_folding(cls):
        # This method is used for showing only "main" types in the left-side treeview
        return [cls.Folder, cls.File, cls.Thread, cls.Page]

    @classmethod
    def allowed_types_from_str(cls, allowed_types_as_string: str):
        allowed_types = []
        # HACK - THIS
        for item in allowed_types_as_string.split(ContentType._STRING_LIST_SEPARATOR):
            if item and item in ContentType.allowed_types_for_folding():
                allowed_types.append(item)
        return allowed_types

    @classmethod
    def fill_url(cls, content: 'Content'):
        # TODO - DYNDATATYPE - D.A. - 2014-12-02
        # Make this code dynamic loading data types

        if content.type==ContentType.Folder:
            return '/workspaces/{}/folders/{}'.format(content.workspace_id, content.content_id)
        elif content.type==ContentType.File:
            return '/workspaces/{}/folders/{}/files/{}'.format(content.workspace_id, content.parent_id, content.content_id)
        elif content.type==ContentType.Thread:
            return '/workspaces/{}/folders/{}/threads/{}'.format(content.workspace_id, content.parent_id, content.content_id)
        elif content.type==ContentType.Page:
            return '/workspaces/{}/folders/{}/pages/{}'.format(content.workspace_id, content.parent_id, content.content_id)

    @classmethod
    def fill_url_for_workspace(cls, workspace: Workspace):
        # TODO - DYNDATATYPE - D.A. - 2014-12-02
        # Make this code dynamic loading data types
        return '/workspaces/{}'.format(workspace.workspace_id)

    @classmethod
    def sorted(cls, types: ['ContentType']) -> ['ContentType']:
        return sorted(types, key=lambda content_type: content_type.priority)

    @property
    def type(self):
        return self.id

    def __init__(self, type):
        self.id = type
        self.icon = ContentType._CSS_ICONS[type]
        self.color = ContentType._CSS_COLORS[type]  # deprecated
        self.css = ContentType._CSS_COLORS[type]
        self.label = ContentType._LABEL[type]
        self.priority = ContentType._ORDER_WEIGHT[type]

    def toDict(self):
        return dict(id=self.type,
                    type=self.type,
                    icon=self.icon,
                    color=self.color,
                    label=self.label,
                    priority=self.priority)

class Content(DeclarativeBase):

    __tablename__ = 'contents'

    revision_to_serialize = -0  # This flag allow to serialize a given revision if required by the user

    content_id = Column(Integer, Sequence('seq__contents__content_id'), autoincrement=True, primary_key=True)
    parent_id = Column(Integer, ForeignKey('contents.content_id'), nullable=True, default=None)
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

    def get_valid_children(self, content_types: list=None) -> ['Content']:
        for child in self.children:
            if not child.is_deleted and not child.is_archived:
                if not content_types or child.type in content_types:
                    yield child

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

    def created_as_delta(self, delta_from_datetime:datetime=None):
        if not delta_from_datetime:
            delta_from_datetime = datetime.now()

        return format_timedelta(delta_from_datetime - self.created,
                                locale=tg.i18n.get_lang()[0])

    def datetime_as_delta(self, datetime_object,
                          delta_from_datetime:datetime=None):
        if not delta_from_datetime:
            delta_from_datetime = datetime.now()
        return format_timedelta(delta_from_datetime - datetime_object,
                                locale=tg.i18n.get_lang()[0])


    def extract_links_from_content(self, other_content: str=None) -> [LinkItem]:
        """
        parse html content and extract links. By default, it works on the description property
        :param other_content: if not empty, then parse the given html content instead of description
        :return: a list of LinkItem
        """
        links = []
        return links
        soup = BeautifulSoup(
            self.description if not other_content else other_content,
            'html.parser'  # Fixes hanging bug - http://stackoverflow.com/questions/12618567/problems-running-beautifulsoup4-within-apache-mod-python-django
        )


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
        for child in self.get_valid_children():
            if child.type == content_type or content_type == ContentType.Any:
                if not content_status:
                    child_nb = child_nb+1
                elif content_status==child.status:
                    child_nb = child_nb+1
        return child_nb

    def get_label(self):
        return self.label if self.label else self.file_name if self.file_name else ''

    def get_status(self) -> ContentStatus:
        return ContentStatus(self.status, self.type.__str__())

    def get_last_action(self) -> ActionDescription:
        return ActionDescription(self.revision_type)

    def get_last_activity_date(self) -> datetime_root.datetime:
        last_revision_date = self.updated
        for revision in self.revisions:
            if revision.updated > last_revision_date:
                last_revision_date = revision.updated

        for child in self.children:
            if child.updated > last_revision_date:
                last_revision_date = child.updated
        return last_revision_date

    def has_new_information_for(self, user: User) -> bool:
        """
        :param user: the session current user
        :return: bool, True if there is new information for given user else False
                       False if the user is None
        """
        revision = self.get_current_revision()

        if not user:
            return False

        if user not in revision.read_by.keys():
            # The user did not read this item, so yes!
            return True

        for child in self.get_valid_children():
            if child.has_new_information_for(user):
                return True

        return False

    def get_comments(self):
        children = []
        for child in self.children:
            if ContentType.Comment==child.type and not child.is_deleted and not child.is_archived:
                children.append(child)
        return children

    def get_last_comment_from(self, user: User) -> 'Content':
        # TODO - Make this more efficient
        last_comment_updated = None
        last_comment = None
        for comment in self.get_comments():
            if user.user_id==comment.owner.user_id:
                if not last_comment or last_comment_updated<comment.updated:
                    # take only the latest comment !
                    last_comment = comment
                    last_comment_updated = comment.updated

        return last_comment

    def get_previous_revision(self) -> 'ContentRevisionRO':
        rev_ids = [revision.revision_id for revision in self.revisions]
        rev_ids.sort()

        if len(rev_ids)>=2:
            revision_rev_id = rev_ids[-2]

            for revision in self.revisions:
                if revision.revision_id == revision_rev_id:
                    return revision

        return None

    def get_current_revision(self) -> 'ContentRevisionRO':
        # TODO - D.A. - 2015-08-26
        # This code is not efficient at all!!!
        # We should get the revision id directly from the view
        rev_ids = [revision.revision_id for revision in self.revisions]
        rev_ids.sort()

        for revision in self.revisions:
            if revision.revision_id == rev_ids[-1]:
                return revision

        return None

    def description_as_raw_text(self):
        # 'html.parser' fixes a hanging bug
        # see http://stackoverflow.com/questions/12618567/problems-running-beautifulsoup4-within-apache-mod-python-django
        return BeautifulSoup(self.description, 'html.parser').text

    def get_allowed_content_types(self):
        types = []
        try:
            allowed_types = self.properties['allowed_content']
            for type_label, is_allowed in allowed_types.items():
                if is_allowed:
                    types.append(ContentType(type_label))
        except Exception as e:
            print(e.__str__())
            print('----- /*\ *****')
            raise ValueError('Not allowed content property')

        return ContentType.sorted(types)

    def get_history(self) -> '[VirtualEvent]':
        events = []
        for comment in self.get_comments():
            events.append(VirtualEvent.create_from_content(comment))
        for revision in self.revisions:
            events.append(VirtualEvent.create_from_content_revision(revision))

        sorted_events = sorted(events,
                               key=lambda event: event.created, reverse=True)
        return sorted_events

    @classmethod
    def format_path(cls, url_template: str, content: 'Content') -> str:
        wid = content.workspace.workspace_id
        fid = content.parent_id  # May be None if no parent
        ctype = content.type
        cid = content.content_id
        return url_template.format(wid=wid, fid=fid, ctype=ctype, cid=cid)


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

    revision_id = Column(Integer, Sequence('seq__content_revisions__revision_id'), primary_key=True)
    content_id = Column(Integer, ForeignKey('contents.content_id'))
    owner_id = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    label = Column(Unicode(1024), unique=False, nullable=False)
    description = Column(Text(), unique=False, nullable=False, default='')
    file_name = Column(Unicode(255),  unique=False, nullable=False, default='')
    file_mimetype = Column(Unicode(255),  unique=False, nullable=False, default='')
    file_content = deferred(Column(LargeBinary(), unique=False, nullable=False, default=None))

    type = Column(Unicode(32), unique=False, nullable=False)
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

    def get_label(self):
        return self.label if self.label else self.file_name if self.file_name else ''

    def get_last_action(self) -> ActionDescription:
        return ActionDescription(self.revision_type)

    # Read by must be used like this:
    # read_datetime = revision.ready_by[<User instance>]
    # if user did not read the content, then a key error is raised
    read_by = association_proxy(
        'revision_read_statuses',  # name of the attribute
        'view_datetime',  # attribute the value is taken from
        creator=lambda k, v: \
            RevisionReadStatus(user=k, view_datetime=v)
    )

    def has_new_information_for(self, user: User) -> bool:
        """
        :param user: the session current user
        :return: bool, True if there is new information for given user else False
                       False if the user is None
        """
        if not user:
            return False

        if user not in self.read_by.keys():
            return True

        return False

class RevisionReadStatus(DeclarativeBase):

    __tablename__ = 'revision_read_status'

    revision_id = Column(Integer, ForeignKey('content_revisions.revision_id', ondelete='CASCADE', onupdate='CASCADE'), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE', onupdate='CASCADE'), primary_key=True)
    view_datetime = Column(DateTime, unique=False, nullable=False, server_default=func.now())

    # content_revision = relationship(
    #     'ContentRevisionRO',
    #     remote_side=[ContentRevisionRO.revision_id],
    #     backref='revision_read_statuses')

    content_revision = relationship(
        'ContentRevisionRO',
        backref=backref(
            'revision_read_statuses',
            collection_class=attribute_mapped_collection('user'),
            cascade='all, delete-orphan'
        ))

    user = relationship('User', backref=backref(
        'revision_readers',
        collection_class=attribute_mapped_collection('view_datetime'),
        cascade='all, delete-orphan'
    ))


class NodeTreeItem(object):
    """
        This class implements a model that allow to simply represents the left-panel menu items
         This model is used by dbapi but is not directly related to sqlalchemy and database
    """
    def __init__(self, node: Content, children: list('NodeTreeItem'), is_selected = False):
        self.node = node
        self.children = children
        self.is_selected = is_selected

class VirtualEvent(object):
    @classmethod
    def create_from(cls, object):
        if Content == object.__class__:
            return cls.create_from_content(object)
        elif ContentRevisionRO == object.__class__:
            return cls.create_from_content_revision(object)

    @classmethod
    def create_from_content(cls, content: Content):
        content_type = ContentType(content.type)

        label = content.get_label()
        if content.type==ContentType.Comment:
            label = _('<strong>{}</strong> wrote:').format(content.owner.get_display_name())

        return VirtualEvent(id=content.content_id,
                            created=content.created,
                            owner=content.owner,
                            type=content_type,
                            label=label,
                            content=content.description,
                            ref_object=content)

    @classmethod
    def create_from_content_revision(cls, revision: ContentRevisionRO):
        action_description = ActionDescription(revision.revision_type)

        return VirtualEvent(id=revision.revision_id,
                            created=revision.created,
                            owner=revision.owner,
                            type=action_description,
                            label=action_description.label,
                            content='',
                            ref_object=revision)

    def __init__(self, id, created, owner, type, label, content, ref_object):
        self.id = id
        self.created = created
        self.owner = owner
        self.type = type
        self.label = label
        self.content = content
        self.ref_object = ref_object

        print(type)
        assert hasattr(type, 'id')
        assert hasattr(type, 'css')
        assert hasattr(type, 'icon')
        assert hasattr(type, 'label')

    def created_as_delta(self, delta_from_datetime:datetime=None):
        if not delta_from_datetime:
            delta_from_datetime = datetime.now()
        return format_timedelta(delta_from_datetime - self.created,
                                locale=tg.i18n.get_lang()[0])