# -*- coding: utf-8 -*-
import typing

from sqlalchemy.orm import Query
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.config import CFG
from tracim_backend.exceptions import LastWorkspaceManagerRoleCantBeModified
from tracim_backend.exceptions import RoleAlreadyExistError
from tracim_backend.exceptions import UserRoleNotFound
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import UserRoleWorkspaceInContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.tracim_session import TracimSession

__author__ = "damien"


class RoleApi(object):
    def __init__(
        self,
        session: TracimSession,
        current_user: typing.Optional[User],
        config: CFG,
        show_disabled_user: bool = True,
    ) -> None:
        session.assert_event_mechanism()
        self._session = session
        self._user = current_user
        self._config = config
        self._show_disabled_user = show_disabled_user

    # TODO - Gui.M - 26-03-2020 - For now it only filters enabled/disabled user, it does not filters deleted
    #  workspaces/users
    def _apply_base_filters(self, query):
        if not self._show_disabled_user:
            query = query.join(User).filter(User.is_active == True)  # noqa:E712
        return query

    def _base_query(self):
        return self._apply_base_filters(self._session.query(UserRoleInWorkspace))

    def get_user_workspaces_ids(self, user_id: int, min_role: int) -> typing.List[int]:
        assert self._user.profile == Profile.ADMIN or self._user.user_id == user_id
        workspaces_ids_tuples = (
            self._base_query()
            .with_entities(UserRoleInWorkspace.workspace_id)
            .filter(UserRoleInWorkspace.user_id == user_id)
            .filter(UserRoleInWorkspace.role >= min_role)
            .join(Workspace)
            .filter(Workspace.is_deleted == False)  # noqa: E711
            .all()
        )
        workspaces_ids = []
        for workspace_tuple in workspaces_ids_tuples:
            workspaces_ids.append(workspace_tuple[0])
        return workspaces_ids

    def get_user_role_workspace_with_context(
        self, user_role: UserRoleInWorkspace, newly_created: bool = None, email_sent: bool = None
    ) -> UserRoleWorkspaceInContext:
        """
        Return WorkspaceInContext object from Workspace
        """
        assert self._config
        workspace = UserRoleWorkspaceInContext(
            user_role=user_role,
            dbsession=self._session,
            config=self._config,
            newly_created=newly_created,
            email_sent=email_sent,
        )
        return workspace

    def _get_one_rsc(self, user_id: int, workspace_id: int) -> Query:
        """
        :param user_id:
        :param workspace_id:
        :return: a Query object, filtered query but without fetching the object.
        """
        return (
            self._session.query(UserRoleInWorkspace)
            .filter(UserRoleInWorkspace.workspace_id == workspace_id)
            .filter(UserRoleInWorkspace.user_id == user_id)
        )

    def get_one(self, user_id: int, workspace_id: int) -> UserRoleInWorkspace:
        try:
            user_role = self._get_one_rsc(user_id, workspace_id).one()
        except NoResultFound:
            raise UserRoleNotFound(
                "Role for user {user_id} "
                "in workspace {workspace_id} was not found.".format(
                    user_id=user_id, workspace_id=workspace_id
                )
            )
        return user_role

    def update_role(
        self,
        role: UserRoleInWorkspace,
        role_level: int,
        with_notif: typing.Optional[bool] = None,
        save_now: bool = False,
    ):
        """
        Update role of user in this workspace
        :param role: UserRoleInWorkspace object
        :param role_level: level of new role wanted
        :param with_notif: is user notification enabled in this workspace ?
        :param save_now: database flush
        :return: updated role
        """
        if role.role == WorkspaceRoles.WORKSPACE_MANAGER.level and self._is_last_workspace_manager(
            role.user_id, role.workspace_id
        ):
            raise LastWorkspaceManagerRoleCantBeModified(
                "last workspace manager {} can't change is own role in workspace".format(
                    role.user_id
                )
            )
        role.role = role_level
        if with_notif is not None:
            role.do_notify = with_notif
        if save_now:
            self.save(role)

        return role

    def create_one(
        self,
        user: User,
        workspace: Workspace,
        role_level: int,
        with_notif: bool,
        flush: bool = True,
    ) -> UserRoleInWorkspace:
        # INFO - G.M - 2018-10-29 - Check if role already exists
        query = self._get_one_rsc(user.user_id, workspace.workspace_id)
        if query.count() > 0:
            raise RoleAlreadyExistError(
                "Role already exist for user {} in workspace {}.".format(
                    user.user_id, workspace.workspace_id
                )
            )
        role = UserRoleInWorkspace()
        role.user_id = user.user_id
        role.workspace = workspace
        role.role = role_level
        role.do_notify = with_notif
        if flush:
            self._session.flush()
        return role

    def delete_one(self, user_id: int, workspace_id: int, flush=True) -> None:
        if self._is_last_workspace_manager(user_id, workspace_id):
            raise LastWorkspaceManagerRoleCantBeModified(
                "last workspace manager {} can't remove is own role in workspace".format(user_id)
            )
        role = self.get_one(user_id, workspace_id)
        self._session.delete(role)
        if flush:
            self._session.flush()

    def _is_last_workspace_manager(self, user_id: int, workspace_id: int) -> bool:
        # INFO - G.M - 2020-17-09 - check if user is workspace_manager of workspace
        try:
            self.get_all_for_workspace_query(workspace_id).filter(
                UserRoleInWorkspace.role == WorkspaceRoles.WORKSPACE_MANAGER.level
            ).filter(UserRoleInWorkspace.user_id == user_id).one()
        except NoResultFound:
            return False

        # INFO - G.M - 2020-17-09 - check other potential workspace_manager of workspace
        return (
            self.get_all_for_workspace_query(workspace_id)
            .filter(UserRoleInWorkspace.role == WorkspaceRoles.WORKSPACE_MANAGER.level)
            .filter(UserRoleInWorkspace.user_id != user_id)
            .count()
            == 0
        )

    def get_all_for_workspace_query(self, workspace_id: int) -> Query:
        query = (
            self._base_query()
            .filter(UserRoleInWorkspace.workspace_id == workspace_id)
            .order_by(UserRoleInWorkspace.user_id)
        )
        return query

    def get_all_for_workspace(self, workspace: Workspace) -> typing.List[UserRoleInWorkspace]:
        return self.get_all_for_workspace_query(workspace.workspace_id).all()

    def get_workspace_members(
        self, workspace_id: int, min_role: typing.Optional[WorkspaceRoles] = None
    ) -> typing.List[User]:
        query = self._apply_base_filters(
            self._session.query(User)
            .join(UserRoleInWorkspace)
            .filter(UserRoleInWorkspace.workspace_id == workspace_id)
        )
        if min_role:
            query = query.filter(UserRoleInWorkspace.role >= min_role.level)
        return query.all()

    def get_workspace_member_ids(
        self, workspace_id: int, min_role: typing.Optional[WorkspaceRoles] = None
    ) -> typing.List[int]:
        return [user.user_id for user in self.get_workspace_members(workspace_id, min_role)]

    def save(self, role: UserRoleInWorkspace) -> None:
        self._session.flush()
