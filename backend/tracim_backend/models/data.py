# -*- coding: utf-8 -*-
from collections import namedtuple
from datetime import datetime
from datetime import timedelta
import enum
import json
import os
from typing import Any
from typing import List
from typing import Optional

from babel.dates import format_timedelta
from bs4 import BeautifulSoup
from depot.fields.upload import UploadedFile
from depot.io.utils import FileIntent
from sqlakeyset import Page
from sqlakeyset import get_page
import sqlalchemy
from sqlalchemy import Column
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy import Index
from sqlalchemy import Sequence
from sqlalchemy import inspect
from sqlalchemy import text
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Query
from sqlalchemy.orm import aliased
from sqlalchemy.orm import backref
from sqlalchemy.orm import object_session
from sqlalchemy.orm import relationship
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.orm.collections import attribute_mapped_collection
from sqlalchemy.sql import func
from sqlalchemy.types import Boolean
from sqlalchemy.types import DateTime
from sqlalchemy.types import Integer
from sqlalchemy.types import Text
from sqlalchemy.types import Unicode

from tracim_backend.app_models.contents import ContentStatus
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import ContentRevisionUpdateError
from tracim_backend.exceptions import ContentStatusNotExist
from tracim_backend.exceptions import ContentTypeNotExist
from tracim_backend.exceptions import CopyRevisionAbortedDepotCorrupted
from tracim_backend.exceptions import NewRevisionAbortedDepotCorrupted
from tracim_backend.exceptions import WorkspaceFeatureDisabled
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import get_locale
from tracim_backend.models.auth import User
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin
from tracim_backend.models.mixins import TrashableMixin
from tracim_backend.models.mixins import UpdateDateMixin
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.types import TracimUploadedFileField
from tracim_backend.models.utils import get_sort_expression


class WorkspaceAccessType(enum.Enum):
    """Workspace access Types"""

    CONFIDENTIAL = "confidential"
    ON_REQUEST = "on_request"
    OPEN = "open"


class Workspace(CreationDateMixin, UpdateDateMixin, TrashableMixin, DeclarativeBase):
    FILEMANAGER_EXTENSION = ".space"
    ACCESSIBLE_TYPES = [WorkspaceAccessType.OPEN, WorkspaceAccessType.ON_REQUEST]

    __tablename__ = "workspaces"
    workspace_id = Column(
        Integer, Sequence("seq__workspaces__workspace_id"), autoincrement=True, primary_key=True
    )

    # TODO - G.M - 2018-10-30 - Make workspace label unique
    # Uniqueness of label is only check in high level when workspace is created,
    # we should be sure at database level that workspace label are unique
    # nb: be careful about mysql compat with long unicode, forcing utf8 charset
    # for mysql will probably be needed, see fix in User sqlalchemy object
    label = Column(Unicode(1024), unique=False, nullable=False, default="")
    description = Column(Text(), unique=False, nullable=False, default="")

    is_deleted = Column(Boolean, unique=False, nullable=False, default=False)
    revisions = relationship("ContentRevisionRO", back_populates="workspace")
    agenda_enabled = Column(Boolean, unique=False, nullable=False, default=False)
    public_upload_enabled = Column(
        Boolean,
        unique=False,
        nullable=False,
        default=False,
        server_default=sqlalchemy.sql.expression.literal(False),
    )
    public_download_enabled = Column(
        Boolean,
        unique=False,
        nullable=False,
        default=False,
        server_default=sqlalchemy.sql.expression.literal(False),
    )
    publication_enabled = Column(
        Boolean,
        unique=False,
        nullable=False,
        default=True,
        server_default=sqlalchemy.sql.expression.literal(True),
    )
    access_type = Column(
        Enum(WorkspaceAccessType),
        nullable=False,
        server_default=WorkspaceAccessType.CONFIDENTIAL.name,
    )
    default_user_role = Column(
        Enum(WorkspaceRoles), nullable=False, server_default=WorkspaceRoles.READER.name,
    )
    parent_id = Column(Integer, ForeignKey("workspaces.workspace_id"), nullable=True, default=None)
    children = relationship(
        "Workspace",
        backref=backref("parent", remote_side=[workspace_id], order_by="Workspace.workspace_id",),
        order_by="Workspace.workspace_id",
    )

    owner_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    owner = relationship("User", remote_side=[User.user_id])

    @property
    def recursive_children(self) -> List["Workspace"]:
        """
        :return: list of children Workspace
        """
        # TODO - G.M - 2020-10-06 - Use SQLAlchemy SQL Expression Language instead of raw sql here,
        # see https://github.com/tracim/tracim/issues/3670
        statement = text(
            """
            with RECURSIVE children_id as (
                select workspaces.workspace_id as id from workspaces
                where workspaces.parent_id = :workspace_id
                union all
                select workspaces.workspace_id as id from workspaces
                join children_id c on c.id = workspaces.parent_id
            )
            select children_id.id as workspace_id from children_id;
            """
        )
        children_ids = [
            elem[0]
            for elem in object_session(self)
            .execute(statement, {"workspace_id": self.workspace_id})
            .fetchall()
        ]
        if children_ids:
            return (
                object_session(self)
                .query(Workspace)
                .filter(Workspace.workspace_id.in_(children_ids))
                .order_by(Workspace.workspace_id)
            ).all()
        return []

    def get_children(self, recursively: bool = False) -> List["Workspace"]:
        """
        Get all children of workspace recursively or not (including children of children...)
        """
        if recursively:
            return self.recursive_children
        else:
            return self.children

    @property
    def filemanager_filename(self) -> str:
        """
        unambigous filename for file_manager
        """
        # INFO - G.M - The virtual extension of workspace is the extension of file to use when needed to
        # show a workspace in a context where it's not possible to show 2 same name file, the goal of
        # this is to easiest the usage of sub-workspace and avoid collision between file and workspace
        # in context file-like like webdav
        virtual_extension = Workspace.FILEMANAGER_EXTENSION
        return "{}{}".format(self.label, virtual_extension)

    @hybrid_property
    def contents(self) -> List["Content"]:
        # Return a list of unique revisions parent content
        contents = []
        for revision in self.revisions:
            # TODO BS 20161209: This ``revision.node.workspace`` make a lot
            # of SQL queries !
            if revision.node.workspace == self and revision.node not in contents:
                contents.append(revision.node)

        return contents

    def get_size(self, include_deleted: bool = False, include_archived: bool = False) -> int:
        size = 0
        for revision in self.revisions:
            # INFO - G.M - 2019-09-02 - Don't count deleted and archived file.
            if not include_deleted and revision.node.is_deleted:
                continue
            if not include_archived and revision.node.is_archived:
                continue
            if revision.depot_file:
                size += revision.depot_file.file.content_length
        return size

    def get_user_role(self, user: User) -> int:
        for role in user.roles:
            if role.workspace.workspace_id == self.workspace_id:
                return role.role
        return WorkspaceRoles.NOT_APPLICABLE.level

    def get_label(self):
        """ this method is for interoperability with Content class"""
        return self.label

    def get_allowed_content_types(self) -> List[TracimContentType]:
        # @see Content.get_allowed_content_types()
        return content_type_list.endpoint_allowed_types()

    def get_valid_children(
        self, content_types: list = None, show_deleted: bool = False, show_archived: bool = False
    ):
        for child in self.contents:
            # we search only direct children
            if (
                not child.parent
                and (show_deleted or not child.is_deleted)
                and (show_archived or not child.is_archived)
            ):
                if not content_types or child.type in content_types:
                    yield child

    def check_for_publication(self) -> None:
        if not self.publication_enabled:
            raise WorkspaceFeatureDisabled(
                "Feature {} is disabled in workspace {}".format("publication", self.workspace_id)
            )


Index("idx__workspaces__parent_id", Workspace.parent_id)


class UserRoleInWorkspace(DeclarativeBase):
    __tablename__ = "user_workspace"

    user_id = Column(
        Integer, ForeignKey("users.user_id"), nullable=False, default=None, primary_key=True
    )
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.workspace_id"),
        nullable=False,
        default=None,
        primary_key=True,
    )
    role = Column(Integer, nullable=False, default=0, primary_key=False)
    do_notify = Column(Boolean, unique=False, nullable=False, default=False)

    workspace = relationship(
        "Workspace", remote_side=[Workspace.workspace_id], backref="roles", lazy="joined",
    )
    user = relationship("User", remote_side=[User.user_id], backref="roles")

    NOT_APPLICABLE = WorkspaceRoles.NOT_APPLICABLE.level
    READER = WorkspaceRoles.READER.level
    CONTRIBUTOR = WorkspaceRoles.CONTRIBUTOR.level
    CONTENT_MANAGER = WorkspaceRoles.CONTENT_MANAGER.level
    WORKSPACE_MANAGER = WorkspaceRoles.WORKSPACE_MANAGER.level

    def role_object(self):
        return WorkspaceRoles.get_role_from_level(level=self.role)

    def role_as_label(self):
        return self.role_object().label

    @classmethod
    def get_all_role_values(cls) -> List[int]:
        """
        Return all valid role value
        """
        return [role.level for role in WorkspaceRoles.get_all_valid_role()]

    @classmethod
    def get_all_role_slug(cls) -> List[str]:
        """
        Return all valid role slug
        """
        # INFO - G.M - 25-05-2018 - Be carefull, as long as this method
        # and get_all_role_values are both used for API, this method should
        # return item in the same order as get_all_role_values
        return [role.slug for role in WorkspaceRoles.get_all_valid_role()]


class WorkspaceSubscriptionState(enum.Enum):
    """Workspace subscription state Types"""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class WorkspaceSubscription(DeclarativeBase):
    __tablename__ = "workspace_subscriptions"

    state = Column(
        Enum(WorkspaceSubscriptionState),
        nullable=False,
        server_default=WorkspaceSubscriptionState.PENDING.name,
    )
    # TODO - G.M - 2021-03-10:  use CreationDateMixin instead
    created_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.workspace_id"),
        nullable=False,
        default=None,
        primary_key=True,
    )
    author_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, primary_key=True)
    evaluation_date = Column(DateTime, nullable=True)
    evaluator_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, default=None)
    workspace = relationship(
        "Workspace", remote_side=[Workspace.workspace_id], backref="subscriptions"
    )
    author = relationship("User", foreign_keys=[author_id], backref="workspace_subscriptions")
    evaluator = relationship(
        "User", foreign_keys=[evaluator_id], backref="workspace_evaluated_subscriptions"
    )

    @property
    def state_slug(self):
        return self.state.value


class ActionDescription(object):
    """
    Allowed status are:
    - open
    - closed-validated
    - closed-invalidated
    - closed-deprecated
    """

    COPY = "copy"
    ARCHIVING = "archiving"
    COMMENT = "content-comment"
    CREATION = "creation"
    DELETION = "deletion"
    EDITION = "edition"  # Default action if unknow
    REVISION = "revision"
    STATUS_UPDATE = "status-update"
    UNARCHIVING = "unarchiving"
    UNDELETION = "undeletion"
    MOVE = "move"

    # TODO - G.M - 10-04-2018 - [Cleanup] Drop this
    _ICONS = {
        "archiving": "fas fa-archive",
        "content-comment": "far fa-comment",
        "creation": "fas fa-magic",
        "deletion": "far trash-alt",
        "edition": "fas fa-edit",
        "revision": "fas fa-history",
        "status-update": "fas fa-random",
        "unarchiving": "far file-archive",
        "undeletion": "far fa-trash-alt",
        "move": "fas fa-arrows-alt",
        "copy": "far fa-copy",
    }

    def __init__(self, id):
        assert id in ActionDescription.allowed_values()
        self.id = id
        # FIXME - G.M - 17-04-2018 - Label and fa_icon needed for webdav
        #  design template,
        # find a way to not rely on this.
        self.label = self.id
        self.fa_icon = ActionDescription._ICONS[id]

    @classmethod
    def allowed_values(cls):
        return [
            cls.ARCHIVING,
            cls.COMMENT,
            cls.CREATION,
            cls.DELETION,
            cls.EDITION,
            cls.REVISION,
            cls.STATUS_UPDATE,
            cls.UNARCHIVING,
            cls.UNDELETION,
            cls.MOVE,
            cls.COPY,
        ]


class ContentChecker(object):
    @classmethod
    def check_properties(cls, item):
        properties = item.properties
        if "allowed_content" in properties.keys():
            for content_slug, value in properties["allowed_content"].items():
                if not isinstance(value, bool):
                    return False
                if content_slug not in content_type_list.endpoint_allowed_types_slug():
                    return False
        return True


class ContentNamespaces(str, enum.Enum):
    CONTENT = "content"
    UPLOAD = "upload"
    PUBLICATION = "publication"


class ContentSortOrder(str, enum.Enum):
    LABEL_ASC = "label:asc"
    MODIFIED_ASC = "modified:asc"
    LABEL_DESC = "label:desc"
    MODIFIED_DESC = "modified:desc"
    CREATED_ASC = "created:asc"
    CREATED_DESC = "created:desc"

    @property
    def is_asc(self) -> bool:
        return self.value.endswith(":asc")


class ContentRevisionRO(CreationDateMixin, UpdateDateMixin, TrashableMixin, DeclarativeBase):
    """
    Revision of Content. It's immutable, update or delete an existing ContentRevisionRO will throw
    ContentRevisionUpdateError errors.
    """

    __tablename__ = "content_revisions"

    revision_id = Column(
        Integer,
        Sequence("seq__content_revisions__revision_id"),
        autoincrement=True,
        primary_key=True,
    )
    # NOTE - S.G - 2020-05-06: cannot set nullable=False as post_update is used
    # for current_revision in Content.
    content_id = Column(Integer, ForeignKey("content.id", ondelete="CASCADE"))
    # TODO - G.M - 2018-06-177 - [author] Owner should be renamed "author" ?
    owner_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    owner = relationship("User", remote_side=[User.user_id])

    description = Column(Text(), unique=False, nullable=False, default="")
    raw_content = Column(Text(), unique=False, nullable=False, default="")
    file_extension = Column(Unicode(255), unique=False, nullable=False, server_default="")
    file_mimetype = Column(Unicode(255), unique=False, nullable=False, default="")
    # INFO - A.P - 2017-07-03 - Depot Doc
    # http://depot.readthedocs.io/en/latest/#attaching-files-to-models
    # http://depot.readthedocs.io/en/latest/api.html#module-depot.fields
    depot_file = Column(TracimUploadedFileField, unique=False, nullable=True)
    properties = Column("properties", Text(), unique=False, nullable=False, default="")

    # INFO - G.M - same type are used for FavoriteContent.
    label = Column(Unicode(1024), unique=False, nullable=False)
    type = Column(Unicode(32), unique=False, nullable=False)

    status = Column(
        Unicode(32),
        unique=False,
        nullable=False,
        default=str(content_status_list.get_default_status().slug),
    )
    is_archived = Column(Boolean, unique=False, nullable=False, default=False)
    is_temporary = Column(Boolean, unique=False, nullable=False, default=False)
    revision_type = Column(Unicode(32), unique=False, nullable=False, default="")

    workspace_id = Column(
        Integer, ForeignKey("workspaces.workspace_id"), unique=False, nullable=True
    )
    workspace = relationship("Workspace", back_populates="revisions")

    parent_id = Column(Integer, ForeignKey("content.id"), nullable=True, default=None)
    parent = relationship("Content", foreign_keys=[parent_id], back_populates="children_revisions")

    node = relationship("Content", foreign_keys=[content_id], back_populates="revisions")
    content_namespace = Column(
        Enum(ContentNamespaces), nullable=False, server_default=ContentNamespaces.CONTENT.name
    )

    """ List of column copied when make a new revision from another """
    _cloned_columns = (
        # db_column
        "content_id",
        "content_namespace",
        "created",
        "description",
        "file_extension",
        "file_mimetype",
        "is_archived",
        "is_deleted",
        "is_temporary",
        "label",
        "owner_id",
        "parent_id",
        "properties",
        "raw_content",
        "revision_type",
        "status",
        "type",
        "updated",
        "workspace_id",
        # object
        "owner",
        "parent",
        "workspace",
    )

    # Read by must be used like this:
    # read_datetime = revision.ready_by[<User instance>]
    # if user did not read the content, then a key error is raised
    read_by = association_proxy(
        "revision_read_statuses",  # name of the attribute
        "view_datetime",  # attribute the value is taken from
        creator=lambda k, v: RevisionReadStatus(user=k, view_datetime=v),
    )

    @hybrid_property
    def file_name(self) -> str:
        return "{0}{1}".format(self.label, self.file_extension)

    @file_name.setter
    def file_name(self, value: str) -> None:
        file_name, file_extension = os.path.splitext(value)
        self.label = file_name
        self.file_extension = file_extension

    @file_name.expression
    def file_name(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.label + ContentRevisionRO.file_extension

    @classmethod
    def new_from(cls, revision: "ContentRevisionRO") -> "ContentRevisionRO":
        """

        Return new instance of ContentRevisionRO where properties are copied from revision parameter.
        Look at ContentRevisionRO._cloned_columns to see what columns are copieds.

        :param revision: revision to copy
        :type revision: ContentRevisionRO
        :return: new revision from revision parameter
        :rtype: ContentRevisionRO
        """
        new_rev = cls()

        for column_name in cls._cloned_columns:
            column_value = getattr(revision, column_name)
            setattr(new_rev, column_name, column_value)

        new_rev.updated = datetime.utcnow()
        if revision.depot_file:
            try:
                new_rev.depot_file = FileIntent(
                    revision.depot_file.file, revision.file_name, revision.file_mimetype
                )
            except IOError as exc:
                raise NewRevisionAbortedDepotCorrupted(
                    "IOError. Can't create new revision by copying another one "
                    " during new revision creation process."
                    " May be related to original revision"
                    " file not being available."
                ) from exc

        return new_rev

    @classmethod
    def copy(
        cls,
        revision: "ContentRevisionRO",
        parent: "Content",
        new_content_namespace: ContentNamespaces,
    ) -> "ContentRevisionRO":

        copy_rev = cls()
        import copy

        copy_columns = cls._cloned_columns
        for column_name in copy_columns:
            # INFO - G-M - 15-03-2018 - set correct parent
            if column_name == "parent_id" and parent:
                column_value = copy.copy(parent.id)
            elif column_name == "parent" and parent:
                column_value = copy.copy(parent)
            elif column_name == "content_namespace":
                column_value = new_content_namespace
            else:
                column_value = copy.copy(getattr(revision, column_name))
            setattr(copy_rev, column_name, column_value)

        # copy attached_file
        if revision.depot_file:
            try:
                copy_rev.depot_file = FileIntent(
                    revision.depot_file.file, revision.file_name, revision.file_mimetype
                )
            except IOError as exc:
                raise CopyRevisionAbortedDepotCorrupted(
                    "IOError. Can't create new revision by copying another one"
                    " during content copy process."
                    " May be related to original revision "
                    " file not being available."
                ) from exc
        return copy_rev

    def __setattr__(self, key: str, value: Any):
        """
        ContentRevisionUpdateError is raised if tried to update column and revision own identity
        :param key: attribute name
        :param value: attribute value
        :return:
        """
        if key in (
            "_sa_instance_state",
        ):  # Prevent infinite loop from SQLAlchemy code and altered set
            return super().__setattr__(key, value)

        # FIXME - G.M - 28-03-2018 - Cycling Import
        from tracim_backend.models.revision_protection import RevisionsIntegrity

        if (
            inspect(self).has_identity
            and key in self._cloned_columns
            and not RevisionsIntegrity.is_updatable(self)
        ):
            raise ContentRevisionUpdateError(
                "Can't modify revision. To work on new revision use tracim.model.new_revision "
                + "context manager."
            )

        super().__setattr__(key, value)

    @property
    def is_active(self) -> bool:
        return not self.is_deleted and not self.is_archived

    @property
    def is_readonly(self) -> bool:
        return False

    @property
    def version_number(self) -> int:
        return (
            object_session(self)
            .query(ContentRevisionRO.revision_id)
            .filter(ContentRevisionRO.revision_id <= self.revision_id)
            .filter(ContentRevisionRO.content_id == self.content_id)
            .count()
        )

    def get_status(self) -> ContentStatus:
        try:
            return content_status_list.get_one_by_slug(self.status)
        except ContentStatusNotExist:
            return content_status_list.get_default_status()

    def get_label(self) -> str:
        return self.label or self.file_name or ""

    def get_last_action(self) -> ActionDescription:
        return ActionDescription(self.revision_type)

    def has_new_information_for(self, user: User) -> bool:
        """
        :param user: the _session current user
        :return: bool, True if there is new information for given user else False
                       False if the user is None
        """
        if not user:
            return False

        if user not in self.read_by.keys():
            return True

        return False


# TODO - G.M - 2018-06-177 - [author] Owner should be renamed "author"
Index("idx__content_revisions__owner_id", ContentRevisionRO.owner_id)
Index("idx__content_revisions__parent_id", ContentRevisionRO.parent_id)
# INFO - G.M - 2020-04-02 - Theses index may have different name in mysql
# this is due to the fact, we do not remove automatically created index by mysql
# on foreign key.
Index("idx__content_revisions__content_id", ContentRevisionRO.content_id)
Index("idx__content_revisions__workspace_id", ContentRevisionRO.workspace_id)


class Content(DeclarativeBase):
    """
    Content is used as a virtual representation of ContentRevisionRO.
    content.PROPERTY (except for content.id, content.revisions, content.children_revisions) will return
    value of most recent revision of content.

    # UPDATE A CONTENT

    To update an existing Content, you must use tracim.model.new_revision context manager:
    content = my_sontent_getter_method()
    with new_revision(content):
        content.description = 'foo bar baz'
    DBSession.flush()

    # QUERY CONTENTS

    To query contents you will need to join your content query with ContentRevisionRO. Join
    condition is available at tracim.lib.content.ContentApi#_get_revision_join:

    content = DBSession.query(Content).join(ContentRevisionRO, ContentApi._get_revision_join())
                  .filter(Content.label == 'foo')
                  .one()

    ContentApi provide also prepared Content at tracim.lib.content.ContentApi#get_canonical_query:

    content = ContentApi.get_canonical_query()
              .filter(Content.label == 'foo')
              .one()
    """

    __tablename__ = "content"

    revision_to_serialize = (
        -0
    )  # This flag allow to serialize a given revision if required by the user

    id = Column(Integer, Sequence("seq__content__id"), autoincrement=True, primary_key=True)
    cached_revision_id = Column(
        Integer, ForeignKey("content_revisions.revision_id", ondelete="RESTRICT")
    )

    current_revision = relationship(
        "ContentRevisionRO", uselist=False, foreign_keys=[cached_revision_id], post_update=True,
    )

    # TODO - A.P - 2017-09-05 - revisions default sorting
    # The only sorting that makes sens is ordering by "updated" field. But:
    # - its content will soon replace the one of "created",
    # - this "updated" field will then be dropped.
    # So for now, we order by "revision_id" explicitly, but remember to switch
    # to "created" once "updated" removed.
    # https://github.com/tracim/tracim/issues/336
    revisions = relationship(
        "ContentRevisionRO",
        foreign_keys=[ContentRevisionRO.content_id],
        back_populates="node",
        order_by="ContentRevisionRO.revision_id",
    )
    children_revisions = relationship(
        "ContentRevisionRO",
        foreign_keys=[ContentRevisionRO.parent_id],
        back_populates="parent",
        order_by="ContentRevisionRO.revision_id",
    )

    @hybrid_property
    def content_id(self) -> int:
        return self.revision.content_id

    @content_id.setter
    def content_id(self, value: int) -> None:
        self.revision.content_id = value

    @content_id.expression
    def content_id(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.content_id

    @hybrid_property
    def revision_id(self) -> int:
        return self.cached_revision_id

    @revision_id.setter
    def revision_id(self, value: int) -> None:
        self.cached_revision_id = value

    @revision_id.expression
    def revision_id(cls) -> InstrumentedAttribute:
        return Content.cached_revision_id

    @property
    def revision(self) -> ContentRevisionRO:
        if not self.revisions:
            self.current_revision = ContentRevisionRO()
            self.current_revision.node = self
        return self.current_revision

    # TODO - G.M - 2018-06-177 - [author] Owner should be renamed "author"
    # and should be author of first revision.
    @hybrid_property
    def owner_id(self) -> int:
        return self.revision.owner_id

    @owner_id.setter
    def owner_id(self, value: int) -> None:
        self.revision.owner_id = value

    @owner_id.expression
    def owner_id(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.owner_id

    @hybrid_property
    def label(self) -> str:
        return self.revision.label

    @label.setter
    def label(self, value: str) -> None:
        self.revision.label = value

    @label.expression
    def label(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.label

    @hybrid_property
    def description(self) -> str:
        return self.revision.description

    @description.setter
    def description(self, value: str) -> None:
        self.revision.description = value

    @description.expression
    def description(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.description

    @hybrid_property
    def raw_content(self) -> str:
        return self.revision.raw_content

    @raw_content.setter
    def raw_content(self, value: str) -> None:
        self.revision.raw_content = value

    @raw_content.expression
    def raw_content(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.raw_content

    @hybrid_property
    def file_name(self) -> str:
        return self.revision.file_name

    @file_name.setter
    def file_name(self, value: str) -> None:
        file_name, file_extension = os.path.splitext(value)
        self.label = file_name
        self.file_extension = file_extension

    @file_name.expression
    def file_name(cls) -> InstrumentedAttribute:
        return Content.label + Content.file_extension

    @hybrid_property
    def file_extension(self) -> str:
        return self.revision.file_extension

    @file_extension.setter
    def file_extension(self, value: str) -> None:
        self.revision.file_extension = value

    @file_extension.expression
    def file_extension(cls) -> str:
        return ContentRevisionRO.file_extension

    @hybrid_property
    def file_mimetype(self) -> str:
        return self.revision.file_mimetype

    @file_mimetype.setter
    def file_mimetype(self, value: str) -> None:
        self.revision.file_mimetype = value

    @file_mimetype.expression
    def file_mimetype(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.file_mimetype

    @hybrid_property
    def _properties(self) -> str:
        return self.revision.properties

    @_properties.setter
    def _properties(self, value: str) -> None:
        self.revision.properties = value

    @_properties.expression
    def _properties(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.properties

    @hybrid_property
    def type(self) -> str:
        return self.revision.type

    @type.setter
    def type(self, value: str) -> None:
        self.revision.type = value

    @type.expression
    def type(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.type

    @hybrid_property
    def status(self) -> str:
        return self.revision.status

    @status.setter
    def status(self, value: str) -> None:
        self.revision.status = value

    @status.expression
    def status(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.status

    @hybrid_property
    def created(self) -> datetime:
        return self.revision.created

    @created.setter
    def created(self, value: datetime) -> None:
        self.revision.created = value

    @created.expression
    def created(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.created

    @hybrid_property
    def updated(self) -> datetime:
        return self.revision.updated

    @updated.setter
    def updated(self, value: datetime) -> None:
        self.revision.updated = value

    @updated.expression
    def updated(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.updated

    @hybrid_property
    def is_deleted(self) -> bool:
        return self.revision.is_deleted

    @is_deleted.setter
    def is_deleted(self, value: bool) -> None:
        self.revision.is_deleted = value

    @is_deleted.expression
    def is_deleted(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.is_deleted

    @hybrid_property
    def is_archived(self) -> bool:
        return self.revision.is_archived

    @is_archived.setter
    def is_archived(self, value: bool) -> None:
        self.revision.is_archived = value

    @is_archived.expression
    def is_archived(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.is_archived

    @hybrid_property
    def is_temporary(self) -> bool:
        return self.revision.is_temporary

    @is_temporary.setter
    def is_temporary(self, value: bool) -> None:
        self.revision.is_temporary = value

    @is_temporary.expression
    def is_temporary(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.is_temporary

    @hybrid_property
    def revision_type(self) -> str:
        return self.revision.revision_type

    @revision_type.setter
    def revision_type(self, value: str) -> None:
        self.revision.revision_type = value

    @revision_type.expression
    def revision_type(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.revision_type

    @hybrid_property
    def workspace_id(self) -> int:
        return self.revision.workspace_id

    @workspace_id.setter
    def workspace_id(self, value: int) -> None:
        self.revision.workspace_id = value

    @workspace_id.expression
    def workspace_id(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.workspace_id

    @hybrid_property
    def workspace(self) -> Workspace:
        return self.revision.workspace

    @workspace.setter
    def workspace(self, value: Workspace) -> None:
        self.revision.workspace = value

    @workspace.expression
    def workspace(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.workspace

    @hybrid_property
    def parent_id(self) -> int:
        return self.revision.parent_id

    @parent_id.setter
    def parent_id(self, value: int) -> None:
        self.revision.parent_id = value

    @parent_id.expression
    def parent_id(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.parent_id

    @hybrid_property
    def parent(self) -> "Content":
        return self.revision.parent

    @parent.setter
    def parent(self, value: "Content") -> None:
        self.revision.parent = value

    @parent.expression
    def parent(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.parent

    @hybrid_property
    def content_namespace(self) -> ContentNamespaces:
        return self.revision.content_namespace

    @content_namespace.setter
    def content_namespace(self, value: ContentNamespaces) -> None:
        self.revision.content_namespace = value

    @content_namespace.expression
    def content_namespace(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.content_namespace

    @hybrid_property
    def node(self) -> "Content":
        return self.revision.node

    @node.setter
    def node(self, value: "Content") -> None:
        self.revision.node = value

    @node.expression
    def node(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.node

    # TODO - G.M - 2018-06-177 - [author] Owner should be renamed "author"
    # and should be author of first revision.
    @hybrid_property
    def owner(self) -> User:
        return self.revision.owner

    @owner.setter
    def owner(self, value: User) -> None:
        self.revision.owner = value

    @owner.expression
    def owner(cls) -> InstrumentedAttribute:
        return ContentRevisionRO.owner

    @property
    def children(self) -> List["Content"]:
        return (
            object_session(self)
            .query(Content)
            .join(ContentRevisionRO, Content.cached_revision_id == ContentRevisionRO.revision_id)
            .filter(ContentRevisionRO.parent_id == self.id)
            .order_by(ContentRevisionRO.content_id)
        )

    @property
    def recursive_children(self) -> List["Content"]:
        """typing.Listtyping.List
        :return: list of children Content
        :rtype Content
        """
        # TODO - G.M - 2020-10-06 - Use SQLAlchemy SQL Expression Language instead of raw sql here,
        # see https://github.com/tracim/tracim/issues/3670
        statement = text(
            """
    with RECURSIVE children_id as (
    select content.id as id from content join content_revisions cr on content.cached_revision_id = cr.revision_id
    where cr.parent_id = :content_id
    union all
    select content.id as id
    from content join content_revisions cr on content.cached_revision_id = cr.revision_id
        join children_id c on c.id = cr.parent_id
    )
    select content.id from content join content_revisions on content.cached_revision_id = content_revisions.revision_id
        join children_id c on c.id = content.id;
            """
        )
        children_ids = [
            elem[0] for elem in object_session(self).execute(statement, {"content_id": self.id})
        ]
        if children_ids:
            return (
                object_session(self)
                .query(Content)
                .join(
                    ContentRevisionRO, Content.cached_revision_id == ContentRevisionRO.revision_id
                )
                .filter(Content.id.in_(children_ids))
                .order_by(ContentRevisionRO.content_id)
            )
        return []

    @property
    def recursive_parents(self) -> List["Content"]:
        """
        :return: list of parent Content order from the direct parent to the last ancestor
        """

        # TODO - G.M - 2020-10-06 - Explore the idea of recursive CTE here, it's not so trivial as
        # we should keep tree order between id query retriever and content query.
        parents = []
        current_parent = self.parent
        while current_parent:
            parents.append(current_parent)
            current_parent = current_parent.parent
        return parents

    @property
    def content_path(self) -> List["Content"]:
        """
        Return content parents ordered from the last ancestor to the direct ancestor + content itself
        """
        content_path = list(self.recursive_parents)
        content_path.reverse()
        content_path.append(self)
        return content_path

    def get_children(self, recursively: bool = False) -> List["Content"]:
        """
        Get all children of content recursively or not (including children of children...)
        """
        if recursively:
            return self.recursive_children
        else:
            return self.children

    @property
    def first_revision(self) -> ContentRevisionRO:
        return self.revisions[0]  # FIXME

    @property
    def last_revision(self) -> ContentRevisionRO:
        return self.revisions[-1]

    @property
    def is_readonly(self) -> bool:
        return self.revision.is_readonly

    @property
    def is_active(self) -> bool:
        return self.revision.is_active

    @property
    def depot_file(self) -> UploadedFile:
        return self.revision.depot_file

    @depot_file.setter
    def depot_file(self, value):
        self.revision.depot_file = value

    def new_revision(self) -> ContentRevisionRO:
        """
        Return and assign to this content a new revision.
        If it's a new content, revision is totally new.
        If this content already own revision, revision is build from last revision.
        :return:
        """
        if not self.current_revision:
            new_rev = ContentRevisionRO()
        else:
            new_rev = ContentRevisionRO.new_from(self.current_revision)
        new_rev.node = self
        self.current_revision = new_rev
        return new_rev

    def get_valid_children(self, content_types: List[str] = None) -> Query:
        query = self.children.filter(ContentRevisionRO.is_deleted == False).filter(  # noqa: E712
            ContentRevisionRO.is_archived == False  # noqa: E712
        )

        if content_types:
            query = query.filter(ContentRevisionRO.type.in_(content_types))
        return query

    @hybrid_property
    def properties(self) -> dict:
        """ return a structure decoded from json content of _properties """

        if not self._properties:
            properties = {}
        else:
            properties = json.loads(self._properties)
        if "allowed_content" not in properties:
            properties["allowed_content"] = content_type_list.default_allowed_content_properties(
                self.type
            )
        return properties

    @properties.setter
    def properties(self, properties_struct: dict) -> None:
        """ encode a given structure into json and store it in _properties attribute"""
        self._properties = json.dumps(properties_struct)
        ContentChecker.check_properties(self)

    def created_as_delta(self, delta_from_datetime: datetime = None) -> timedelta:
        if not delta_from_datetime:
            delta_from_datetime = datetime.utcnow()

        return format_timedelta(delta_from_datetime - self.created, locale=get_locale())

    def datetime_as_delta(self, datetime_object, delta_from_datetime: datetime = None) -> timedelta:
        if not delta_from_datetime:
            delta_from_datetime = datetime.utcnow()
        return format_timedelta(delta_from_datetime - datetime_object, locale=get_locale())

    def get_label(self) -> str:
        return self.label or self.file_name or ""

    def get_status(self) -> ContentStatus:
        return self.revision.get_status()

    def get_last_action(self) -> ActionDescription:
        return ActionDescription(self.revision_type)

    def has_new_information_for(self, user: User, recursive: bool = True) -> bool:
        """
        :param user: the _session current user
        :return: bool, True if there is new information for given user else False
                       False if the user is None
        """
        revision = self.current_revision
        if not revision:
            return False

        if not user:
            return False

        if user not in revision.read_by.keys():
            # The user did not read this item, so yes!
            return True

        if recursive:
            for child in self.recursive_children:
                if child.has_new_information_for(user, recursive=False):
                    # The user did not read this item, so yes!
                    return True

        return False

    def get_comments(
        self,
        page_token: Optional[str] = None,
        count: Optional[int] = None,
        sort_order: ContentSortOrder = ContentSortOrder.CREATED_ASC,
    ) -> Page:
        """Get the comments of this Content in pages."""
        query = self.get_valid_children(content_types=[content_type_list.Comment.slug])
        # INFO - 2021-08-16 - S.G. : remove the sort clause as
        # get_valid_children calls children which always sorts by id.
        query = query.order_by(None)
        sort_clause = get_sort_expression(sort_order, Content)
        query = query.order_by(sort_clause)
        # INFO - 2021-08-17 - S.G. - Always add a sort on the content id
        # in order to differenciate between comments with the same creation/modification date.
        if sort_order.is_asc:
            id_sort_clause = Content.id.asc()
        else:
            id_sort_clause = Content.id.desc()
        query = query.order_by(id_sort_clause)
        if count:
            return get_page(query, per_page=count, page=page_token or False)
        return Page(query.all())

    def get_revisions(
        self,
        page_token: Optional[str] = None,
        count: Optional[int] = None,
        sort_order: ContentSortOrder = ContentSortOrder.CREATED_ASC,
    ) -> Page:
        """Get the revisions of this Content in pages."""
        ContentRevisionROForNumber = aliased(ContentRevisionRO)
        session = object_session(self)
        number_subquery = (
            session.query(func.count(ContentRevisionROForNumber.revision_id))
            .filter(ContentRevisionROForNumber.revision_id <= ContentRevisionRO.revision_id)
            .filter(ContentRevisionROForNumber.content_id == ContentRevisionRO.content_id)
            .correlate(ContentRevisionRO)
            # NOTE - 2021/08/16 - S.G. - the label() transforms the query in a scalar subquery
            # which is properly generated as
            #  SELECT ..., Q FROM content_revisions
            # Without the generated query is
            #  SELECT ..., tbl_row_count FROM content_revisions, Q
            # which is incorrect
            .label("version_number")
        )
        query = session.query(ContentRevisionRO, number_subquery).filter(
            ContentRevisionRO.content_id == self.content_id
        )
        sort_clause = get_sort_expression(sort_order, ContentRevisionRO, {"modified": "updated"})
        query = query.order_by(sort_clause)
        # INFO - 2021-08-17 - S.G. - Always add a sort on the revision id
        # in order to differenciate between revisions with the same modification date.
        if sort_order.is_asc:
            revision_id_sort_clause = ContentRevisionRO.revision_id.asc()
        else:
            revision_id_sort_clause = ContentRevisionRO.revision_id.desc()
        query = query.order_by(revision_id_sort_clause)
        if count:
            query = get_page(query, per_page=count, page=page_token or False)
            return query
        return Page(query.all())

    @property
    def version_number(self) -> int:
        return self.revision.version_number

    def get_first_comment(self) -> Optional["Content"]:
        try:
            return self.get_comments()[0]
        except IndexError:
            return None

    def get_last_comment_from(self, user: User) -> Optional["Content"]:
        # TODO - Make this more efficient
        last_comment_updated = None
        last_comment = None
        for comment in self.get_comments():
            if user.user_id == comment.owner.user_id:
                if not last_comment or last_comment_updated < comment.updated:
                    # take only the latest comment !
                    last_comment = comment
                    last_comment_updated = comment.updated

        return last_comment

    def get_previous_revision(self) -> "ContentRevisionRO":
        rev_ids = [revision.revision_id for revision in self.revisions]
        rev_ids.sort()

        if len(rev_ids) >= 2:
            revision_rev_id = rev_ids[-2]

            for revision in self.revisions:
                if revision.revision_id == revision_rev_id:
                    return revision

        return None

    def raw_content_as_raw_text(self) -> str:
        # 'html.parser' fixes a hanging bug
        # see http://stackoverflow.com/questions/12618567/problems-running-beautifulsoup4-within-apache-mod-python-django
        return BeautifulSoup(self.raw_content, "html.parser").text

    def get_allowed_content_types(self) -> List[TracimContentType]:
        types = []
        allowed_types = self.properties["allowed_content"]
        for type_label, is_allowed in allowed_types.items():
            if is_allowed:
                try:
                    types.append(content_type_list.get_one_by_slug(type_label))
                except ContentTypeNotExist:
                    # INFO - G.M - 2019-08-16 - allowed_content can contain not valid value if
                    # we do disable some app. we should ignore invalid value.
                    logger.warning(
                        self,
                        "{type_label} content_type doesn't seems to be a loaded content_type "
                        'but does exist in content_revision "{content_revision}" of content "{content_id}" allowed_content,'
                        "it will be ignored".format(
                            type_label=type_label,
                            content_revision=self.cached_revision_id,
                            content_id=self.content_id,
                        ),
                    )
        return types

    # TODO - G.M - 2020-09-29 - [Cleanup] Should probably be dropped, see issue #704
    def get_history(self, drop_empty_revision=False) -> List["VirtualEvent"]:
        events = []
        for comment in self.get_comments():
            events.append(VirtualEvent.create_from_content(comment))

        revisions = sorted(self.revisions, key=lambda rev: rev.revision_id)
        for revision in revisions:
            # INFO - G.M - 09-03-2018 - Do not show file revision with empty
            # file to have a more clear view of revision.
            # Some webdav client create empty file before uploading, we must
            # have possibility to not show the related revision
            if drop_empty_revision:
                if revision.depot_file and revision.depot_file.file.content_length == 0:
                    # INFO - G.M - 12-03-2018 -Always show the last and
                    # first revision.
                    if revision != revisions[-1] and revision != revisions[0]:
                        continue

            events.append(VirtualEvent.create_from_content_revision(revision))

        sorted_events = sorted(events, key=lambda event: event.created, reverse=True)
        return sorted_events

    @classmethod
    def format_path(cls, url_template: str, content: "Content") -> str:
        wid = content.workspace.workspace_id
        fid = content.parent_id  # May be None if no parent
        ctype = content.type
        cid = content.content_id
        return url_template.format(wid=wid, fid=fid, ctype=ctype, cid=cid)

    def get_tree_revisions(self) -> List[ContentRevisionRO]:
        """Get all revision sorted by id of content and all his children recursively"""
        revisions = []  # type: List[ContentRevisionRO]
        for revision in self.revisions:
            revisions.append(revision)
        for child in self.get_children(recursively=True):
            revisions.extend(child.revisions)
        revisions = sorted(revisions, key=lambda revision: revision.revision_id)
        return revisions

    def get_tree_revisions_advanced(self) -> List[ContentRevisionRO]:
        """Get all revision sorted by id of content and all his children recursively"""
        RevisionsData = namedtuple("revision_data", ["revision", "is_current_rev"])
        revisions_data = []
        for revision in self.revisions:
            is_current_rev = bool(revision == self.current_revision)
            revisions_data.append(RevisionsData(revision, is_current_rev))
        for child in self.get_children(recursively=True):
            for revision in child.revisions:
                is_current_rev = bool(revision == child.current_revision)
                revisions_data.append(RevisionsData(revision, is_current_rev))
        revisions_data = sorted(
            revisions_data, key=lambda revision_data: revision_data.revision.revision_id
        )
        return revisions_data


Index("idx__content__cached_revision_id", Content.cached_revision_id)


class RevisionReadStatus(DeclarativeBase):

    __tablename__ = "revision_read_status"

    revision_id = Column(
        Integer,
        ForeignKey("content_revisions.revision_id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True,
    )
    #  Default value datetime.utcnow, see: http://stackoverflow.com/a/13370382/801924 (or http://pastebin.com/VLyWktUn)
    view_datetime = Column(DateTime, unique=False, nullable=False, default=datetime.utcnow)

    content_revision = relationship(
        "ContentRevisionRO",
        backref=backref(
            "revision_read_statuses",
            collection_class=attribute_mapped_collection("user"),
            cascade="all, delete-orphan",
        ),
    )

    user = relationship("User")


# TODO - G.M - 2020-09-29 - [Cleanup] Should probably be dropped, see issue #704
class VirtualEvent(object):
    @classmethod
    def create_from(cls, object):
        if Content == object.__class__:
            return cls.create_from_content(object)
        elif ContentRevisionRO == object.__class__:
            return cls.create_from_content_revision(object)

    @classmethod
    def create_from_content(cls, content: Content):

        label = content.get_label()
        if content.type == content_type_list.Comment.slug:
            # TODO - G.M  - 10-04-2018 - [Cleanup] Remove label param
            # from this object ?
            # TODO - G.M - 2018-08-20 - [I18n] fix trad of this
            label = "<strong>{}</strong> wrote:".format(content.owner.get_display_name())

        return VirtualEvent(
            id=content.content_id,
            created=content.created,
            owner=content.owner,
            type=ActionDescription(content.revision_type),
            label=label,
            content=content.description,
            ref_object=content,
        )

    @classmethod
    def create_from_content_revision(cls, revision: ContentRevisionRO):
        action_description = ActionDescription(revision.revision_type)

        return VirtualEvent(
            id=revision.revision_id,
            created=revision.updated,
            owner=revision.owner,
            type=action_description,
            label=action_description.label,
            content="",
            ref_object=revision,
        )

    def __init__(self, id, created, owner, type, label, content, ref_object):
        self.id = id
        self.created = created
        self.owner = owner
        self.type = type
        self.label = label
        self.content = content
        self.ref_object = ref_object

        assert hasattr(type, "id")

    def created_as_delta(self, delta_from_datetime: datetime = None):
        if not delta_from_datetime:
            delta_from_datetime = datetime.utcnow()
        return format_timedelta(delta_from_datetime - self.created, locale=get_locale())

    def create_readable_date(self, delta_from_datetime: datetime = None):
        aff = ""

        if not delta_from_datetime:
            delta_from_datetime = datetime.utcnow()

        delta = delta_from_datetime - self.created

        if delta.days > 0:
            if delta.days >= 365:
                aff = "%d year%s ago" % (delta.days / 365, "s" if delta.days / 365 >= 2 else "")
            elif delta.days >= 30:
                aff = "%d month%s ago" % (delta.days / 30, "s" if delta.days / 30 >= 2 else "")
            else:
                aff = "%d day%s ago" % (delta.days, "s" if delta.days >= 2 else "")
        else:
            if delta.seconds < 60:
                aff = "%d second%s ago" % (delta.seconds, "s" if delta.seconds > 1 else "")
            elif delta.seconds / 60 < 60:
                aff = "%d minute%s ago" % (
                    delta.seconds / 60,
                    "s" if delta.seconds / 60 >= 2 else "",
                )
            else:
                aff = "%d hour%s ago" % (
                    delta.seconds / 3600,
                    "s" if delta.seconds / 3600 >= 2 else "",
                )

        return aff
