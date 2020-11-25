# -*- coding: utf-8 -*-
from datetime import datetime
from operator import or_
import typing

from sqlalchemy import func
from sqlalchemy.orm import Query
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend import app_list
from tracim_backend.apps import AGENDA__APP_SLUG
from tracim_backend.config import CFG
from tracim_backend.exceptions import AgendaServerConnectionError
from tracim_backend.exceptions import DisallowedWorkspaceAccessType
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import UserNotAllowedToCreateMoreWorkspace
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.exceptions import WorkspacePublicDownloadDisabledException
from tracim_backend.exceptions import WorkspacePublicUploadDisabledException
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.lib.utils.utils import current_date_for_filename
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import WorkspaceInContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.tracim_session import TracimSession

__author__ = "damien"


class WorkspaceApi(object):
    def __init__(
        self,
        session: TracimSession,
        current_user: typing.Optional[User],
        config: CFG,
        force_role: bool = False,
        show_deleted: bool = False,
        access_types_filter: typing.Optional[typing.List[WorkspaceAccessType]] = None,
    ):
        """
        :param current_user: Current user of context
        :param force_role: If True, app role in queries even if admin
        """
        session.assert_event_mechanism()
        self._session = session
        self._user = current_user
        self._config = config
        self._force_role = force_role
        self.show_deleted = show_deleted
        self._access_types_filter = access_types_filter
        default_lang = None
        if self._user:
            default_lang = self._user.lang
        self.translator = Translator(app_config=self._config, default_lang=default_lang)

    def _base_query_without_roles(self):
        """
        Prepare query that would return all not deleted workspaces.
        """
        query = self._session.query(Workspace)
        if not self.show_deleted:
            query = query.filter(Workspace.is_deleted == False)  # noqa: E712
        if self._access_types_filter:
            access_types_str = [access_type.name for access_type in self._access_types_filter]
            query = query.filter(Workspace.access_type.in_(access_types_str))
        return query

    def _base_query(self):
        """
        Prepare query that would return all not deleted workspaces where the current user:
          - is a member
          - OR has an admin profile
        """
        if not self._user:
            return self._base_query_without_roles()

        if not self._force_role and self._user.profile.id >= Profile.ADMIN.id:
            return self._base_query_without_roles()

        query = self._base_query_without_roles()
        query = query.join(Workspace.roles).filter(
            UserRoleInWorkspace.user_id == self._user.user_id
        )
        return query

    def _user_allowed_to_create_new_workspaces(self, user: User) -> bool:
        # INFO - G.M - 2019-08-21 - 0 mean no limit here
        if self._config.LIMITATION__SHAREDSPACE_PER_USER == 0:
            return True

        owned_workspace_count = (
            self._session.query(func.count(Workspace.workspace_id))
            .filter(Workspace.owner_id == user.user_id)
            .scalar()
        )
        return owned_workspace_count < self._config.LIMITATION__SHAREDSPACE_PER_USER

    def get_workspace_with_context(self, workspace: Workspace) -> WorkspaceInContext:
        """
        Return WorkspaceInContext object from Workspace
        """
        return WorkspaceInContext(workspace=workspace, dbsession=self._session, config=self._config)

    def create_workspace(
        self,
        label: str = "",
        description: str = "",
        agenda_enabled: bool = True,
        public_download_enabled: bool = True,
        public_upload_enabled: bool = True,
        access_type: WorkspaceAccessType = WorkspaceAccessType.CONFIDENTIAL,
        default_user_role: WorkspaceRoles = WorkspaceRoles.READER,
        parent: Workspace = None,
        save_now: bool = False,
    ) -> Workspace:
        if not self._user or not self._user_allowed_to_create_new_workspaces(self._user):
            raise UserNotAllowedToCreateMoreWorkspace("User not allowed to create more workspace")
        if not label:
            raise EmptyLabelNotAllowed("Workspace label cannot be empty")
        if access_type not in self._config.WORKSPACE__ALLOWED_ACCESS_TYPES:
            raise DisallowedWorkspaceAccessType(
                'Access type "{}" is not allowed for this workspace'.format(access_type.name)
            )
        workspace = Workspace()
        workspace.label = label
        workspace.description = description
        workspace.agenda_enabled = agenda_enabled
        workspace.public_download_enabled = public_download_enabled
        workspace.public_upload_enabled = public_upload_enabled
        workspace.created = datetime.utcnow()
        workspace.updated = datetime.utcnow()
        workspace.owner = self._user
        workspace.access_type = access_type
        workspace.default_user_role = default_user_role
        workspace.parent = parent
        # By default, we force the current user to be the workspace manager
        # And to receive email notifications
        role_api = RoleApi(session=self._session, current_user=self._user, config=self._config)
        with self._session.no_autoflush:
            role = role_api.create_one(
                self._user,
                workspace,
                UserRoleInWorkspace.WORKSPACE_MANAGER,
                with_notif=True,
                flush=False,
            )
        self._session.add(workspace)
        self._session.add(role)
        if save_now:
            self._session.flush()
        return workspace

    def update_workspace(
        self,
        workspace: Workspace,
        label: typing.Optional[str] = None,
        description: typing.Optional[str] = None,
        save_now: bool = False,
        agenda_enabled: typing.Optional[bool] = None,
        public_upload_enabled: typing.Optional[bool] = None,
        public_download_enabled: typing.Optional[bool] = None,
        default_user_role: typing.Optional[WorkspaceRoles] = None,
    ) -> Workspace:
        """
        Update workspace
        :param workspace: workspace to update
        :param label: new label of workspace
        :param description: new description
        :param save_now: database flush
        :return: updated workspace
        """
        if label is not None:
            if label == "":
                raise EmptyLabelNotAllowed("Workspace label cannot be empty")
            workspace.label = label
        if description is not None:
            workspace.description = description
        if agenda_enabled is not None:
            workspace.agenda_enabled = agenda_enabled
        if public_upload_enabled is not None:
            workspace.public_upload_enabled = public_upload_enabled
        if public_download_enabled is not None:
            workspace.public_download_enabled = public_download_enabled
        if default_user_role:
            workspace.default_user_role = default_user_role
        workspace.updated = datetime.utcnow()
        if save_now:
            self.save(workspace)

        return workspace

    def add_current_user_as_member(self, workspace_id: int) -> Workspace:
        """
        Adds the current user as a member of the given workspace id.
        Only works for OPEN workspaces.

        Role is set to the workspace default role.
        """
        query = self._base_query_without_roles().filter(Workspace.workspace_id == workspace_id)
        query = query.filter(Workspace.access_type == WorkspaceAccessType.OPEN)
        try:
            workspace = query.one()
        except NoResultFound as exc:
            raise WorkspaceNotFound(
                "workspace {} does not exist or not visible for user".format(workspace_id)
            ) from exc
        rapi = RoleApi(current_user=self._user, session=self._session, config=self._config,)
        rapi.create_one(self._user, workspace, workspace.default_user_role.level, with_notif=True)
        return workspace

    def get_one(self, workspace_id: int) -> Workspace:
        query = self._base_query().filter(Workspace.workspace_id == workspace_id)
        try:
            return query.one()
        except NoResultFound as exc:
            raise WorkspaceNotFound(
                "workspace {} does not exist or not visible for user".format(workspace_id)
            ) from exc

    def get_one_by_filemanager_filename(
        self, filemanager_filename: str, parent: typing.Optional[Workspace] = None
    ) -> Workspace:
        """
        get workspace according to filemanager_filename given and parent, if multiple workspace have
        same filemanager_filename, return first one found.

        filemanager_filename is filename like version of workspace with specific extension '.space'
        """
        if not filemanager_filename.endswith(Workspace.FILEMANAGER_EXTENSION):
            raise WorkspaceNotFound(
                'Invalid Workspace name. Filemanager_filename should end with "{}"'.format(
                    Workspace.FILEMANAGER_EXTENSION
                )
            )
        label = filemanager_filename[: -len(Workspace.FILEMANAGER_EXTENSION)]
        query = self._base_query().filter(Workspace.label == label)
        if parent:
            query = query.filter(Workspace.parent_id == parent.workspace_id)
        else:
            rapi = RoleApi(session=self._session, current_user=self._user, config=self._config)
            workspace_ids = rapi.get_user_workspaces_ids(
                user_id=self._user.user_id, min_role=UserRoleInWorkspace.READER
            )
            query = query.filter(
                or_(
                    Workspace.parent_id == None,  # noqa: E711
                    Workspace.parent_id.notin_(workspace_ids),
                )
            )
        result = self.default_order_workspace(query).all()
        if len(result) == 0:
            raise WorkspaceNotFound(
                "workspace {} does not exist or not visible for user".format(id)
            )

        return result[0]

    def default_order_workspace(self, query: Query) -> Query:
        """
        Order workspace in a standardized way to ensure order is same between get_one_by_label
        and other methods like get_all, this is required for webdav support to work correctly
        """
        return query.order_by(Workspace.workspace_id)

    def _parent_id_filter(self, query: Query, parent_ids: typing.List[int]) -> Query:
        """ Filtering result by parent ids"""
        if parent_ids == 0:
            return query.filter(Workspace.parent_id == None)  # noqa: E711
        if parent_ids is None or parent_ids == []:
            return query

        if parent_ids:
            allowed_parent_ids = []
            allow_root = False
            for parent_id in parent_ids:
                if parent_id == 0:
                    allow_root = True
                else:
                    allowed_parent_ids.append(parent_id)
            if allow_root:
                query = query.filter(
                    or_(
                        Workspace.parent_id.in_(allowed_parent_ids), Workspace.parent_id == None
                    )  # noqa: E711
                )
            else:
                query = query.filter(Workspace.parent_id.in_(allowed_parent_ids))
        return query

    def get_all(self) -> typing.List[Workspace]:
        return self.default_order_workspace(self._base_query()).all()

    def get_all_children(self, parent_ids: typing.List[int]) -> typing.List[Workspace]:
        workspaces = self._parent_id_filter(parent_ids=parent_ids, query=self._base_query())
        return self.default_order_workspace(workspaces).all()

    def get_user_used_space(self, user: User) -> int:
        workspaces = self.get_all_for_user(user, include_owned=True, include_with_role=False)
        used_space = 0
        for workspace in workspaces:
            used_space += workspace.get_size()
        return used_space

    def _get_workspaces_owned_by_user(self, user_id: int) -> typing.List[Workspace]:
        return self._base_query_without_roles().filter(Workspace.owner_id == user_id).all()

    def get_all_for_user(
        self,
        user: User,
        include_owned: bool = True,
        include_with_role: bool = True,
        parents_ids: typing.Optional[typing.List[int]] = None,
    ) -> typing.List[Workspace]:
        """
        Get all workspaces of user
        :param user:  just an user
        :param include_owned: include workspace where user is owner
        :param include_with_role: include workspace where user has a role
        :return: list of workspaces found
        """
        query = self._base_query()
        workspace_ids = []
        rapi = RoleApi(session=self._session, current_user=self._user, config=self._config)
        if include_with_role:
            workspace_ids.extend(
                rapi.get_user_workspaces_ids(
                    user_id=user.user_id, min_role=UserRoleInWorkspace.READER
                )
            )
        if include_owned:
            owned_workspaces = self._get_workspaces_owned_by_user(user.user_id)
            workspace_ids.extend([workspace.workspace_id for workspace in owned_workspaces])

        query = self._parent_id_filter(query, parent_ids=parents_ids)
        query = query.filter(Workspace.workspace_id.in_(workspace_ids))
        query = query.order_by(Workspace.label)
        return query.all()

    def get_user_orphan_workspaces(self, user: User):
        """Get all user workspaces where the users is not member of the parent and parent exists"""
        query = self._base_query()
        workspace_ids = []
        rapi = RoleApi(session=self._session, current_user=self._user, config=self._config)
        workspace_ids.extend(
            rapi.get_user_workspaces_ids(user_id=user.user_id, min_role=UserRoleInWorkspace.READER)
        )
        query = query.filter(Workspace.workspace_id.in_(workspace_ids))
        query = query.filter(Workspace.parent_id.isnot(None))
        query = query.filter(Workspace.parent_id.notin_(workspace_ids))
        return self.default_order_workspace(query).all()

    def get_all_accessible_by_user(self, user: User) -> typing.List[Workspace]:
        """
        Return workspaces accessible by user.
        Accessible workspaces:
          - are of type OPEN or ON_REQUEST
          - do not have user as a member
        """
        query = self._base_query_without_roles().filter(
            Workspace.access_type.in_(Workspace.ACCESSIBLE_TYPES)
        )
        query = query.filter(
            Workspace.workspace_id.notin_(
                self._session.query(UserRoleInWorkspace.workspace_id).filter(
                    UserRoleInWorkspace.user_id == user.user_id
                )
            )
        )
        return query.all()

    def get_all_manageable(self) -> typing.List[Workspace]:
        """Get all workspaces the current user has manager rights on."""
        workspaces = []  # type: typing.List[Workspace]
        if self._user.profile.id == Profile.ADMIN.id:
            workspaces = self._base_query().order_by(Workspace.label).all()
        elif self._user.profile.id == Profile.TRUSTED_USER.id:
            workspaces = (
                self._base_query()
                .filter(UserRoleInWorkspace.role == UserRoleInWorkspace.WORKSPACE_MANAGER)
                .order_by(Workspace.label)
                .all()
            )
        return workspaces

    def disable_notifications(self, user: User, workspace: Workspace):
        for role in user.roles:
            if role.workspace == workspace:
                role.do_notify = False

    def enable_notifications(self, user: User, workspace: Workspace):
        for role in user.roles:
            if role.workspace == workspace:
                role.do_notify = True

    def get_notifiable_roles(
        self, workspace: Workspace, force_notify: bool = False
    ) -> typing.List[UserRoleInWorkspace]:
        """return workspace roles of given workspace which can be notified. Note that user without
        email are excluded from return as user with no notification parameter (if force_notify is
        False).

        :param workspace: concerned workspace
        :param force_notify: don't care about notification configuration of user
        """
        roles = []
        for role in workspace.roles:
            if (
                (force_notify or role.do_notify is True)
                and (not self._user or role.user != self._user)
                and role.user.is_active
                and not role.user.is_deleted
                and role.user.auth_type != AuthType.UNKNOWN
                and role.user.email
            ):
                roles.append(role)
        return roles

    def save(self, workspace: Workspace):
        self._session.flush()

    def delete(self, workspace: Workspace, flush=True):
        workspace.is_deleted = True
        label = "{label}-{action}-{date}".format(
            label=workspace.label, action="deleted", date=current_date_for_filename()
        )
        workspace.label = label

        if flush:
            self._session.flush()

    def undelete(self, workspace: Workspace, flush=True):
        workspace.is_deleted = False

        if flush:
            self._session.flush()

        return workspace

    def execute_created_workspace_actions(self, workspace: Workspace) -> None:
        """
        WARNING ! This method Will be Deprecated soon, see
        https://github.com/tracim/tracim/issues/1589 and
        https://github.com/tracim/tracim/issues/1487

        This method do post creation workspace actions
        """

        # FIXME - G.M - 2019-03-18 - move this code to another place when
        # event mechanism is ready, see https://github.com/tracim/tracim/issues/1487
        # event on_created_workspace should start hook use by agenda app code.

        # TODO - G.M - 2019-04-11 - Circular Import, will probably be remove
        # with event refactor, see https://github.com/tracim/tracim/issues/1487
        from tracim_backend.applications.agenda.lib import AgendaApi

        app_lib = ApplicationApi(app_list=app_list)
        if app_lib.exist(AGENDA__APP_SLUG):
            if workspace.agenda_enabled:
                agenda_api = AgendaApi(
                    current_user=self._user, session=self._session, config=self._config
                )
                try:
                    agenda_already_exist = agenda_api.ensure_workspace_agenda_exists(workspace)
                    if agenda_already_exist:
                        logger.warning(
                            self,
                            "workspace {} is just created but it own agenda already exist !!".format(
                                workspace.workspace_id
                            ),
                        )
                except AgendaServerConnectionError as exc:
                    logger.error(self, "Cannot connect to agenda server")
                    logger.exception(self, exc)
                except Exception as exc:
                    logger.error(self, "Something goes wrong during agenda create/update")
                    logger.exception(self, exc)

    def execute_update_workspace_actions(self, workspace: Workspace) -> None:
        """
        WARNING ! This method Will be Deprecated soon, see
        https://github.com/tracim/tracim/issues/1589 and
        https://github.com/tracim/tracim/issues/1487

        This method do post update workspace actions
        """

        # FIXME - G.M - 2019-03-18 - move this code to another place when
        # event mechanism is ready, see https://github.com/tracim/tracim/issues/1487
        # event on_updated_workspace should start hook use by agenda app code.

        app_lib = ApplicationApi(app_list=app_list)
        if app_lib.exist(AGENDA__APP_SLUG):
            # TODO - G.M - 2019-04-11 - Circular Import, will probably be remove
            # with event refactor, see https://github.com/tracim/tracim/issues/1487
            from tracim_backend.applications.agenda.lib import AgendaApi

            if workspace.agenda_enabled:
                agenda_api = AgendaApi(
                    current_user=self._user, session=self._session, config=self._config
                )
                try:
                    agenda_api.ensure_workspace_agenda_exists(workspace)
                except AgendaServerConnectionError as exc:
                    logger.error(self, "Cannot connect to agenda server")
                    logger.exception(self, exc)
                except Exception as exc:
                    logger.error(self, "Something goes wrong during agenda create/update")
                    logger.exception(self, exc)

    def check_public_upload_enabled(self, workspace: Workspace) -> None:
        if not workspace.public_upload_enabled:
            raise WorkspacePublicUploadDisabledException(
                'Workspace "{}" has public '
                "download feature disabled".format(workspace.workspace_id)
            )

    def check_public_download_enabled(self, workspace: Workspace) -> None:
        if not workspace.public_download_enabled:
            raise WorkspacePublicDownloadDisabledException(
                'Workspace "{}" has public '
                "download feature disabled".format(workspace.workspace_id)
            )

    def get_base_query(self) -> Query:
        return self._base_query()

    def generate_label(self) -> str:
        """
        :return: Generated workspace label
        """
        _ = self.translator.get_translation
        query = self._base_query_without_roles().filter(
            Workspace.label.ilike("{0}%".format(_("Space")))
        )

        return _("Space {}").format(query.count() + 1)
