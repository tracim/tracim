# -*- coding: utf-8 -*-
from datetime import datetime
import typing

from sqlalchemy.orm import Query
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend import app_list
from tracim_backend.apps import AGENDA__APP_SLUG
from tracim_backend.config import CFG
from tracim_backend.exceptions import AgendaServerConnectionError
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
from tracim_backend.models.auth import Group
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import WorkspaceInContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace

__author__ = "damien"


class WorkspaceApi(object):
    def __init__(
        self,
        session: Session,
        current_user: typing.Optional[User],
        config: CFG,
        force_role: bool = False,
        show_deleted: bool = False,
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
        self.translator = Translator(app_config=self._config, default_lang=default_lang)

    def _base_query_without_roles(self):
        query = self._session.query(Workspace)
        if not self.show_deleted:
            query = query.filter(Workspace.is_deleted == False)  # noqa: E712
        return query

    def _base_query(self):
        if not self._user:
            return self._base_query_without_roles()

        if not self._force_role and self._user.profile.id >= Group.TIM_ADMIN:
            return self._base_query_without_roles()

        query = self._base_query_without_roles()
        query = query.join(Workspace.roles).filter(
            UserRoleInWorkspace.user_id == self._user.user_id
        )
        return query

    def get_workspace_with_context(self, workspace: Workspace) -> WorkspaceInContext:
        """
        Return WorkspaceInContext object from Workspace
        """
        workspace = WorkspaceInContext(
            workspace=workspace, dbsession=self._session, config=self._config
        )
        return workspace

    def create_workspace(
        self,
        label: str = "",
        description: str = "",
        agenda_enabled: bool = True,
        public_download_enabled: bool = True,
        public_upload_enabled: bool = True,
        save_now: bool = False,
    ) -> Workspace:
        # TODO - G.M - 2019-04-11 - Fix Circular Import issue between userApi
        # and workspaceApi
        from tracim_backend.lib.core.user import UserApi

        uapi = UserApi(session=self._session, current_user=self._user, config=self._config)
        if not uapi.allowed_to_create_new_workspaces(self._user):
            raise UserNotAllowedToCreateMoreWorkspace("User not allowed to create more workspace")
        if not label:
            raise EmptyLabelNotAllowed("Workspace label cannot be empty")

        workspace = Workspace()
        workspace.label = label
        workspace.description = description
        workspace.agenda_enabled = agenda_enabled
        workspace.public_download_enabled = public_download_enabled
        workspace.public_upload_enabled = public_upload_enabled
        workspace.created = datetime.utcnow()
        workspace.updated = datetime.utcnow()
        workspace.owner = self._user
        # By default, we force the current user to be the workspace manager
        # And to receive email notifications
        role_api = RoleApi(session=self._session, current_user=self._user, config=self._config)

        role = role_api.create_one(
            self._user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=True
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
        workspace.updated = datetime.utcnow()
        if save_now:
            self.save(workspace)

        return workspace

    def get_one(self, id):
        try:
            return self._base_query().filter(Workspace.workspace_id == id).one()
        except NoResultFound as exc:
            raise WorkspaceNotFound(
                "workspace {} does not exist or not visible for user".format(id)
            ) from exc

    def get_one_by_label(self, label: str) -> Workspace:
        """
        Get one workspace by label, handle both direct
        and "~~{workspace_id}" end form, to allow getting a specific workspace when
        workspace_name is ambiguous (multiple workspace with same label)
        :param label: label of workspace or "label~~{workspace_name} form.
        :return: workspace found according to label given
        """
        splitted_label = label.split("~~", maxsplit=1)
        # INFO - G.M - 2019-10-10 - unambiguous form with workspace id
        if len(splitted_label) == 2 and splitted_label[1].isdecimal():
            return self.get_one(splitted_label[1])
        # INFO - G.M - 2019-10-10 - Ambiguous form with workspace label
        else:
            return self._get_one_by_label(label)

    def _get_one_by_label(self, label: str) -> Workspace:
        """
        get workspace according to label given, if multiple workspace have
        same label, return first one found.
        """
        # INFO - G.M - 2019-10-10 - result should be ordered same way as get_all() method,
        # to unsure working
        result = self.default_order_workspace(
            self._base_query().filter(Workspace.label == label)
        ).all()
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

    def get_all(self):
        return self.default_order_workspace(self._base_query()).all()

    def get_user_used_space(self, user: User) -> int:
        workspaces = self.get_all_for_user(user, include_owned=True, include_with_role=False)
        used_space = 0
        for workspace in workspaces:
            used_space += workspace.get_size()
        return used_space

    def _get_workspaces_owned_by_user(self, user_id: int) -> typing.List[Workspace]:
        return self._base_query_without_roles().filter(Workspace.owner_id == user_id).all()

    def get_all_for_user(
        self, user: User, include_owned: bool = True, include_with_role: bool = True
    ) -> typing.List[Workspace]:
        """
        Get al workspace of user
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

        query = query.filter(Workspace.workspace_id.in_(workspace_ids))
        query = query.order_by(Workspace.label)
        return query.all()

    def get_all_manageable(self) -> typing.List[Workspace]:
        """Get all workspaces the current user has manager rights on."""
        workspaces = []  # type: typing.List[Workspace]
        if self._user.profile.id == Group.TIM_ADMIN:
            workspaces = self._base_query().order_by(Workspace.label).all()
        elif self._user.profile.id == Group.TIM_MANAGER:
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
    ) -> [UserRoleInWorkspace]:
        roles = []
        for role in workspace.roles:
            if (
                (force_notify or role.do_notify is True)
                and (not self._user or role.user != self._user)
                and role.user.is_active
                and not role.user.is_deleted
                and role.user.auth_type != AuthType.UNKNOWN
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
            Workspace.label.ilike("{0}%".format(_("Workspace")))
        )

        return _("Workspace {}").format(query.count() + 1)


class UnsafeWorkspaceApi(WorkspaceApi):
    def _base_query(self):
        return self.session.query(Workspace).filter(Workspace.is_deleted == False)  # noqa: E712
