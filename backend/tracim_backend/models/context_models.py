# coding=utf-8
import base64
import cgi
from datetime import datetime
from typing import Generic
from typing import List
from typing import Optional
from typing import TypeVar

from slugify import slugify
from sqlakeyset import Page
from sqlalchemy.orm import Session

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.workspace_menu_entries import WorkspaceMenuEntry
from tracim_backend.applications.collaborative_document_edition.models import (
    CollaborativeDocumentEditionConfig,
)
from tracim_backend.config import CFG
from tracim_backend.config import PreviewDim
from tracim_backend.error import ErrorCode
from tracim_backend.extensions import app_list
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.utils import CONTENT_FRONTEND_URL_SCHEMA
from tracim_backend.lib.utils.utils import WORKSPACE_FRONTEND_URL_SCHEMA
from tracim_backend.lib.utils.utils import core_convert_file_name_to_display
from tracim_backend.lib.utils.utils import get_frontend_ui_base_url
from tracim_backend.lib.utils.utils import string_to_list
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.event import EventTypeDatabaseParameters
from tracim_backend.models.event import ReadStatus
from tracim_backend.models.roles import WorkspaceRoles


class AboutModel(object):
    def __init__(
        self,
        name: str,
        version: Optional[str],
        build_version: str,
        datetime: datetime,
        website: str,
    ) -> None:
        self.name = name
        self.version = version
        self.build_version = build_version
        self.datetime = datetime
        self.website = website


class ConfigModel(object):
    def __init__(
        self,
        email_notification_activated: bool,
        new_user_invitation_do_notify: bool,
        webdav_enabled: bool,
        webdav_url: str,
        collaborative_document_edition: CollaborativeDocumentEditionConfig,
        content_length_file_size_limit: int,
        workspace_size_limit: int,
        workspaces_number_per_user_limit: int,
        instance_name: str,
        email_required: bool,
    ) -> None:
        self.email_notification_activated = email_notification_activated
        self.new_user_invitation_do_notify = new_user_invitation_do_notify
        self.webdav_enabled = webdav_enabled
        self.webdav_url = webdav_url
        self.collaborative_document_edition = collaborative_document_edition
        self.content_length_file_size_limit = content_length_file_size_limit
        self.workspace_size_limit = workspace_size_limit
        self.workspaces_number_per_user_limit = workspaces_number_per_user_limit
        self.instance_name = instance_name
        self.email_required = email_required


class ErrorCodeModel(object):
    def __init__(self, error_code: ErrorCode) -> None:
        self.name = error_code.name
        self.code = error_code.value


class PreviewAllowedDim(object):
    def __init__(self, restricted: bool, dimensions: List[PreviewDim]) -> None:
        self.restricted = restricted
        self.dimensions = dimensions


class MoveParams(object):
    """
    Json body params for move action model
    """

    def __init__(self, new_parent_id: str, new_workspace_id: str = None) -> None:
        self.new_parent_id = new_parent_id
        self.new_workspace_id = new_workspace_id


class LoginCredentials(object):
    """
    Login credentials model for login model
    """

    def __init__(
        self, password: str, email: Optional[str] = None, username: Optional[str] = None
    ) -> None:
        self.email = email
        self.username = username
        self.password = password


class ResetPasswordRequest(object):
    """
    Reset password : request to reset password of user
    """

    def __init__(self, email: Optional[str] = None, username: Optional[str] = None) -> None:
        self.email = email
        self.username = username


class ResetPasswordCheckToken(object):
    """
    Reset password : check reset password token
    """

    def __init__(self, reset_password_token: str, email: str) -> None:
        self.email = email
        self.reset_password_token = reset_password_token


class ResetPasswordModify(object):
    """
    Reset password : modification step
    """

    def __init__(
        self, reset_password_token: str, email: str, new_password: str, new_password2: str
    ) -> None:
        self.email = email
        self.reset_password_token = reset_password_token
        self.new_password = new_password
        self.new_password2 = new_password2


class SetEmail(object):
    """
    Just an email and password
    """

    def __init__(self, loggedin_user_password: str, email: str) -> None:
        self.loggedin_user_password = loggedin_user_password
        self.email = email


class SetUsername(object):
    """
    Just an username and password
    """

    def __init__(self, loggedin_user_password: str, username: str) -> None:
        self.loggedin_user_password = loggedin_user_password
        self.username = username


class SimpleFile(object):
    def __init__(self, files: cgi.FieldStorage = None) -> None:
        self.files = files


class FileCreation(object):
    """
    Simple parent_id object
    """

    def __init__(self, parent_id: int = 0) -> None:
        self.parent_id = parent_id


class SetPassword(object):
    """
    Just an password
    """

    def __init__(self, loggedin_user_password: str, new_password: str, new_password2: str) -> None:
        self.loggedin_user_password = loggedin_user_password
        self.new_password = new_password
        self.new_password2 = new_password2


class UserInfos(object):
    """
    Just some user infos
    """

    def __init__(
        self,
        timezone: str,
        lang: str,
        public_name: Optional[str] = None,
        username: Optional[str] = None,
    ) -> None:
        self.timezone = timezone
        self.public_name = public_name
        self.username = username
        self.lang = lang


class UserProfile(object):
    """
    Just some user infos
    """

    def __init__(self, profile: str) -> None:
        self.profile = profile


class UserAllowedSpace(object):
    """
    allowed space of user
    """

    def __init__(self, allowed_space: int) -> None:
        self.allowed_space = allowed_space


class UserCreation(object):
    """
    Just some user infos
    """

    def __init__(
        self,
        email: Optional[str] = None,
        password: Optional[str] = None,
        public_name: Optional[str] = None,
        username: Optional[str] = None,
        timezone: Optional[str] = None,
        profile: Optional[str] = None,
        lang: Optional[str] = None,
        email_notification: bool = True,
        allowed_space: Optional[int] = None,
    ) -> None:
        self.email = email
        # INFO - G.M - 2018-08-16 - cleartext password, default value
        # is auto-generated.
        self.password = password or None
        self.public_name = public_name or None
        self.username = username or None
        self.timezone = timezone or ""
        self.lang = lang or None
        self.profile = profile or None
        self.email_notification = email_notification
        self.allowed_space = allowed_space


class WorkspaceAndContentPath(object):
    """
    Paths params with workspace id and content_id model
    """

    def __init__(self, workspace_id: int, content_id: int) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id


class UserPicturePath(object):
    """
    Paths params with user id and filename model
    """

    def __init__(self, user_id: int, filename: str) -> None:
        self.user_id = user_id
        self.filename = filename


class UserPreviewPicturePath(object):
    """
    Paths params with user id and filename model + parameters for sized preview.
    """

    def __init__(self, user_id: int, filename: str, height: int, width: int) -> None:
        self.user_id = user_id
        self.filename = filename
        self.height = height
        self.width = width


class WorkspaceAndContentRevisionPath(object):
    """
    Paths params with workspace id and content_id model
    """

    def __init__(self, workspace_id: int, content_id: int, revision_id: int) -> None:
        self.content_id = content_id
        self.revision_id = revision_id
        self.workspace_id = workspace_id


class FilePath(object):
    def __init__(self, workspace_id: int, content_id: int, filename: str) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.filename = filename


class FileRevisionPath(object):
    def __init__(self, workspace_id: int, content_id: int, revision_id: int, filename: str) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.revision_id = revision_id
        self.filename = filename


class FilePreviewSizedPath(object):
    """
    Paths params with workspace id and content_id, width, heigth
    """

    def __init__(
        self, workspace_id: int, content_id: int, width: int, height: int, filename: str
    ) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.width = width
        self.height = height
        self.filename = filename


class RevisionPreviewSizedPath(object):
    """
    Paths params with workspace id and content_id, revision_id width, heigth
    """

    def __init__(
        self,
        workspace_id: int,
        content_id: int,
        revision_id: int,
        width: int,
        height: int,
        filename: str,
    ) -> None:
        self.content_id = content_id
        self.revision_id = revision_id
        self.workspace_id = workspace_id
        self.width = width
        self.height = height
        self.filename = filename


class WorkspacePath(object):
    """
    Paths params with workspace id and user_id
    """

    def __init__(self, workspace_id: int) -> None:
        self.workspace_id = workspace_id


class WorkspaceAndUserPath(object):
    """
    Paths params with workspace id and user_id
    """

    def __init__(self, workspace_id: int, user_id: int) -> None:
        self.workspace_id = workspace_id
        self.user_id = user_id


class RadicaleUserSubitemsPath(object):
    """
    Paths params with workspace id and subitem
    """

    def __init__(self, user_id: int, sub_item: str) -> None:
        self.user_id = user_id
        self.sub_item = sub_item


class RadicaleWorkspaceSubitemsPath(object):
    """
    Paths params with workspace id and subitem
    """

    def __init__(self, workspace_id: int, sub_item: str) -> None:
        self.workspace_id = workspace_id
        self.sub_item = sub_item


class UserWorkspaceAndContentPath(object):
    """
    Paths params with user_id, workspace id and content_id model
    """

    def __init__(self, user_id: int, workspace_id: int, content_id: int) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.user_id = user_id


class CommentPath(object):
    """
    Paths params with workspace id and content_id and comment_id model
    """

    def __init__(self, workspace_id: int, content_id: int, comment_id: int) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.comment_id = comment_id


class KnownMembersQuery(object):
    """
    Autocomplete query model
    """

    def __init__(
        self,
        acp: str,
        exclude_user_ids: str = None,
        exclude_workspace_ids: str = None,
        include_workspace_ids: str = None,
        limit: int = None,
    ) -> None:
        self.acp = acp
        self.exclude_user_ids = string_to_list(exclude_user_ids, ",", int)
        self.exclude_workspace_ids = string_to_list(exclude_workspace_ids, ",", int)
        self.include_workspace_ids = string_to_list(include_workspace_ids, ",", int)
        self.limit = limit


class AgendaFilterQuery(object):
    """
    Agenda filter query model
    """

    def __init__(self, workspace_ids: str = "", agenda_types: str = ""):
        self.workspace_ids = string_to_list(workspace_ids, ",", int) or None
        self.agenda_types = string_to_list(agenda_types, ",", str) or None


class FileQuery(object):
    """
    File query model
    """

    def __init__(self, force_download: int = 0) -> None:
        self.force_download = force_download


class PageQuery(object):
    """
    Page query model
    """

    def __init__(self, force_download: int = 0, page: int = 1) -> None:
        self.force_download = force_download
        self.page = page


class ContentFilter(object):
    """
    Content filter model
    """

    def __init__(
        self,
        workspace_id: int = None,
        complete_path_to_id: int = None,
        parent_ids: str = None,
        show_archived: int = 0,
        show_deleted: int = 0,
        show_active: int = 1,
        content_type: str = None,
        label: str = None,
        page_nb: int = None,
        limit: int = None,
        namespaces_filter: str = None,
    ) -> None:
        self.parent_ids = string_to_list(parent_ids, ",", int)
        self.namespaces_filter = string_to_list(namespaces_filter, ",", ContentNamespaces)
        self.complete_path_to_id = complete_path_to_id
        self.workspace_id = workspace_id
        self.show_archived = bool(show_archived)
        self.show_deleted = bool(show_deleted)
        self.show_active = bool(show_active)
        self.limit = limit
        self.page_nb = page_nb
        self.label = label
        self.content_type = content_type


class ActiveContentFilter(object):
    def __init__(self, limit: int = None, before_content_id: datetime = None) -> None:
        self.limit = limit
        self.before_content_id = before_content_id


class ContentIdsQuery(object):
    def __init__(self, content_ids: str = None) -> None:
        self.content_ids = string_to_list(content_ids, ",", int)


class RoleUpdate(object):
    """
    Update role
    """

    def __init__(self, role: str) -> None:
        self.role = WorkspaceRoles.get_role_from_slug(role)


class WorkspaceMemberInvitation(object):
    """
    Workspace Member Invitation
    """

    def __init__(
        self,
        user_id: int = None,
        user_email: str = None,
        user_username: str = None,
        role: str = None,
    ) -> None:
        self.role = role
        self.user_email = user_email
        self.user_username = user_username
        self.user_id = user_id


class WorkspaceUpdate(object):
    """
    Update workspace
    """

    def __init__(
        self,
        label: Optional[str] = None,
        description: Optional[str] = None,
        default_user_role: Optional[str] = None,
        agenda_enabled: Optional[bool] = None,
        public_upload_enabled: Optional[bool] = None,
        public_download_enabled: Optional[bool] = None,
    ) -> None:
        self.label = label
        self.description = description
        self.agenda_enabled = agenda_enabled
        self.public_upload_enabled = public_upload_enabled
        self.public_download_enabled = public_download_enabled
        self.default_user_role = None
        if default_user_role:
            self.default_user_role = WorkspaceRoles.get_role_from_slug(default_user_role)


class WorkspaceCreate(object):
    """
    Create workspace
    """

    def __init__(
        self,
        label: str,
        description: str,
        access_type: str,
        default_user_role: str,
        agenda_enabled: bool = True,
        public_upload_enabled: bool = True,
        public_download_enabled: bool = True,
        parent_id: Optional[int] = None,
    ) -> None:
        self.label = label
        self.description = description
        self.agenda_enabled = agenda_enabled
        self.public_upload_enabled = public_upload_enabled
        self.public_download_enabled = public_download_enabled
        self.access_type = WorkspaceAccessType(access_type)
        self.default_user_role = WorkspaceRoles.get_role_from_slug(default_user_role)
        self.parent_id = parent_id


class ContentCreation(object):
    """
    Content creation model
    """

    def __init__(self, label: str, content_type: str, parent_id: Optional[int] = None) -> None:
        self.label = label
        self.content_type = content_type
        self.parent_id = parent_id or None


class CommentCreation(object):
    """
    Comment creation model
    """

    def __init__(self, raw_content: str) -> None:
        self.raw_content = raw_content


class SetContentStatus(object):
    """
    Set content status
    """

    def __init__(self, status: str) -> None:
        self.status = status


class TextBasedContentUpdate(object):
    """
    TextBasedContent update model
    """

    def __init__(self, label: str, raw_content: str) -> None:
        self.label = label
        self.raw_content = raw_content


class BasePaginatedQuery(object):
    """
    Base of paginated query
    """

    def __init__(self, count: int, page_token: Optional[str] = None) -> None:
        self.count = count
        self.page_token = page_token


class LiveMessageQuery(BasePaginatedQuery):
    """
    Live Message query model
    """

    def __init__(
        self,
        read_status: str,
        count: int,
        include_event_types: Optional[List[EventTypeDatabaseParameters]] = None,
        exclude_event_types: Optional[List[EventTypeDatabaseParameters]] = None,
        page_token: Optional[str] = None,
        exclude_author_ids: str = "",
        workspace_ids: str = "",
        related_to_content_ids: str = "",
        include_not_sent: int = 0,
    ) -> None:
        super().__init__(count=count, page_token=page_token)
        self.read_status = ReadStatus(read_status)
        self.include_event_types = include_event_types
        self.exclude_event_types = exclude_event_types
        self.exclude_author_ids = string_to_list(exclude_author_ids, ",", int)
        self.workspace_ids = string_to_list(workspace_ids, ",", int)
        self.include_not_sent = bool(include_not_sent)
        self.related_to_content_ids = string_to_list(related_to_content_ids, ",", int)


class UserMessagesSummaryQuery(object):
    """
    Message summary query model
    """

    def __init__(
        self,
        include_event_types: Optional[List[EventTypeDatabaseParameters]] = None,
        exclude_event_types: Optional[List[EventTypeDatabaseParameters]] = None,
        exclude_author_ids: str = "",
        include_not_sent: int = 0,
        workspace_ids: str = "",
        related_to_content_ids: str = "",
    ) -> None:
        self.include_event_types = include_event_types
        self.exclude_event_types = exclude_event_types
        self.exclude_author_ids = string_to_list(exclude_author_ids, ",", int)
        self.include_not_sent = bool(include_not_sent)
        self.workspace_ids = string_to_list(workspace_ids, ",", int)
        self.related_to_content_ids = string_to_list(related_to_content_ids, ",", int)


class FolderContentUpdate(object):
    """
    Folder Content update model
    """

    def __init__(self, label: str, raw_content: str, sub_content_types: List[str]) -> None:
        self.label = label
        self.raw_content = raw_content
        self.sub_content_types = sub_content_types


class Agenda(object):
    def __init__(
        self, agenda_url: str, with_credentials: bool, workspace_id: Optional[int], agenda_type: str
    ) -> None:
        self.agenda_url = agenda_url
        self.with_credentials = with_credentials
        self.workspace_id = workspace_id
        self.agenda_type = agenda_type


class UserInContext(object):
    """
    Interface to get User data and User data related to context.
    """

    def __init__(self, user: User, dbsession: Session, config: CFG) -> None:
        self.user = user
        self.dbsession = dbsession
        self.config = config

    # Default

    @property
    def user_in_context(self) -> "UserInContext":
        return self

    @property
    def email(self) -> Optional[str]:
        return self.user.email

    @property
    def user_id(self) -> int:
        return self.user.user_id

    @property
    def public_name(self) -> Optional[str]:
        return self.display_name

    @property
    def username(self) -> Optional[str]:
        return self.user.username

    @property
    def display_name(self) -> Optional[str]:
        return self.user.display_name

    @property
    def created(self) -> datetime:
        return self.user.created

    @property
    def is_active(self) -> bool:
        return self.user.is_active

    @property
    def timezone(self) -> str:
        return self.user.timezone

    @property
    def lang(self) -> str:
        return self.user.lang

    @property
    def profile(self) -> Profile:
        return self.user.profile.slug

    @property
    def is_deleted(self) -> bool:
        return self.user.is_deleted

    # Context related

    @property
    def avatar_url(self) -> Optional[str]:
        return self.user.avatar_url

    @property
    def auth_type(self) -> str:
        return self.user.auth_type.value

    @property
    def allowed_space(self) -> int:
        return self.user.allowed_space

    @property
    def used_space(self) -> int:
        from tracim_backend.lib.core.workspace import WorkspaceApi

        wapi = WorkspaceApi(current_user=None, session=self.dbsession, config=self.config)
        return wapi.get_user_used_space(self.user)


class WorkspaceInContext(object):
    """
    Interface to get Workspace data and Workspace data related to context.
    """

    def __init__(self, workspace: Workspace, dbsession: Session, config: CFG) -> None:
        self.workspace = workspace
        self.dbsession = dbsession
        self.config = config

    @property
    def workspace_in_context(self) -> "WorkspaceInContext":
        return self

    @property
    def workspace_id(self) -> int:
        """
        numeric id of the workspace.
        """
        return self.workspace.workspace_id

    @property
    def access_type(self) -> str:
        """access type of the workspace"""
        return self.workspace.access_type.value

    @property
    def default_user_role(self) -> str:
        """default user role of the workspace"""
        return self.workspace.default_user_role.slug

    @property
    def id(self) -> int:
        """
        alias of workspace_id
        """
        return self.workspace_id

    @property
    def label(self) -> str:
        """
        get workspace label
        """
        return self.workspace.label

    @property
    def description(self) -> str:
        """
        get workspace description
        """
        return self.workspace.description

    @property
    def slug(self) -> str:
        """
        get workspace slug
        """
        return slugify(self.workspace.label)

    @property
    def is_deleted(self) -> bool:
        """
        Is the workspace deleted ?
        """
        return self.workspace.is_deleted

    @property
    def agenda_enabled(self) -> bool:
        """
        returns True if workspace's agenda is enabled
        """
        return self.workspace.agenda_enabled

    @property
    def public_download_enabled(self) -> bool:
        """
        returns True if public download is enabled in this workspace
        """
        return self.workspace.public_download_enabled

    @property
    def public_upload_enabled(self) -> bool:
        """
        returns True if public upload is enabled in this workspace
        """
        return self.workspace.public_upload_enabled

    @property
    def sidebar_entries(self) -> List[WorkspaceMenuEntry]:
        """
        get sidebar entries, those depends on activated apps.
        """
        # TODO - G.M - 22-05-2018 - Rework on this in
        # order to not use hardcoded list
        # list should be able to change (depending on activated/disabled
        # apps)
        app_api = ApplicationApi(app_list)
        return app_api.get_default_workspace_menu_entry(self.workspace, self.config)

    @property
    def frontend_url(self):
        root_frontend_url = get_frontend_ui_base_url(self.config)
        workspace_frontend_url = WORKSPACE_FRONTEND_URL_SCHEMA.format(
            workspace_id=self.workspace_id
        )
        return root_frontend_url + workspace_frontend_url

    @property
    def owner(self) -> Optional[UserInContext]:
        if self.workspace.owner:
            return UserInContext(
                dbsession=self.dbsession, config=self.config, user=self.workspace.owner
            )
        return None

    @property
    def created(self) -> datetime:
        return self.workspace.created

    @property
    def used_space(self) -> int:
        return self.workspace.get_size()

    @property
    def allowed_space(self) -> int:
        return self.config.LIMITATION__WORKSPACE_SIZE

    @property
    def parent_id(self) -> int:
        return self.workspace.parent_id


class UserRoleWorkspaceInContext(object):
    """
    Interface to get UserRoleInWorkspace data and related content

    """

    def __init__(
        self,
        user_role: UserRoleInWorkspace,
        dbsession: Session,
        config: CFG,
        # Extended params
        newly_created: bool = None,
        email_sent: bool = None,
    ) -> None:
        self.user_role = user_role
        self.dbsession = dbsession
        self.config = config
        # Extended params
        self.newly_created = newly_created
        self.email_sent = email_sent

    @property
    def user_id(self) -> int:
        """
        User who has the role has this id
        :return: user id as integer
        """
        return self.user_role.user_id

    @property
    def workspace_id(self) -> int:
        """
        This role apply only on the workspace with this workspace_id
        :return: workspace id as integer
        """
        return self.user_role.workspace_id

    # TODO - G.M - 23-05-2018 - Check the API spec for this this !

    @property
    def role_id(self) -> int:
        """
        role as int id, each value refer to a different role.
        """
        return self.user_role.role

    @property
    def role(self) -> str:
        return self.role_slug

    @property
    def role_slug(self) -> str:
        """
        simple name of the role of the user.
        can be anything from UserRoleInWorkspace SLUG, like
        'not_applicable', 'reader',
        'contributor', 'content-manager', 'workspace-manager'
        :return: user workspace role as slug.
        """
        return WorkspaceRoles.get_role_from_level(self.user_role.role).slug

    @property
    def is_active(self) -> bool:
        return self.user.is_active

    @property
    def do_notify(self) -> bool:
        return self.user_role.do_notify

    @property
    def user(self) -> UserInContext:
        """
        User who has this role, with context data
        :return: UserInContext object
        """
        return UserInContext(self.user_role.user, self.dbsession, self.config)

    @property
    def workspace(self) -> WorkspaceInContext:
        """
        Workspace related to this role, with his context data
        :return: WorkspaceInContext object
        """
        return WorkspaceInContext(self.user_role.workspace, self.dbsession, self.config)


class ContentInContext(object):
    """
    Interface to get Content data and Content data related to context.
    """

    def __init__(
        self, content: Content, dbsession: Session, config: CFG, user: User = None
    ) -> None:
        self.content = content
        self.dbsession = dbsession
        self.config = config
        self._user = user

    # Default
    @property
    def content_id(self) -> int:
        return self.content.content_id

    @property
    def parent_id(self) -> int:
        """
        Return parent_id of the content
        """
        return self.content.parent_id

    @property
    def workspace_id(self) -> int:
        return self.content.workspace_id

    @property
    def workspace(self) -> Workspace:
        return self.content.workspace

    @property
    def content_namespace(self) -> ContentNamespaces:
        return self.content.content_namespace.value

    @property
    def parent(self) -> Optional["ContentInContext"]:
        if self.content.parent:
            from tracim_backend.lib.core.content import ContentApi

            content_api = ContentApi(
                current_user=self._user,
                session=self.dbsession,
                config=self.config,
                show_deleted=True,
                show_archived=True,
                show_active=True,
                show_temporary=True,
            )
            return content_api.get_content_in_context(self.content.parent)
        return None

    @property
    def parent_content_type(self) -> Optional[str]:
        p = self.parent
        if p:
            return p.content_type
        return None

    @property
    def parent_label(self) -> Optional[str]:
        p = self.parent
        if p:
            return p.label
        return None

    @property
    def parents(self) -> List["ContentInContext"]:
        parents = []
        if self.parent:
            parents.append(self.parent)
            parent = self.parent
            while parent.parent is not None:
                parents.append(parent.parent)
                parent = parent.parent
        return parents

    @property
    def comments(self) -> List["ContentInContext"]:
        comments_in_context = []
        for comment in self.content.get_comments():
            from tracim_backend.lib.core.content import ContentApi

            content_api = ContentApi(
                current_user=self._user,
                session=self.dbsession,
                config=self.config,
                show_deleted=True,
                show_archived=True,
                show_active=True,
                show_temporary=True,
            )
            comment_in_context = content_api.get_content_in_context(comment)
            comments_in_context.append(comment_in_context)
        return comments_in_context

    @property
    def label(self) -> str:
        return self.content.label

    @property
    def content_type(self) -> str:
        content_type = content_type_list.get_one_by_slug(self.content.type)
        return content_type.slug

    @property
    def sub_content_types(self) -> List[str]:
        return [_type.slug for _type in self.content.get_allowed_content_types()]

    @property
    def status(self) -> str:
        return self.content.status

    @property
    def is_archived(self) -> bool:
        return self.content.is_archived

    @property
    def archived_through_parent_id(self) -> Optional[int]:
        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user,
            session=self.dbsession,
            config=self.config,
            show_deleted=True,
            show_archived=True,
            show_active=True,
            show_temporary=True,
        )
        return content_api.get_archived_parent_id(self.content)

    @property
    def is_deleted(self) -> bool:
        return self.content.is_deleted

    @property
    def deleted_through_parent_id(self) -> Optional[int]:
        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user,
            session=self.dbsession,
            config=self.config,
            show_deleted=True,
            show_archived=True,
            show_active=True,
            show_temporary=True,
        )
        return content_api.get_deleted_parent_id(self.content)

    @property
    def is_active(self) -> bool:
        return self.content.is_active

    @property
    def is_editable(self) -> bool:
        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user,
            session=self.dbsession,
            config=self.config,
            show_deleted=True,
            show_archived=True,
            show_active=True,
            show_temporary=True,
        )
        return content_api.is_editable(self.content)

    @property
    def raw_content(self) -> str:
        return self.content.description

    @property
    def author(self) -> UserInContext:
        return UserInContext(
            dbsession=self.dbsession, config=self.config, user=self.content.first_revision.owner
        )

    @property
    def current_revision_id(self) -> int:
        return self.content.cached_revision_id

    @property
    def current_revision_type(self) -> int:
        return self.content.current_revision.revision_type

    @property
    def created(self) -> datetime:
        return self.content.created

    @property
    def modified(self) -> datetime:
        return self.updated

    @property
    def updated(self) -> datetime:
        return self.content.updated

    @property
    def last_modifier(self) -> UserInContext:
        return UserInContext(
            dbsession=self.dbsession, config=self.config, user=self.content.last_revision.owner
        )

    # Context-related
    @property
    def show_in_ui(self) -> bool:
        # TODO - G.M - 31-05-2018 - Enable Show_in_ui params
        # if false, then do not show content in the treeview.
        # This may his maybe used for specific contents or for sub-contents.
        # Default is True.
        # In first version of the API, this field is always True
        return True

    @property
    def slug(self) -> str:
        return slugify(self.content.label)

    @property
    def read_by_user(self) -> bool:
        assert self._user
        return not self.content.has_new_information_for(self._user)

    @property
    def frontend_url(self) -> str:
        root_frontend_url = get_frontend_ui_base_url(self.config)
        content_frontend_url = CONTENT_FRONTEND_URL_SCHEMA.format(
            workspace_id=self.workspace_id,
            content_type=self.content_type,
            content_id=self.content_id,
        )
        return root_frontend_url + content_frontend_url

    # file specific
    @property
    def page_nb(self) -> Optional[int]:
        """
        :return: page_nb of content if available, None if unavailable
        """
        if self.content.depot_file and self.content.cached_revision_id is not None:
            from tracim_backend.lib.core.content import ContentApi

            content_api = ContentApi(
                current_user=self._user,
                session=self.dbsession,
                config=self.config,
                show_deleted=True,
                show_archived=True,
                show_active=True,
                show_temporary=True,
            )
            return content_api.get_preview_page_nb(
                self.content.cached_revision_id, file_extension=self.content.file_extension
            )
        else:
            return None

    @property
    def mimetype(self) -> str:
        """
        :return: mimetype of content if available, None if unavailable
        """
        return self.content.file_mimetype

    @property
    def size(self) -> Optional[int]:
        """
        :return: size of content if available, None if unavailable
        """
        if not self.content.depot_file:
            return None
        try:
            return self.content.depot_file.file.content_length
        except IOError:
            logger.warning(
                self, "IO Exception Occured when trying to get content size", exc_info=True
            )
        except Exception:
            logger.warning(
                self, "Unknown Exception Occured when trying to get content size", exc_info=True
            )
        return None

    @property
    def has_pdf_preview(self) -> bool:
        """
        :return: bool about if pdf version of content is available
        """
        if not self.content.depot_file or self.content.cached_revision_id is None:
            return False

        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user,
            session=self.dbsession,
            config=self.config,
            show_deleted=True,
            show_archived=True,
            show_active=True,
            show_temporary=True,
        )
        return content_api.has_pdf_preview(
            self.content.cached_revision_id, file_extension=self.content.file_extension
        )

    @property
    def has_jpeg_preview(self) -> bool:
        """
        :return: bool about if jpeg version of content is available
        """
        if not self.content.depot_file or self.content.cached_revision_id is None:
            return False

        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user,
            session=self.dbsession,
            config=self.config,
            show_deleted=True,
            show_archived=True,
            show_active=True,
            show_temporary=True,
        )
        return content_api.has_jpeg_preview(
            self.content.cached_revision_id, file_extension=self.content.file_extension
        )

    @property
    def file_extension(self) -> str:
        """
        :return: file extension with "." at the beginning, example : .txt
        """
        return self.content.file_extension

    @property
    def filename(self) -> str:
        """
        :return: complete filename with both label and file extension part
        """
        return core_convert_file_name_to_display(self.content.file_name)

    def get_b64_file(self) -> Optional[str]:
        if self.content.depot_file:
            return base64.b64encode(self.content.depot_file.file.read()).decode("ascii")
        return None

    @property
    def actives_shares(self) -> int:
        # TODO - G.M - 2019-08-12 - handle case where share app is not enabled, by
        # not starting it there. see #2189
        from tracim_backend.applications.share.lib import ShareLib

        api = ShareLib(config=self.config, session=self.dbsession, current_user=self._user)
        return len(api.get_content_shares(self.content))


class RevisionInContext(object):
    """
    Interface to get Content data and Content data related to context.
    """

    def __init__(
        self,
        content_revision: ContentRevisionRO,
        dbsession: Session,
        config: CFG,
        user: User = None,
    ) -> None:
        assert content_revision is not None
        self.revision = content_revision
        self.dbsession = dbsession
        self.config = config
        self._user = user

    # Default
    @property
    def content_id(self) -> int:
        return self.revision.content_id

    @property
    def parent_id(self) -> int:
        """
        Return parent_id of the content
        """
        return self.revision.parent_id

    @property
    def workspace_id(self) -> int:
        return self.revision.workspace_id

    @property
    def label(self) -> str:
        return self.revision.label

    @property
    def revision_type(self) -> str:
        return self.revision.revision_type

    @property
    def content_type(self) -> str:
        return content_type_list.get_one_by_slug(self.revision.type).slug

    @property
    def sub_content_types(self) -> List[str]:
        return [_type.slug for _type in self.revision.node.get_allowed_content_types()]

    @property
    def status(self) -> str:
        return self.revision.status

    @property
    def is_archived(self) -> bool:
        return self.revision.is_archived

    @property
    def is_deleted(self) -> bool:
        return self.revision.is_deleted

    @property
    def is_editable(self) -> bool:
        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user,
            session=self.dbsession,
            config=self.config,
            show_deleted=True,
            show_archived=True,
            show_active=True,
            show_temporary=True,
        )
        # INFO - G.M - 2018-11-02 - check if revision is last one and if it is,
        # return editability of content.
        content = content_api.get_one(
            content_id=self.revision.content_id, content_type=content_type_list.Any_SLUG
        )
        if content.cached_revision_id == self.revision_id:
            return content_api.is_editable(content)
        # INFO - G.M - 2018-11-02 - old revision are not editable
        return False

    @property
    def raw_content(self) -> str:
        return self.revision.description

    @property
    def author(self) -> UserInContext:
        return UserInContext(dbsession=self.dbsession, config=self.config, user=self.revision.owner)

    @property
    def revision_id(self) -> int:
        return self.revision.revision_id

    @property
    def created(self) -> datetime:
        return self.updated

    @property
    def modified(self) -> datetime:
        return self.updated

    @property
    def updated(self) -> datetime:
        return self.revision.updated

    @property
    def next_revision(self) -> Optional[ContentRevisionRO]:
        """
        Get next revision (later revision)
        :return: next_revision
        """
        revisions = self.revision.node.revisions
        # INFO - G.M - 2018-06-177 - Get revisions more recent that
        # current one
        next_revisions = [
            revision for revision in revisions if revision.revision_id > self.revision.revision_id
        ]
        if next_revisions:
            # INFO - G.M - 2018-06-177 -sort revisions by date
            sorted_next_revisions = sorted(next_revisions, key=lambda revision: revision.updated)
            # INFO - G.M - 2018-06-177 - return only next revision
            return sorted_next_revisions[0]
        else:
            return None

    @property
    def comment_ids(self) -> List[int]:
        """
        Get list of ids of all current revision related comments
        :return: list of comments ids
        """
        comments = self.revision.node.get_comments()
        # INFO - G.M - 2018-06-177 - Get comments more recent than revision.
        revision_comments = [
            comment
            for comment in comments
            if comment.created > self.revision.updated
            or comment.first_revision.revision_id > self.revision.revision_id
        ]
        if self.next_revision:
            # INFO - G.M - 2018-06-177 - if there is a revision more recent
            # than current remove comments from theses rev (comments older
            # than next_revision.)
            revision_comments = [
                comment
                for comment in revision_comments
                if comment.created <= self.next_revision.updated
                or comment.first_revision.revision_id <= self.next_revision.revision_id
            ]
        sorted_revision_comments = sorted(
            revision_comments, key=lambda revision: revision.revision_id
        )
        comment_ids = []
        for comment in sorted_revision_comments:
            comment_ids.append(comment.content_id)
        return comment_ids

    # Context-related
    @property
    def show_in_ui(self) -> bool:
        # TODO - G.M - 31-05-2018 - Enable Show_in_ui params
        # if false, then do not show content in the treeview.
        # This may his maybe used for specific contents or for sub-contents.
        # Default is True.
        # In first version of the API, this field is always True
        return True

    @property
    def slug(self) -> str:
        return slugify(self.revision.label)

    # file specific
    @property
    def page_nb(self) -> Optional[int]:
        """
        :return: page_nb of content if available, None if unavailable
        """
        if self.revision.depot_file:
            # TODO - G.M - 2018-09-05 - Fix circular import better
            from tracim_backend.lib.core.content import ContentApi

            content_api = ContentApi(
                current_user=self._user,
                session=self.dbsession,
                config=self.config,
                show_deleted=True,
                show_archived=True,
                show_active=True,
                show_temporary=True,
            )
            return content_api.get_preview_page_nb(
                self.revision.revision_id, file_extension=self.revision.file_extension
            )
        else:
            return None

    @property
    def mimetype(self) -> str:
        """
        :return: mimetype of content if available, None if unavailable
        """
        return self.revision.file_mimetype

    @property
    def size(self) -> Optional[int]:
        """
        :return: size of content if available, None if unavailable
        """
        if not self.revision.depot_file:
            return None
        try:
            return self.revision.depot_file.file.content_length
        except IOError:
            logger.warning(
                self, "IO Exception Occured when trying to get content size", exc_info=True
            )
        except Exception:
            logger.warning(
                self, "Unknown Exception Occured when trying to get content size", exc_info=True
            )
        return None

    @property
    def has_pdf_preview(self) -> bool:
        """
        :return: bool about if pdf version of content is available
        """
        if not self.revision.depot_file:
            return False

        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user,
            session=self.dbsession,
            config=self.config,
            show_deleted=True,
            show_archived=True,
            show_active=True,
            show_temporary=True,
        )
        return content_api.has_pdf_preview(
            self.revision.revision_id, file_extension=self.revision.file_extension
        )

    @property
    def has_jpeg_preview(self) -> bool:
        """
        :return: bool about if jpeg version of content is available
        """
        if not self.revision.depot_file:
            return False

        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user,
            session=self.dbsession,
            config=self.config,
            show_deleted=True,
            show_archived=True,
            show_active=True,
            show_temporary=True,
        )
        return content_api.has_jpeg_preview(
            self.revision.revision_id, file_extension=self.revision.file_extension
        )

    @property
    def file_extension(self) -> str:
        """
        :return: file extension with "." at the beginning, example : .txt
        """
        return self.revision.file_extension

    @property
    def filename(self) -> str:
        """
        :return: complete filename with both label and file extension part
        """
        return core_convert_file_name_to_display(self.revision.file_name)


class PaginatedObject(object):
    def __init__(self, page: Page) -> None:
        self.previous_page_token = page.paging.bookmark_previous
        self.next_page_token = page.paging.bookmark_next
        self.has_previous = page.paging.has_previous
        self.has_next = page.paging.has_next
        self.per_page = page.paging.per_page
        self.items = page


T = TypeVar("T")


class ListItemsObject(Generic[T]):
    def __init__(self, items: List[T]) -> None:
        self.items = items


class UserMessagesSummary(object):
    def __init__(self, user: UserInContext, read_messages_count: int, unread_messages_count: int):
        self.read_messages_count = read_messages_count
        self.unread_messages_count = unread_messages_count
        self.messages_count = self.unread_messages_count + self.read_messages_count
        self.user = user

    @property
    def user_id(self) -> int:
        return self.user.user_id


class UserFollowQuery(BasePaginatedQuery):
    """
    User following query model
    """

    def __init__(
        self, count: int, page_token: Optional[str] = None, user_id: Optional[int] = None
    ) -> None:
        super().__init__(count=count, page_token=page_token)
        self.user_id = user_id


class AboutUser(object):
    def __init__(
        self,
        public_name: str,
        username: Optional[str],
        followers_count: int,
        leaders_count: int,
        authored_content_revisions_count: int,
        authored_content_revisions_space_count: int,
    ) -> None:
        self.public_name = public_name
        self.username = username
        self.followers_count = followers_count
        self.leaders_count = leaders_count
        self.authored_content_revisions_count = authored_content_revisions_count
        self.authored_content_revisions_space_count = authored_content_revisions_space_count


class AuthoredContentRevisionsInfos:
    def __init__(self, revisions_count: int, revisions_space_count: int) -> None:
        self.count = revisions_count
        self.space_count = revisions_space_count
