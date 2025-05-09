# coding=utf-8
import base64
import cgi
from datetime import datetime
from slugify import slugify
from sqlakeyset import Page
from sqlalchemy.orm import Session
from typing import Any
from typing import Dict
from typing import Generic
from typing import List
from typing import Optional
from typing import TypeVar

from tracim_backend.app_models.contents import ContentTypeSlug
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
from tracim_backend.lib.utils.utils import EmailUser
from tracim_backend.lib.utils.utils import WORKSPACE_FRONTEND_URL_SCHEMA
from tracim_backend.lib.utils.utils import core_convert_file_name_to_display
from tracim_backend.lib.utils.utils import get_frontend_ui_base_url
from tracim_backend.lib.utils.utils import string_to_list
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import ContentSortOrder
from tracim_backend.models.data import UserWorkspaceConfig
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.event import EventTypeDatabaseParameters
from tracim_backend.models.event import ReadStatus
from tracim_backend.models.favorites import FavoriteContent
from tracim_backend.models.roles import WorkspaceRoles


class AboutModel(object):
    def __init__(
        self,
        name: str,
        version: Optional[str],
        build_version: str,
        datetime: datetime,
        website: str,
        database_schema_version: Optional[str],
    ) -> None:
        self.name = name
        self.version = version
        self.build_version = build_version
        self.datetime = datetime
        self.website = website
        self.database_schema_version = database_schema_version


class ConfigModel(object):
    def __init__(
        self,
        email_notification_activated: bool,
        new_user_invitation_do_notify: bool,
        webdav_enabled: bool,
        translation_service__enabled: bool,
        webdav_url: str,
        collaborative_document_edition: CollaborativeDocumentEditionConfig,
        content_length_file_size_limit: int,
        workspace_size_limit: int,
        workspaces_number_per_user_limit: int,
        instance_name: str,
        email_required: bool,
        search_engine: str,
        translation_service__target_languages: List[Dict[str, str]],
        user__self_registration__enabled: bool,
        ui__spaces__creation__parent_space_choice__visible: bool,
        ui__notes__code_sample_languages: List[Dict[str, str]],
        limitation__maximum_online_users_message: str,
        call__enabled: bool,
        call__unanswered_timeout: int,
        auth_types: List[str],
        saml_idp_list: List[Dict[str, str]],
        user__read_only_fields: Dict[str, List[str]],
        app_custom_actions: Dict[str, List[Dict[str, Any]]],
        iframe_whitelist: List[str],
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
        self.search_engine = search_engine
        self.translation_service__enabled = translation_service__enabled
        self.translation_service__target_languages = translation_service__target_languages
        self.user__self_registration__enabled = user__self_registration__enabled
        self.ui__spaces__creation__parent_space_choice__visible = (
            ui__spaces__creation__parent_space_choice__visible
        )
        self.ui__notes__code_sample_languages = ui__notes__code_sample_languages
        self.limitation__maximum_online_users_message = limitation__maximum_online_users_message
        self.call__enabled = call__enabled
        self.call__unanswered_timeout = call__unanswered_timeout
        self.auth_types = auth_types
        self.saml_idp_list = saml_idp_list
        self.user__read_only_fields = user__read_only_fields
        self.app_custom_actions = app_custom_actions
        self.iframe_whitelist = iframe_whitelist


class ErrorCodeModel(object):
    def __init__(self, error_code: ErrorCode) -> None:
        self.name = error_code.name
        self.code = error_code.value


class PreviewAllowedDim(object):
    def __init__(self, restricted: bool, dimensions: List[PreviewDim]) -> None:
        self.restricted = restricted
        self.dimensions = dimensions


class UsageConditionModel(object):
    def __init__(self, title: str, url: str = None) -> None:
        self.title = title
        self.url = url


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
        self,
        reset_password_token: str,
        email: str,
        new_password: str,
        new_password2: str,
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

    def __init__(
        self,
        content_namespace: ContentNamespaces = ContentNamespaces.CONTENT,
        parent_id: int = 0,
        content_type: str = ContentTypeSlug.FILE.value,
        template_id: int = 0,
    ) -> None:
        self.parent_id = parent_id
        self.content_namespace = content_namespace
        self.content_type = content_type
        self.template_id = template_id


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
        self.email = EmailUser(email) if email else None
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


class ContentAndUserPath(object):
    """
    Paths params with content id and user_id
    """

    def __init__(self, content_id: int, user_id: int) -> None:
        self.content_id = content_id
        self.user_id = user_id


class RadicaleUserResourceUserSubitemsPath(object):
    def __init__(
        self,
        user_id: int,
        dest_user_id: int,
        type: str,
        sub_item: str = "",
        trailing_slash: str = "",
    ) -> None:
        self.user_id = user_id
        self.dest_user_id = dest_user_id
        self.type = type
        self.sub_item = sub_item
        self.trailing_slash = trailing_slash


class RadicaleUserResourceWorkspaceSubitemsPath(object):
    def __init__(
        self,
        user_id: int,
        workspace_id: int,
        type: str,
        sub_item: str = "",
        trailing_slash: str = "",
    ) -> None:
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.type = type
        self.sub_item = sub_item
        self.trailing_slash = trailing_slash


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


class ReactionPath(object):
    """
    Paths params with workspace id and content_id and reaction_id model
    """

    def __init__(self, workspace_id: int, content_id: int, reaction_id: int) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.reaction_id = reaction_id


class TagPath(object):
    """
    Paths params with workspace id and content_id and tag_id model
    """

    def __init__(self, workspace_id: int, tag_id: int, content_id: Optional[int] = None) -> None:
        self.workspace_id = workspace_id
        self.content_id = content_id
        self.tag_id = tag_id


class CommentPathFilename(object):
    """
    Paths params with workspace id and content_id and comment_id model
    and filename, useful to get preview/translation of a comment.
    """

    def __init__(self, workspace_id: int, content_id: int, comment_id: int, filename: str) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.comment_id = comment_id
        self.filename = filename


class KnownMembersQuery(object):
    """
    Member autocomplete query model
    """

    def __init__(
        self,
        acp: str = "",
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


class KnownContentsQuery(object):
    """
    Content autocomplete query model
    """

    def __init__(
        self,
        acp: str,
        limit: int = None,
    ) -> None:
        self.acp = acp
        self.limit = limit


class AgendaFilterQuery(object):
    """
    Agenda filter query model
    """

    def __init__(self, workspace_ids: str = "", agenda_types: str = "", resource_types: str = ""):
        self.workspace_ids = string_to_list(workspace_ids, ",", int) or None
        self.agenda_types = string_to_list(agenda_types, ",", str) or None
        self.resource_types = string_to_list(resource_types, ",", str) or None


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
        workspace_id: Optional[int] = None,
        complete_path_to_id: Optional[int] = None,
        parent_ids: Optional[str] = None,
        show_archived: Optional[int] = 0,
        show_deleted: Optional[int] = 0,
        show_active: Optional[int] = 1,
        content_type: Optional[str] = None,
        label: Optional[str] = None,
        limit: Optional[int] = None,
        namespaces_filter: Optional[str] = None,
        sort: Optional[ContentSortOrder] = None,
        page_token: Optional[str] = None,
        count: Optional[int] = None,
    ) -> None:
        self.parent_ids = string_to_list(parent_ids, ",", int)
        self.namespaces_filter = string_to_list(namespaces_filter, ",", ContentNamespaces)
        self.complete_path_to_id = complete_path_to_id
        self.workspace_id = workspace_id
        self.show_archived = bool(show_archived)
        self.show_deleted = bool(show_deleted)
        self.show_active = bool(show_active)
        self.limit = limit
        self.label = label
        self.content_type = content_type
        self.sort = sort or ContentSortOrder.LABEL_ASC
        self.page_token = page_token
        self.count = count


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
        self.user_email = EmailUser(user_email) if user_email else None
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
        publication_enabled: Optional[bool] = None,
    ) -> None:
        self.label = label
        self.description = description
        self.agenda_enabled = agenda_enabled
        self.public_upload_enabled = public_upload_enabled
        self.public_download_enabled = public_download_enabled
        self.default_user_role = None
        if default_user_role:
            self.default_user_role = WorkspaceRoles.get_role_from_slug(default_user_role)
        self.publication_enabled = publication_enabled


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
        publication_enabled: Optional[bool] = None,
    ) -> None:
        self.label = label
        self.description = description
        self.agenda_enabled = agenda_enabled
        self.public_upload_enabled = public_upload_enabled
        self.public_download_enabled = public_download_enabled
        self.access_type = WorkspaceAccessType(access_type)
        self.default_user_role = WorkspaceRoles.get_role_from_slug(default_user_role)
        self.parent_id = parent_id
        self.publication_enabled = publication_enabled


class ContentCreation(object):
    """
    Content creation model
    """

    def __init__(
        self,
        label: str,
        content_type: str,
        content_namespace: ContentNamespaces,
        parent_id: Optional[int] = None,
        template_id: Optional[int] = None,
    ) -> None:
        self.label = label
        self.content_type = content_type
        self.parent_id = parent_id or None
        self.content_namespace = content_namespace
        self.template_id = template_id


class CommentCreation(object):
    """
    Comment creation model
    """

    def __init__(self, raw_content: str) -> None:
        self.raw_content = raw_content


class ReactionCreation(object):
    """
    reaction creation model
    """

    def __init__(self, value: str) -> None:
        self.value = value


class TagCreation(object):
    """
    tag creation model
    """

    def __init__(self, tag_name: Optional[str] = None, tag_id: Optional[int] = None) -> None:
        self.tag_name = tag_name
        self.tag_id = tag_id


class SetContentStatus(object):
    """
    Set content status
    """

    def __init__(self, status: str) -> None:
        self.status = status


class SetContentIsTemplate(object):
    """
    Set the is_template property of a content.
    """

    def __init__(self, is_template: bool) -> None:
        self.is_template = is_template


class ContentUpdate(object):
    """
    Content update model
    """

    def __init__(
        self,
        label: Optional[str] = None,
        raw_content: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        self.label = label
        self.raw_content = raw_content
        self.description = description


class ContentNamespaceUpdate(object):
    """
    Content namespace update model
    """

    def __init__(
        self,
        content_namespace: str,
    ) -> None:
        self.content_namespace = content_namespace


class BasePaginatedQuery(object):
    """
    Base of paginated query
    """

    def __init__(self, count: int, page_token: Optional[str] = None) -> None:
        self.count = count
        self.page_token = page_token


class TranslationQuery:
    def __init__(
        self,
        source_language_code: str,
        target_language_code: str,
        force_download: int = 0,
    ):
        self.source_language_code = source_language_code
        self.target_language_code = target_language_code
        self.force_download = force_download


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


class UserMessagesMarkAsReadQuery(object):
    def __init__(
        self,
        content_ids: str = "",
        event_ids: str = "",
        parent_ids: str = "",
        space_ids: str = "",
    ):
        self.content_ids = string_to_list(content_ids, ",", int)
        self.event_ids = string_to_list(event_ids, ",", int)
        self.parent_ids = string_to_list(parent_ids, ",", int)
        self.space_ids = string_to_list(space_ids, ",", int)


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

    def __init__(
        self,
        label: Optional[str] = None,
        raw_content: Optional[str] = None,
        sub_content_types: Optional[List[str]] = None,
        description: Optional[str] = None,
    ) -> None:
        self.label = label
        self.raw_content = raw_content
        self.sub_content_types = sub_content_types
        self.description = description


class Agenda(object):
    def __init__(
        self,
        agenda_url: str,
        with_credentials: bool,
        workspace_id: Optional[int],
        agenda_type: str,
        resource_type: str,
    ) -> None:
        self.agenda_url = agenda_url
        self.with_credentials = with_credentials
        self.workspace_id = workspace_id
        self.agenda_type = agenda_type
        self.resource_type = resource_type


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
    def has_avatar(self) -> bool:
        return True

    @property
    def has_cover(self) -> bool:
        return bool(self.user.cover)

    @property
    def auth_type(self) -> str:
        return self.user.auth_type.value

    @property
    def allowed_space(self) -> int:
        return self.user.allowed_space

    @property
    def workspace_ids(self) -> List[int]:
        return self.user.workspace_ids

    @property
    def used_space(self) -> int:
        from tracim_backend.lib.core.workspace import WorkspaceApi

        wapi = WorkspaceApi(current_user=None, session=self.dbsession, config=self.config)
        return wapi.get_user_used_space(self.user)


class WorkspaceInContext(object):
    """
    Interface to get Workspace data and Workspace data related to context.
    """

    def __init__(
        self,
        workspace: Workspace,
        dbsession: Session,
        config: CFG,
        user: Optional[User] = None,
    ) -> None:
        self.workspace = workspace
        self.dbsession = dbsession
        self.config = config
        self.user = user

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

    @property
    def publication_enabled(self) -> bool:
        return self.workspace.publication_enabled

    @property
    def number_of_members(self) -> int:
        return (
            self.dbsession.query(UserWorkspaceConfig)
            .filter(UserWorkspaceConfig.workspace_id == self.workspace.workspace_id)
            .count()
        )


class UserWorkspaceConfigInContext(object):
    """
    Interface to get UserWorkspaceConfig data and related content

    """

    def __init__(
        self,
        user_role: UserWorkspaceConfig,
        dbsession: Session,
        config: CFG,
        # Extended params
        newly_created: bool = None,
    ) -> None:
        self.user_role = user_role
        self.dbsession = dbsession
        self.config = config
        # Extended params
        self.newly_created = newly_created

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
        can be anything from UserWorkspaceConfig SLUG, like
        'not_applicable', 'reader',
        'contributor', 'content-manager', 'workspace-manager'
        :return: user workspace role as slug.
        """
        return WorkspaceRoles.get_role_from_level(self.user_role.role).slug

    @property
    def is_active(self) -> bool:
        return self.user.is_active

    @property
    def email_notification_type(self) -> str:
        return self.user_role.email_notification_type.value

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
    def assignee_id(self) -> int:
        return self.content.assignee_id

    @property
    def assignee(self) -> UserInContext:
        return UserInContext(
            dbsession=self.dbsession, config=self.config, user=self.content.assignee
        )

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
        return self.content.content_namespace

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
    def parent_content_namespace(self) -> Optional[ContentNamespaces]:
        p = self.parent
        if p:
            return p.content_namespace
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
        return self.subcontent_in_context([ContentTypeSlug.COMMENT])

    @property
    def todos(self) -> List["ContentInContext"]:
        return self.subcontent_in_context([ContentTypeSlug.TODO])

    def subcontent_in_context(self, content_types):
        subcontents_in_context = []
        for subcontent in self.content.get_subcontents(content_types=content_types):
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
            subcontent_in_context = content_api.get_content_in_context(subcontent)
            subcontents_in_context.append(subcontent_in_context)
        return subcontents_in_context

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
    def is_template(self) -> bool:
        return self.content.is_template

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
        return self.content.raw_content

    @property
    def description(self) -> str:
        return self.content.description

    @property
    def author(self) -> UserInContext:
        return UserInContext(
            dbsession=self.dbsession,
            config=self.config,
            user=self.content.first_revision.owner,
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
            dbsession=self.dbsession,
            config=self.config,
            user=self.content.last_revision.owner,
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
                self.content.cached_revision_id,
                file_extension=self.content.file_extension,
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
            return len(self.raw_content)
        try:
            return self.content.depot_file.file.content_length
        except IOError:
            logger.warning(
                self,
                "IO Exception Occured when trying to get content size",
                exc_info=True,
            )
        except Exception:
            logger.warning(
                self,
                "Unknown Exception Occured when trying to get content size",
                exc_info=True,
            )
        # HACK - G.M - 2021-03-09 - properly handled the broken size case here to
        # avoid broken search (both simple and elasticsearch)
        # when broken content exist (content without valid depot file)
        # see #4267 for better solution.
        return 0

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

    @property
    def content_path(self) -> List["ContentInContext"]:
        return [
            ContentInContext(
                content=component,
                dbsession=self.dbsession,
                config=self.config,
                user=self._user,
            )
            for component in self.content.content_path
        ]

    @property
    def version_number(self) -> int:
        return self.content.version_number


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
        version_number: Optional[int] = None,
    ) -> None:
        assert content_revision is not None
        self.revision = content_revision
        self.dbsession = dbsession
        self.config = config
        self._user = user
        self._version_number = version_number

    # Default
    @property
    def assignee_id(self) -> int:
        return self.revision.assignee_id

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
    def is_template(self) -> bool:
        return self.revision.is_template

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
            content_id=self.revision.content_id, content_type=ContentTypeSlug.ANY.value
        )
        if content.cached_revision_id == self.revision_id:
            return content_api.is_editable(content)
        # INFO - G.M - 2018-11-02 - old revision are not editable
        return False

    @property
    def raw_content(self) -> str:
        return self.revision.raw_content

    @property
    def description(self) -> str:
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
                self,
                "IO Exception Occured when trying to get content size",
                exc_info=True,
            )
        except Exception:
            logger.warning(
                self,
                "Unknown Exception Occured when trying to get content size",
                exc_info=True,
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

    @property
    def version_number(self) -> int:
        return self._version_number or self.revision.version_number


class PaginatedObject(object):
    def __init__(self, page: Page, items: Optional[list] = None) -> None:
        self.items = items or page
        if page.paging:
            self.previous_page_token = page.paging.bookmark_previous
            self.next_page_token = page.paging.bookmark_next
            self.has_previous = page.paging.has_previous
            self.has_next = page.paging.has_next
            self.per_page = page.paging.per_page
        else:
            self.previous_page_token = ""
            self.next_page_token = ""
            self.has_previous = False
            self.has_next = False
            self.per_page = len(self.items)


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
        self,
        count: int,
        page_token: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> None:
        super().__init__(count=count, page_token=page_token)
        self.user_id = user_id


class AboutUser(object):
    def __init__(
        self,
        user_id: int,
        public_name: str,
        username: Optional[str],
        followers_count: int,
        leaders_count: int,
        created: datetime,
        authored_content_revisions_count: int,
        authored_content_revisions_space_count: int,
        has_avatar: bool,
        has_cover: bool,
    ) -> None:
        self.user_id = user_id
        self.public_name = public_name
        self.username = username
        self.followers_count = followers_count
        self.leaders_count = leaders_count
        self.created = created
        self.authored_content_revisions_count = authored_content_revisions_count
        self.authored_content_revisions_space_count = authored_content_revisions_space_count
        self.has_avatar = has_avatar
        self.has_cover = has_cover


class AuthoredContentRevisionsInfos:
    def __init__(self, revisions_count: int, revisions_space_count: int) -> None:
        self.count = revisions_count
        self.space_count = revisions_space_count


class FavoriteContentInContext:
    """
    Favorite Content objet for api, permitting to override content with the correct filter
    """

    def __init__(self, favorite_content: FavoriteContent, content: Content):
        self._favorite_content = favorite_content
        self._content = content

    @property
    def user_id(self) -> int:
        return self._favorite_content.user_id

    @property
    def content_id(self) -> int:
        return self._favorite_content.content_id

    @property
    def content(self) -> ContentInContext:
        # INFO - G.M - 2021-03-24 - Overriding the content of the favorite content in order to
        # handle access limitation here.
        return self._content

    @property
    def original_label(self) -> str:
        return self._favorite_content.original_label

    @property
    def original_type(self) -> str:
        return self._favorite_content.original_type
