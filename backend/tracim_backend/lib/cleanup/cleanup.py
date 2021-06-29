import shutil
import typing
import uuid

from sqlalchemy import and_
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.applications.share.models import ContentShare
from tracim_backend.applications.upload_permissions.models import UploadPermission
from tracim_backend.config import CFG
from tracim_backend.exceptions import AgendaNotFoundError
from tracim_backend.exceptions import CannotDeleteUniqueRevisionWithoutDeletingContent
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import RevisionReadStatus
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.favorites import FavoriteContent
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.reaction import Reaction

ANONYMIZED_USER_EMAIL_PATTERN = "anonymous_{hash}@anonymous.local"


class UserNeedAnonymization(object):
    def __init__(
        self,
        blocking_revisions: typing.List[ContentRevisionRO],
        blocking_workspaces: typing.List[Workspace],
        blocking_reactions: typing.List[Reaction],
    ) -> None:
        self.blocking_revisions = blocking_revisions
        self.blocking_workspaces = blocking_workspaces
        self.blocking_reactions = blocking_reactions

    @property
    def need_anonymization(self):
        return (
            self.blocking_workspaces != []
            or self.blocking_revisions != []
            or self.blocking_reactions != []
        )


class CleanupLib(object):
    """
    Cleanup content of tracim with theses methods.
    Allow to remove workspace, user, etc...
    Some of these method required to bypass content revision protection
    using "unsafe_tracim_session" context_manager
    """

    def __init__(self, session: Session, app_config: CFG, dry_run_mode: bool = False) -> None:
        self.session = session
        self.app_config = app_config
        self.dry_run_mode = dry_run_mode

    def safe_update(self, object_to_update: DeclarativeBase) -> None:
        if not self.dry_run_mode:
            logger.debug(self, "update {}".format(str(object_to_update)))
            self.session.add(object_to_update)
        else:
            logger.debug(self, "fake update of {}".format(str(object_to_update)))
            # INFO - G.M - 2019-12-16 - to cleanup current modified object from update
            # we do need to expunge it, but expunging need to ensure first object is added
            # in current session. If this is not the case expunge fail with InvalidRequestError
            # exception and message "Instance <object> is not present in this Session"
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

    def delete_revision(
        self, revision: ContentRevisionRO, do_update_content_last_revision: bool = True,
    ) -> int:
        """
        :param do_update_content_last_revision: update last revision of content associated to last one if needed. Set only
        to False when needed to delete all content data and will delete associated content after.
        :param revision: revision to delete
        :return: revision_id of revision to delete
        """

        if do_update_content_last_revision and revision.node.revision_id == revision.revision_id:
            try:
                new_last_revision = (
                    self.session.query(ContentRevisionRO)
                    .filter(
                        and_(
                            ContentRevisionRO.content_id == revision.node.id,
                            ContentRevisionRO.revision_id != revision.revision_id,
                        )
                    )
                    .order_by(ContentRevisionRO.revision_id.desc())
                    .limit(1)
                    .one()
                )
                revision.node.current_revision = new_last_revision
                self.safe_update(revision.node)
            except NoResultFound:
                raise CannotDeleteUniqueRevisionWithoutDeletingContent(
                    'revision "{}" is the only revision for content "{}", it is not possible to delete'.format(
                        revision.revision_id, revision.content_id
                    )
                )

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

        content.cached_revision_id = None
        for revision in content.revisions:
            deleted_contents.append(
                self.delete_revision(revision, do_update_content_last_revision=False)
            )
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

        for content in workspace.contents:
            self.delete_content(content)

        workspace_id = workspace.workspace_id
        logger.info(self, "delete workspace {}".format(workspace.workspace_id))
        self.safe_delete(workspace)
        return workspace_id

    def delete_workspace_agenda(self, workspace_id: int) -> typing.Optional[str]:
        agenda_dir = "{}{}{}{}".format(
            self.app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            self.app_config.CALDAV_RADICALE_WORKSPACE_PATH,
            workspace_id,
        )
        logger.info(
            self, 'delete workspace "{}" agenda dir at "{}"'.format(workspace_id, agenda_dir)
        )
        try:
            self.safe_delete_dir(agenda_dir)
        except FileNotFoundError as e:
            raise AgendaNotFoundError(
                'Try to delete workspace "{}" agenda but no agenda found at {}'.format(
                    workspace_id, agenda_dir
                )
            ) from e
        return agenda_dir

    def delete_user_associated_data(self, user: User) -> None:
        """deleted all stuff about user except user itself, his workspaces and user content"""

        # INFO - G.M - 2021-03-22 UserFavoriteContent
        favorites_contents = self.session.query(FavoriteContent).filter(
            FavoriteContent.user_id == user.user_id
        )
        for favorite_content in favorites_contents:
            logger.info(
                self,
                "delete favorite_content {} from user {}".format(
                    favorite_content.content_id, favorite_content.user_id
                ),
            )
            self.safe_delete(favorite_content)

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

        logger.info(self, "delete user profile for user {}".format(user.user_id))
        user.groups = []
        self.safe_update(user)

    def delete_user_agenda(self, user_id: int) -> typing.Optional[str]:
        """
        delete agenda of user
        :param user_id: user_id of user whe delete agenda
        :return: path of deleted agenda
        """
        agenda_dir = "{}{}{}{}".format(
            self.app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            self.app_config.CALDAV__RADICALE__USER_PATH,
            user_id,
        )
        logger.info(self, "delete user {} agenda dir : {}".format(user_id, agenda_dir))
        try:
            self.safe_delete_dir(agenda_dir)
        except FileNotFoundError as e:
            raise AgendaNotFoundError(
                "Try to delete user {} agenda but no agenda found at {}".format(user_id, agenda_dir)
            ) from e
        return agenda_dir

    def delete_user_owned_workspace(self, user: User) -> typing.List[int]:
        """
        Delete all user workspaces
        :param user: tracim user
        :return: workspace_id for all workspace of user
        """
        deleted_workspace_ids = []  # typing.List[int]
        wapi = WorkspaceApi(
            config=self.app_config, session=self.session, current_user=None, show_deleted=True
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
            try:
                self.delete_revision(revision)
            except CannotDeleteUniqueRevisionWithoutDeletingContent:
                # INFO - G.M - 2019-04-01 - if we tried to delete the only revision of a content,
                # delete content instead.
                self.delete_content(revision.node)
        return deleted_revision_ids

    def delete_user_reactions(self, user: User) -> typing.List[int]:
        """
        Delete all user reactions
        :param user: tracim user
        :return: reaction id for all reaction deleted
        """

        deleted_reactions_ids = []  # typing.List[int]
        reactions = self.session.query(Reaction).filter(Reaction.author_id == user.user_id)
        for reaction in reactions:
            deleted_reactions_ids.append(reaction.reaction_id)
            logger.info(
                self,
                "delete reaction {} of content {}".format(
                    reaction.reaction_id, reaction.content_id
                ),
            )
            self.safe_delete(reaction)
        return deleted_reactions_ids

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

    def prepare_deletion_or_anonymization(
        self, user: User,
    ):
        """
        Disable and delete user with flag to get proper TLM.
        """
        user.is_active = False
        user.is_deleted = True
        self.safe_update(user)
        return user

    def anonymize_user(
        self, user: User, anonymized_user_display_name: typing.Optional[str] = None
    ) -> User:
        """
        :param user: user to anonymize_if_required
        :return: user_id
        """
        hash = str(uuid.uuid4().hex)
        user.display_name = (
            anonymized_user_display_name or self.app_config.DEFAULT_ANONYMIZED_USER_DISPLAY_NAME
        )
        user.email = ANONYMIZED_USER_EMAIL_PATTERN.format(hash=hash)
        user.username = None
        user.is_active = False
        user.is_deleted = True
        self.safe_update(user)
        return user

    def should_anonymize(
        self, user: User, owned_workspace_will_be_deleted: bool = False
    ) -> UserNeedAnonymization:
        wapi = WorkspaceApi(
            config=self.app_config, session=self.session, current_user=user, show_deleted=True
        )
        user_owned_workspaces_to_filter = wapi.get_all_for_user(
            user, include_owned=True, include_with_role=False
        )

        revision_query = self.session.query(ContentRevisionRO)
        reaction_query = self.session.query(Reaction)
        if owned_workspace_will_be_deleted:
            revision_query = revision_query.filter(
                ~ContentRevisionRO.workspace_id.in_(
                    [workspace.workspace_id for workspace in user_owned_workspaces_to_filter]
                )
            )
            reaction_query = (
                reaction_query.join(Content)
                .join(
                    ContentRevisionRO, Content.cached_revision_id == ContentRevisionRO.revision_id
                )
                .filter(
                    ~ContentRevisionRO.workspace_id.in_(
                        [workspace.workspace_id for workspace in user_owned_workspaces_to_filter]
                    )
                )
            )
            user_blocking_workspaces = []
        else:
            user_blocking_workspaces = user_owned_workspaces_to_filter

        revision_query = revision_query.filter(ContentRevisionRO.owner_id == user.user_id)
        reaction_query = reaction_query.filter(Reaction.author_id == user.user_id)
        user_blocking_revisions = revision_query.all()
        user_blocking_reactions = reaction_query.all()
        return UserNeedAnonymization(
            blocking_workspaces=user_blocking_workspaces,
            blocking_revisions=user_blocking_revisions,
            blocking_reactions=user_blocking_reactions,
        )
