# -*- coding: utf-8 -*-
import typing

from sqlalchemy.orm import Query
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.config import CFG
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import WorkspaceLabelAlreadyUsed
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.utils.translation import DEFAULT_FALLBACK_LANG
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.models.auth import Group
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import WorkspaceInContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace

__author__ = 'damien'


class WorkspaceApi(object):

    def __init__(
            self,
            session: Session,
            current_user: User,
            config: CFG,
            force_role: bool=False,
            show_deleted: bool=False,

    ):
        """
        :param current_user: Current user of context
        :param force_role: If True, app role in queries even if admin
        """
        self._session = session
        self._user = current_user
        self._config = config
        self._force_role = force_role
        self.show_deleted = show_deleted
        default_lang = None
        if self._user:
            default_lang = self._user.lang
        if not default_lang:
            default_lang = DEFAULT_FALLBACK_LANG
        self.translator = Translator(app_config=self._config, default_lang=default_lang)  # nopep8

    def _base_query_without_roles(self):
        query = self._session.query(Workspace)
        if not self.show_deleted:
            query = query.filter(Workspace.is_deleted == False)
        return query

    def _base_query(self):
        if not self._force_role and self._user.profile.id>=Group.TIM_ADMIN:
            return self._base_query_without_roles()

        query = self._base_query_without_roles()
        query = query.join(Workspace.roles).\
            filter(UserRoleInWorkspace.user_id == self._user.user_id)
        return query

    def get_workspace_with_context(
            self,
            workspace: Workspace
    ) -> WorkspaceInContext:
        """
        Return WorkspaceInContext object from Workspace
        """
        workspace = WorkspaceInContext(
            workspace=workspace,
            dbsession=self._session,
            config=self._config,
        )
        return workspace

    def create_workspace(
            self,
            label: str='',
            description: str='',
            calendar_enabled: bool=False,
            save_now: bool=False,
    ) -> Workspace:
        if not label:
            raise EmptyLabelNotAllowed('Workspace label cannot be empty')

        if self._session.query(Workspace).filter(Workspace.label == label).count() > 0:  # nopep8
            raise WorkspaceLabelAlreadyUsed(
                'A workspace with label {} already exist.'.format(label)
            )
        workspace = Workspace()
        workspace.label = label
        workspace.description = description
        workspace.calendar_enabled = calendar_enabled

        # By default, we force the current user to be the workspace manager
        # And to receive email notifications
        role_api = RoleApi(
            session=self._session,
            current_user=self._user,
            config=self._config
        )

        role = role_api.create_one(
            self._user,
            workspace,
            UserRoleInWorkspace.WORKSPACE_MANAGER,
            with_notif=True,
        )

        self._session.add(workspace)
        self._session.add(role)

        if save_now:
            self._session.flush()

        # TODO - G.M - 28-03-2018 - [Calendar] Reenable calendar stuff
        # if calendar_enabled:
        #     self._ensure_calendar_exist(workspace)
        # else:
        #     self._disable_calendar(workspace)

        return workspace

    def update_workspace(
            self,
            workspace: Workspace,
            label: str,
            description: str,
            save_now: bool=False,
    ) -> Workspace:
        """
        Update workspace
        :param workspace: workspace to update
        :param label: new label of workspace
        :param description: new description
        :param save_now: database flush
        :return: updated workspace
        """
        if not label:
            raise EmptyLabelNotAllowed('Workspace label cannot be empty')
        workspace.label = label
        workspace.description = description

        if save_now:
            self.save(workspace)

        return workspace

    def get_one(self, id):
        try:
            return self._base_query().filter(Workspace.workspace_id == id).one()
        except NoResultFound as exc:
            raise WorkspaceNotFound('workspace {} does not exist or not visible for user'.format(id)) from exc  # nopep8

    def get_one_by_label(self, label: str) -> Workspace:
        try:
            return self._base_query().filter(Workspace.label == label).one()
        except NoResultFound as exc:
            raise WorkspaceNotFound('workspace {} does not exist or not visible for user'.format(id)) from exc  # nopep8

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

    def get_all_manageable(self) -> typing.List[Workspace]:
        """Get all workspaces the current user has manager rights on."""
        workspaces = []  # type: typing.List[Workspace]
        if self._user.profile.id == Group.TIM_ADMIN:
            workspaces = self._base_query().order_by(Workspace.label).all()
        elif self._user.profile.id == Group.TIM_MANAGER:
            workspaces = self._base_query() \
                .filter(
                    UserRoleInWorkspace.role ==
                    UserRoleInWorkspace.WORKSPACE_MANAGER
                ) \
                .order_by(Workspace.label) \
                .all()
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
        self._session.flush()

    def delete(self, workspace: Workspace, flush=True):
        workspace.is_deleted = True

        if flush:
            self._session.flush()

    def undelete(self, workspace: Workspace, flush=True):
        workspace.is_deleted = False

        if flush:
            self._session.flush()

        return workspace

    def execute_created_workspace_actions(self, workspace: Workspace) -> None:
        pass
        # TODO - G.M - 28-03-2018 - [Calendar] Re-enable this calendar stuff
        # self.ensure_calendar_exist(workspace)

    # TODO - G.M - 28-03-2018 - [Calendar] Re-enable this calendar stuff
    # def ensure_calendar_exist(self, workspace: Workspace) -> None:
    #     # Note: Cyclic imports
    #     from tracim.lib.calendar import CalendarManager
    #     from tracim.model.organisational import WorkspaceCalendar
    #
    #     calendar_manager = CalendarManager(self._user)
    #
    #     try:
    #         calendar_manager.enable_calendar_file(
    #             calendar_class=WorkspaceCalendar,
    #             related_object_id=workspace.workspace_id,
    #             raise_=True,
    #         )
    #     # If previous calendar file no exist, calendar must be created
    #     except FileNotFoundError:
    #         self._user.ensure_auth_token()
    #
    #         # Ensure database is up-to-date
    #         self.session.flush()
    #         transaction.commit()
    #
    #         calendar_manager.create_then_remove_fake_event(
    #             calendar_class=WorkspaceCalendar,
    #             related_object_id=workspace.workspace_id,
    #         )
    #
    # def disable_calendar(self, workspace: Workspace) -> None:
    #     # Note: Cyclic imports
    #     from tracim.lib.calendar import CalendarManager
    #     from tracim.model.organisational import WorkspaceCalendar
    #
    #     calendar_manager = CalendarManager(self._user)
    #     calendar_manager.disable_calendar_file(
    #         calendar_class=WorkspaceCalendar,
    #         related_object_id=workspace.workspace_id,
    #         raise_=False,
    #     )

    def get_base_query(self) -> Query:
        return self._base_query()

    def generate_label(self) -> str:
        """
        :return: Generated workspace label
        """
        _ = self.translator.get_translation
        query = self._base_query_without_roles() \
            .filter(Workspace.label.ilike('{0}%'.format(
                _('Workspace'),
            )))

        return _('Workspace {}').format(
            query.count() + 1,
        )


class UnsafeWorkspaceApi(WorkspaceApi):
    def _base_query(self):
        return self.session.query(Workspace).filter(Workspace.is_deleted==False)
