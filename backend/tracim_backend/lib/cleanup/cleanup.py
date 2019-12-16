import shutil
import typing
import uuid

from sqlalchemy.orm import Session

from tracim_backend.applications.share.models import ContentShare
from tracim_backend.applications.upload_permissions.models import UploadPermission
from tracim_backend.config import CFG
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import RevisionReadStatus
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.meta import DeclarativeBase

ANONYMOUS_USER_EMAIL_PATTERN = "anonymous_{hash}@anonymous.anonymous"


class CleanupLib(object):
    """
    Cleanup content of tracim with theses methods.
    Allow to remove workspace, user, etc...
    Some of these method required to bypass content revision protection
    using "unsafe_tracim_session" context_manager
    """

    def __init__(self, session: Session, app_config: CFG, dry_run_mode=False) -> None:
        self.session = session
        self.app_config = app_config
        self.dry_run_mode = dry_run_mode

    def safe_update(self, object_to_update: DeclarativeBase) -> None:
        if not self.dry_run_mode:
            logger.debug(self, "update {}".format(str(object_to_update)))
            self.session.add(object_to_update)
        else:
            logger.debug(self, "fake update of {}".format(str(object_to_update)))
            self.session.add(object_to_update)
            self.session.expunge(object_to_update)

    def safe_delete(self, object_to_delete: DeclarativeBase) -> None:
        """
        Delete object only if dry-run mode is disabled
        """
        if not self.dry_run_mode:
            logger.debug(self, "delete {}".format(str(object_to_delete)))
            self.session.delete(object_to_delete)
        else:
            logger.debug(self, "fake deletion of {}".format(str(object_to_delete)))

    def safe_delete_dir(self, dir_path: str) -> None:
        """
        Delete dir only if dry-run mode is disabled
        """
        if not self.dry_run_mode:
            logger.debug(self, "delete {} dir".format(str(dir_path)))
            shutil.rmtree(dir_path)
        else:
            logger.debug(self, "fake deletion of {} dir".format(dir_path))

    def delete_revision(self, revision: ContentRevisionRO) -> int:
        """

        :param revision: revision to delete
        :return: revision_id of revision to delete
        """

        # INFO - G.M - 2019-12-11 - delete revision read status
        read_statuses = self.session.query(RevisionReadStatus).filter(
            RevisionReadStatus.revision_id == revision.revision_id
        )
        for read_status in read_statuses:
            logger.info(
                self,
                "delete read status of user {} from revision {}".format(
                    read_status.user_id, read_status.revision_id
                ),
            )
            self.safe_delete(read_status)

        logger.info(
            self,
            "delete revision {} of content {}".format(revision.revision_id, revision.content_id),
        )
        revision_id = revision.revision_id
        self.safe_delete(revision)
        return revision_id

    def delete_content(self, content: Content, recursively: bool = True) -> typing.List[str]:
        """
        Delete content and associated stuff:
        - all content revisions
        - all children content if recursively is True
        - all content share

        :param content: content_id to delete
        :param recursively: should we delete children content too ?
        :return: list of content_id of content(s) deleted
        """
        deleted_contents = []
        # INFO - G.M - 2019-12-11 - delete content_share
        shares = self.session.query(ContentShare).filter(
            ContentShare.content_id == content.content_id
        )
        for share in shares:
            logger.info(
                self, "delete share {} from content {}".format(share.share_id, share.content_id)
            )
            self.safe_delete(share)

        # INFO - G.M - 2019-12-11 - delete children of content
        if recursively:
            for children in content.get_children(recursively=recursively):
                self.delete_content(children)

        for revision in content.revisions:
            deleted_contents.extend(self.delete_revision(revision))

        logger.info(self, "delete content {}".format(content.content_id))
        deleted_contents.append(content.content_id)
        self.safe_delete(content)
        return deleted_contents

    def delete_workspace(self, workspace: Workspace) -> int:
        """
        Delete workspace and associated stuff
        - all content in the workspace
        - all roles
        - all upload permission
        - workspace agenda

        :param workspace: workspace to delete
        :return: workspace_id of deleted workspace
        """

        # INFO - G.M - 2019-12-11 - delete role on workspace
        roles = self.session.query(UserRoleInWorkspace).filter(
            UserRoleInWorkspace.workspace_id == workspace.workspace_id
        )
        for role in roles:
            logger.info(
                self,
                "delete role for user {} of workspace {}".format(
                    role.user_id, workspace.workspace_id
                ),
            )
            self.safe_delete(role)

        # INFO - G.M - 2019-12-11 - delete permissions on workspace
        upload_permissions = self.session.query(UploadPermission).filter(
            UploadPermission.workspace_id == workspace.workspace_id
        )
        for upload_permission in upload_permissions:
            logger.info(
                self,
                "delete upload_permission {} of workspace".format(
                    upload_permission.upload_permission_id, workspace.workspace_id
                ),
            )
            self.safe_delete(upload_permission)

            logger.info(self, "delete workspace {}".format(workspace.workspace_id))
            self.safe_delete(workspace)
            for content in workspace.contents:
                self.delete_content(content)
        workspace_id = workspace.workspace_id
        self.safe_delete(workspace)
        return workspace_id

    def delete_workspace_agenda(self, workspace_id: int) -> typing.Optional[str]:
        # INFO - G.M - 2019-12-11 - delete workspace agenda
        if not self.app_config.CALDAV__ENABLED:
            logger.info(
                self,
                "will not delete workspace {} agenda, because caldav feature is disabled".format(
                    workspace_id
                ),
            )
            return

        agenda_dir = "{}{}{}{}".format(
            self.app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            self.app_config.CALDAV_RADICALE_WORKSPACE_PATH,
            workspace_id,
        )
        logger.info(self, "delete workspace {} agenda dir : {}".format(workspace_id, agenda_dir))
        self.safe_delete_dir(agenda_dir)
        return agenda_dir

    def delete_user_associated_data(self, user: User) -> None:
        """deleted all stuff about user but user itself, his workspaces and content"""

        # INFO - G.M - 2019-12-11 - user permission
        upload_permissions = self.session.query(UploadPermission).filter(
            UploadPermission.author_id == user.user_id
        )
        for upload_permission in upload_permissions:
            logger.info(
                self,
                "delete upload_permission {} from user {}".format(
                    upload_permission.upload_permission_id, upload_permission.author_id
                ),
            )
            self.safe_delete(upload_permission)

        # INFO - G.M - 2019-12-11 - user share
        shares = self.session.query(ContentShare).filter(ContentShare.author_id == user.user_id)
        for share in shares:
            logger.info(self, "delete share {} from user {}".format(share.share_id, user.user_id))
            self.safe_delete(share)

        # INFO - G.M - 2019-12-11 - User role
        roles = self.session.query(UserRoleInWorkspace).filter(
            UserRoleInWorkspace.user_id == user.user_id
        )
        for role in roles:
            logger.info(
                self,
                "delete role for user {} of workspace {}".format(role.user_id, role.workspace_id),
            )
            self.safe_delete(role)

        logger.info(self, "delete user groups for user {}".format(user.user_id))
        user.groups = []
        self.safe_update(user)

    def delete_user_agenda(self, user_id: int) -> typing.Optional[str]:
        """
        delete agenda of user
        :param user_id: user_id of user whe delete agenda
        :return: path of deleted agenda
        """

        if not self.app_config.CALDAV__ENABLED:
            logger.info(
                self,
                "will not delete user {} agenda, because caldav feature is disabled".format(
                    user_id
                ),
            )
            return
        agenda_dir = "{}{}{}{}".format(
            self.app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            self.app_config.CALDAV__RADICALE__USER_PATH,
            user_id,
        )
        logger.info(self, "delete user {} agenda dir : {}".format(user_id, agenda_dir))
        self.safe_delete_dir(agenda_dir)
        return agenda_dir

    def delete_user_owned_workspace(self, user: User) -> typing.List[int]:
        """
        Delete all user workspaces
        :param user: tracim user
        :return: workspace_id for all workspace of user
        """
        deleted_workspace_ids = []  # typing.List[int]
        wapi = WorkspaceApi(
            config=self.app_config, session=self.session, current_user=user, show_deleted=True
        )
        user_owned_workspaces = wapi.get_all_for_user(
            user, include_owned=True, include_with_role=False
        )
        for workspace in user_owned_workspaces:
            deleted_workspace_ids.append(workspace.workspace_id)
            self.delete_workspace(workspace)
        return deleted_workspace_ids

    def delete_user_revisions(self, user: User) -> typing.List[int]:
        """
        Delete all user revisions
        :param user: tracim user
        :return: revisions_id for all revision deleted
        """
        deleted_revision_ids = []  # typing.List[int]
        revisions = self.session.query(ContentRevisionRO).filter(
            ContentRevisionRO.owner_id == user.user_id
        )
        for revision in revisions:
            deleted_revision_ids.append(revision.revision_id)
            self.delete_revision(revision)
        return deleted_revision_ids

    def delete_full_user(self, user: User) -> int:
        """
        Full deletion of user in database (including all his revisions)
        /!\\ May cause inconsistent database
        :param user: user to delete
        :return: user_id
        """
        self.delete_user_associated_data(user)
        self.delete_user_owned_workspace(user)
        self.delete_user_revisions(user)
        logger.info(self, "delete user {}".format(user.user_id))
        user_id = user.user_id
        self.safe_delete(user)
        return user_id

    def anonymise_user(self, user: User, anonymised_user_display_name: str = None) -> User:
        """
        :param user: user to anonymise
        :return: user_id
        """
        hash = str(uuid.uuid4().hex)
        user.display_name = (
            anonymised_user_display_name or self.app_config.DEFAULT_ANONYMOUS_USER_DISPLAY_NAME
        )
        user.email = ANONYMOUS_USER_EMAIL_PATTERN.format(hash=hash)
        user.is_active = False
        user.is_deleted = True
        self.safe_update(user)
        return user

    def get_user_revisions_on_other_user_workspace(
        self, user: User
    ) -> typing.List[ContentRevisionRO]:
        wapi = WorkspaceApi(
            config=self.app_config, session=self.session, current_user=user, show_deleted=True
        )
        user_owned_workspaces = wapi.get_all_for_user(
            user, include_owned=True, include_with_role=False
        )

        return (
            self.session.query(ContentRevisionRO)
            .filter(
                ~ContentRevisionRO.workspace_id.in_(
                    [workspace.workspace_id for workspace in user_owned_workspaces]
                )
            )
            .filter(ContentRevisionRO.owner_id == user.user_id)
            .all()
        )
