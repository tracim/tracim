# coding=utf-8
import cgi
import typing
from datetime import datetime
from enum import Enum

from slugify import slugify
from sqlalchemy.orm import Session

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.workspace_menu_entries import WorkspaceMenuEntry
from tracim_backend.config import CFG
from tracim_backend.config import PreviewDim
from tracim_backend.extensions import app_list
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.utils.utils import CONTENT_FRONTEND_URL_SCHEMA
from tracim_backend.lib.utils.utils import WORKSPACE_FRONTEND_URL_SCHEMA
from tracim_backend.lib.utils.utils import get_frontend_ui_base_url
from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.models import User
from tracim_backend.models.auth import Group
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.roles import WorkspaceRoles


class AboutModel(object):

    def __init__(
        self,
        name: str,
        version: typing.Optional[str],
        datetime: datetime,
        website: str,
    ) -> None:
        self.name = name
        self.version = version
        self.datetime = datetime
        self.website = website


class ConfigModel(object):

    def __init__(
        self,
        email_notification_activated: bool
    ) -> None:
        self.email_notification_activated = email_notification_activated


class PreviewAllowedDim(object):

    def __init__(
            self,
            restricted: bool,
            dimensions: typing.List[PreviewDim]
    ) -> None:
        self.restricted = restricted
        self.dimensions = dimensions


class MoveParams(object):
    """
    Json body params for move action model
    """
    def __init__(self, new_parent_id: str, new_workspace_id: str = None) -> None:  # nopep8
        self.new_parent_id = new_parent_id
        self.new_workspace_id = new_workspace_id


class LoginCredentials(object):
    """
    Login credentials model for login model
    """

    def __init__(self, email: str, password: str) -> None:
        self.email = email
        self.password = password


class ResetPasswordRequest(object):
    """
    Reset password : request to reset password of user
    """
    def __init__(self, email: str) -> None:
        self.email = email


class ResetPasswordCheckToken(object):
    """
    Reset password : check reset password token
    """
    def __init__(
        self,
        reset_password_token: str,
        email: str,
    ) -> None:
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
        new_password2: str
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


class SimpleFile(object):
    def __init__(self, files: cgi.FieldStorage) -> None:
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
    def __init__(
        self,
        loggedin_user_password: str,
        new_password: str,
        new_password2: str
    ) -> None:
        self.loggedin_user_password = loggedin_user_password
        self.new_password = new_password
        self.new_password2 = new_password2


class UserInfos(object):
    """
    Just some user infos
    """
    def __init__(self, timezone: str, public_name: str, lang: str) -> None:
        self.timezone = timezone
        self.public_name = public_name
        self.lang = lang


class UserProfile(object):
    """
    Just some user infos
    """
    def __init__(self, profile: str) -> None:
        self.profile = profile


class UserCreation(object):
    """
    Just some user infos
    """
    def __init__(
            self,
            email: str,
            password: str = None,
            public_name: str = None,
            timezone: str = None,
            profile: str = None,
            lang: str = None,
            email_notification: bool = True,
    ) -> None:
        self.email = email
        # INFO - G.M - 2018-08-16 - cleartext password, default value
        # is auto-generated.
        self.password = password or password_generator()
        self.public_name = public_name or None
        self.timezone = timezone or ''
        self.lang = lang or None
        self.profile = profile or Group.TIM_USER_GROUPNAME
        self.email_notification = email_notification


class WorkspaceAndContentPath(object):
    """
    Paths params with workspace id and content_id model
    """
    def __init__(self, workspace_id: int, content_id: int) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id


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
    def __init__(self, workspace_id: int, content_id: int, width: int, height: int, filename: str) -> None:  # nopep8
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.width = width
        self.height = height
        self.filename = filename


class RevisionPreviewSizedPath(object):
    """
    Paths params with workspace id and content_id, revision_id width, heigth
    """
    def __init__(self, workspace_id: int, content_id: int, revision_id: int, width: int, height: int, filename: str) -> None:  # nopep8
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


class UserWorkspaceAndContentPath(object):
    """
    Paths params with user_id, workspace id and content_id model
    """
    def __init__(self, user_id: int, workspace_id: int, content_id: int) -> None:  # nopep8
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.user_id = user_id


class CommentPath(object):
    """
    Paths params with workspace id and content_id and comment_id model
    """
    def __init__(
        self,
        workspace_id: int,
        content_id: int,
        comment_id: int
    ) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.comment_id = comment_id


class KnownMemberQuery(object):
    """
    Autocomplete query model
    """
    def __init__(
            self,
            acp: str,
            exclude_user_ids: typing.List[int] = None,
            exclude_workspace_ids: typing.List[int] = None
    ) -> None:
        self.acp = acp
        self.exclude_user_ids = exclude_user_ids or []  # DFV
        self.exclude_workspace_ids = exclude_workspace_ids or []  # DFV



class FileQuery(object):
    """
    File query model
    """
    def __init__(
        self,
        force_download: int = 0,
    ) -> None:
        self.force_download = force_download


class PageQuery(object):
    """
    Page query model
    """
    def __init__(
            self,
            force_download: int = 0,
            page: int = 1
    ) -> None:
        self.force_download = force_download
        self.page = page


class ContentFilter(object):
    """
    Content filter model
    """
    def __init__(
            self,
            workspace_id: int = None,
            parent_id: int = None,
            show_archived: int = 0,
            show_deleted: int = 0,
            show_active: int = 1,
            content_type: str = None,
            label: str = None,
            offset: int = None,
            limit: int = None,
    ) -> None:
        self.parent_id = parent_id
        self.workspace_id = workspace_id
        self.show_archived = bool(show_archived)
        self.show_deleted = bool(show_deleted)
        self.show_active = bool(show_active)
        self.limit = limit
        self.offset = offset
        self.label = label
        self.content_type = content_type


class ActiveContentFilter(object):
    def __init__(
            self,
            limit: int = None,
            before_content_id: datetime = None,
    ) -> None:
        self.limit = limit
        self.before_content_id = before_content_id


class ContentIdsQuery(object):
    def __init__(
            self,
            contents_ids: typing.List[int] = None,
    ) -> None:
        self.contents_ids = contents_ids


class RoleUpdate(object):
    """
    Update role
    """
    def __init__(
        self,
        role: str,
    ) -> None:
        self.role = role


class WorkspaceMemberInvitation(object):
    """
    Workspace Member Invitation
    """
    def __init__(
        self,
        user_id: int = None,
        user_email: str = None,
        user_public_name: str = None,
        role: str = None,
    ) -> None:
        self.role = role
        self.user_email = user_email
        self.user_public_name = user_public_name
        self.user_id = user_id


class WorkspaceUpdate(object):
    """
    Update workspace
    """
    def __init__(
        self,
        label: str,
        description: str,
    ) -> None:
        self.label = label
        self.description = description


class ContentCreation(object):
    """
    Content creation model
    """
    def __init__(
        self,
        label: str,
        content_type: str,
        parent_id: typing.Optional[int] = None,
    ) -> None:
        self.label = label
        self.content_type = content_type
        self.parent_id = parent_id or None


class CommentCreation(object):
    """
    Comment creation model
    """
    def __init__(
        self,
        raw_content: str,
    ) -> None:
        self.raw_content = raw_content


class SetContentStatus(object):
    """
    Set content status
    """
    def __init__(
        self,
        status: str,
    ) -> None:
        self.status = status


class TextBasedContentUpdate(object):
    """
    TextBasedContent update model
    """
    def __init__(
        self,
        label: str,
        raw_content: str,
    ) -> None:
        self.label = label
        self.raw_content = raw_content


class FolderContentUpdate(object):
    """
    Folder Content update model
    """
    def __init__(
        self,
        label: str,
        raw_content: str,
        sub_content_types: typing.List[str],
    ) -> None:
        self.label = label
        self.raw_content = raw_content
        self.sub_content_types = sub_content_types


class TypeUser(Enum):
    """Params used to find user"""
    USER_ID = 'found_id'
    EMAIL = 'found_email'
    PUBLIC_NAME = 'found_public_name'


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
    def email(self) -> str:
        return self.user.email

    @property
    def user_id(self) -> int:
        return self.user.user_id

    @property
    def public_name(self) -> str:
        return self.display_name

    @property
    def display_name(self) -> str:
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
        return self.user.profile.name

    @property
    def is_deleted(self) -> bool:
        return self.user.is_deleted

    # Context related

    @property
    def calendar_url(self) -> typing.Optional[str]:
        # TODO - G-M - 20-04-2018 - [Calendar] Replace calendar code to get
        # url calendar url.
        #
        # from tracim.lib.calendar import CalendarManager
        # calendar_manager = CalendarManager(None)
        # return calendar_manager.get_workspace_calendar_url(self.workspace_id)
        return None

    @property
    def avatar_url(self) -> typing.Optional[str]:
        # TODO - G-M - 20-04-2018 - [Avatar] Add user avatar feature
        return None


class WorkspaceInContext(object):
    """
    Interface to get Workspace data and Workspace data related to context.
    """

    def __init__(self, workspace: Workspace, dbsession: Session, config: CFG) -> None:  # nopep8
        self.workspace = workspace
        self.dbsession = dbsession
        self.config = config

    @property
    def workspace_id(self) -> int:
        """
        numeric id of the workspace.
        """
        return self.workspace.workspace_id

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
    def sidebar_entries(self) -> typing.List[WorkspaceMenuEntry]:
        """
        get sidebar entries, those depends on activated apps.
        """
        # TODO - G.M - 22-05-2018 - Rework on this in
        # order to not use hardcoded list
        # list should be able to change (depending on activated/disabled
        # apps)
        app_api = ApplicationApi(
            app_list
        )
        return app_api.get_default_workspace_menu_entry(self.workspace)

    @property
    def frontend_url(self):
        root_frontend_url = get_frontend_ui_base_url(self.config)
        workspace_frontend_url = WORKSPACE_FRONTEND_URL_SCHEMA.format(
            workspace_id=self.workspace_id,
        )
        return root_frontend_url + workspace_frontend_url


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
            email_sent: bool = None
    )-> None:
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
        return UserInContext(
            self.user_role.user,
            self.dbsession,
            self.config
        )

    @property
    def workspace(self) -> WorkspaceInContext:
        """
        Workspace related to this role, with his context data
        :return: WorkspaceInContext object
        """
        return WorkspaceInContext(
            self.user_role.workspace,
            self.dbsession,
            self.config
        )


class ContentInContext(object):
    """
    Interface to get Content data and Content data related to context.
    """

    def __init__(self, content: Content, dbsession: Session, config: CFG, user: User=None) -> None:  # nopep8
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
    def label(self) -> str:
        return self.content.label

    @property
    def content_type(self) -> str:
        content_type = content_type_list.get_one_by_slug(self.content.type)
        return content_type.slug

    @property
    def sub_content_types(self) -> typing.List[str]:
        return [_type.slug for _type in self.content.get_allowed_content_types()]  # nopep8

    @property
    def status(self) -> str:
        return self.content.status

    @property
    def is_archived(self) -> bool:
        return self.content.is_archived

    @property
    def is_deleted(self) -> bool:
        return self.content.is_deleted

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
            dbsession=self.dbsession,
            config=self.config,
            user=self.content.first_revision.owner
        )

    @property
    def current_revision_id(self) -> int:
        return self.content.revision_id

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
            user=self.content.last_revision.owner
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
    def page_nb(self) -> typing.Optional[int]:
        """
        :return: page_nb of content if available, None if unavailable
        """
        if self.content.depot_file:
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
                self.content.revision_id,
                file_extension=self.content.file_extension
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
    def size(self) -> typing.Optional[int]:
        """
        :return: size of content if available, None if unavailable
        """
        if self.content.depot_file:
            return self.content.depot_file.file.content_length
        else:
            return None

    @property
    def pdf_available(self) -> bool:
        """
        :return: bool about if pdf version of content is available
        """
        if self.content.depot_file:
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
                self.content.revision_id,
                file_extension=self.content.file_extension
            )
        else:
            return False

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
        return self.content.file_name


class RevisionInContext(object):
    """
    Interface to get Content data and Content data related to context.
    """

    def __init__(self, content_revision: ContentRevisionRO, dbsession: Session, config: CFG,  user: User=None) -> None:  # nopep8
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
    def sub_content_types(self) -> typing.List[str]:
        return [_type.slug for _type
                in self.revision.node.get_allowed_content_types()]

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
            content_id=self.revision.content_id,
            content_type=content_type_list.Any_SLUG
        )
        if content.revision_id == self.revision_id:
            return content_api.is_editable(content)
        # INFO - G.M - 2018-11-02 - old revision are not editable
        return False

    @property
    def raw_content(self) -> str:
        return self.revision.description

    @property
    def author(self) -> UserInContext:
        return UserInContext(
            dbsession=self.dbsession,
            config=self.config,
            user=self.revision.owner
        )

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
    def next_revision(self) -> typing.Optional[ContentRevisionRO]:
        """
        Get next revision (later revision)
        :return: next_revision
        """
        next_revision = None
        revisions = self.revision.node.revisions
        # INFO - G.M - 2018-06-177 - Get revisions more recent that
        # current one
        next_revisions = [
            revision for revision in revisions
            if revision.revision_id > self.revision.revision_id
        ]
        if next_revisions:
            # INFO - G.M - 2018-06-177 -sort revisions by date
            sorted_next_revisions = sorted(
                next_revisions,
                key=lambda revision: revision.updated
            )
            # INFO - G.M - 2018-06-177 - return only next revision
            return sorted_next_revisions[0]
        else:
            return None

    @property
    def comment_ids(self) -> typing.List[int]:
        """
        Get list of ids of all current revision related comments
        :return: list of comments ids
        """
        comments = self.revision.node.get_comments()
        # INFO - G.M - 2018-06-177 - Get comments more recent than revision.
        revision_comments = [
            comment for comment in comments
            if comment.created > self.revision.updated or
               comment.revision_id > self.revision.revision_id
        ]
        if self.next_revision:
            # INFO - G.M - 2018-06-177 - if there is a revision more recent
            # than current remove comments from theses rev (comments older
            # than next_revision.)
            revision_comments = [
                comment for comment in revision_comments
                if comment.created < self.next_revision.updated or
                   comment.revision_id < self.next_revision.revision_id
            ]
        sorted_revision_comments = sorted(
            revision_comments,
            key=lambda revision: revision.revision_id
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
    def page_nb(self) -> typing.Optional[int]:
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
                self.revision.revision_id,
                file_extension=self.revision.file_extension
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
    def size(self) -> typing.Optional[int]:
        """
        :return: size of content if available, None if unavailable
        """
        if self.revision.depot_file:
            return self.revision.depot_file.file.content_length
        else:
            return None

    @property
    def pdf_available(self) -> bool:
        """
        :return: bool about if pdf version of content is available
        """
        if self.revision.depot_file:
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
                self.revision.revision_id,
                file_extension=self.revision.file_extension,
            )
        else:
            return False

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
        return self.revision.file_name