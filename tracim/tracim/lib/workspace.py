# -*- coding: utf-8 -*-
import transaction

from sqlalchemy.orm import Query
from tg.i18n import ugettext as _

from tracim.lib.userworkspace import RoleApi
from tracim.model.auth import Group
from tracim.model.auth import User
from tracim.model.data import Workspace
from tracim.model.data import UserRoleInWorkspace
from tracim.model import DBSession

__author__ = 'damien'


class WorkspaceApi(object):

    def __init__(self, current_user: User, force_role: bool=False):
        """
        :param current_user: Current user of context
        :param force_role: If True, app role in queries even if admin
        """
        self._user = current_user
        self._force_role = force_role

    def _base_query_without_roles(self):
        return DBSession.query(Workspace).filter(Workspace.is_deleted==False)

    def _base_query(self):
        if not self._force_role and self._user.profile.id>=Group.TIM_ADMIN:
            return self._base_query_without_roles()

        return DBSession.query(Workspace).\
            join(Workspace.roles).\
            filter(UserRoleInWorkspace.user_id==self._user.user_id).\
            filter(Workspace.is_deleted==False)

    def create_workspace(
            self,
            label: str='',
            description: str='',
            calendar_enabled: bool=False,
            save_now: bool=False,
    ) -> Workspace:
        if not label:
            label = self.generate_label()

        workspace = Workspace()
        workspace.label = label
        workspace.description = description
        workspace.calendar_enabled = calendar_enabled

        # By default, we force the current user to be the workspace manager
        # And to receive email notifications
        role = RoleApi(self._user).create_one(self._user, workspace,
                                              UserRoleInWorkspace.WORKSPACE_MANAGER,
                                              with_notif=True)

        DBSession.add(workspace)
        DBSession.add(role)

        if save_now:
            DBSession.flush()

        if calendar_enabled:
            self.execute_created_workspace_actions(workspace)

        return workspace

    def get_one(self, id):
        return self._base_query().filter(Workspace.workspace_id==id).one()

    def get_one_by_label(self, label: str) -> Workspace:
        return self._base_query().filter(Workspace.label == label).one()

    """
    def get_one_for_current_user(self, id):
        return self._base_query().filter(Workspace.workspace_id==id).\
            session.query(ZKContact).filter(ZKContact.groups.any(ZKGroup.id.in_([1,2,3])))
            filter(sqla.).one()
    """

    def get_all(self):
        return self._base_query().all()

    def get_all_for_user(self, user: User, ignored_ids=None):
        workspaces = []

        for role in user.roles:
            if not role.workspace.is_deleted:
                if not ignored_ids:
                    workspaces.append(role.workspace)
                elif role.workspace.workspace_id not in ignored_ids:
                        workspaces.append(role.workspace)
                else:
                    pass  # do not return workspace

        workspaces.sort(key=lambda workspace: workspace.label.lower())
        return workspaces

    def disable_notifications(self, user: User, workspace: Workspace):
        for role in user.roles:
            if role.workspace==workspace:
                role.do_notify = False

    def enable_notifications(self, user: User, workspace: Workspace):
        for role in user.roles:
            if role.workspace==workspace:
                role.do_notify = True

    def get_notifiable_roles(self, workspace: Workspace) -> [UserRoleInWorkspace]:
        roles = []
        for role in workspace.roles:
            if role.do_notify==True \
                    and role.user!=self._user \
                    and role.user.is_active:
                roles.append(role)
        return roles

    def save(self, workspace: Workspace):
        DBSession.flush()

    def delete_one(self, workspace_id, flush=True):
        workspace = self.get_one(workspace_id)
        workspace.is_deleted = True

        if flush:
            DBSession.flush()

    def restore_one(self, workspace_id, flush=True):
        workspace = DBSession.query(Workspace).filter(Workspace.is_deleted==True).filter(Workspace.workspace_id==workspace_id).one()
        workspace.is_deleted = False

        if flush:
            DBSession.flush()

        return workspace

    def execute_created_workspace_actions(self, workspace: Workspace) -> None:
        self.ensure_calendar_exist(workspace)

    def ensure_calendar_exist(self, workspace: Workspace) -> None:
        # Note: Cyclic imports
        from tracim.lib.calendar import CalendarManager
        from tracim.model.organisational import WorkspaceCalendar

        if workspace.calendar_enabled:
            self._user.ensure_auth_token()

            # Ensure database is up-to-date
            DBSession.flush()
            transaction.commit()

            calendar_manager = CalendarManager(self._user)
            calendar_manager.create_then_remove_fake_event(
                calendar_class=WorkspaceCalendar,
                related_object_id=workspace.workspace_id,
            )

    def get_base_query(self) -> Query:
        return self._base_query()

    def generate_label(self) -> str:
        """
        :return: Generated workspace label
        """
        query = self._base_query_without_roles() \
            .filter(Workspace.label.ilike('{0}%'.format(
                _('Workspace'),
            )))

        return _('Workspace {}').format(
            query.count() + 1,
        )


class UnsafeWorkspaceApi(WorkspaceApi):
    def _base_query(self):
        return DBSession.query(Workspace).filter(Workspace.is_deleted==False)
