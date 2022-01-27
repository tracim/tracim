import contextlib
from enum import Enum
import os
import typing
from xml.sax.saxutils import escape

import caldav
from caldav.elements.base import ValuedBaseElement
from caldav.lib.namespace import ns
from colour import Color
import requests
from sqlalchemy.orm import Session

from tracim_backend import ApplicationApi
from tracim_backend import app_list
from tracim_backend.applications.agenda.models import AgendaResourceType
from tracim_backend.applications.agenda.schemas import AgendaType
from tracim_backend.apps import AGENDA__APP_SLUG
from tracim_backend.config import CFG
from tracim_backend.exceptions import AgendaPropsUpdateFailed
from tracim_backend.exceptions import AgendaServerConnectionError
from tracim_backend.exceptions import CannotCreateAgendaResource
from tracim_backend.exceptions import WorkspaceAgendaDisabledException
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import Agenda
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace

CREATE_CALENDAR_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" ?>
<create xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:I="http://apple.com/ns/ical/">
  <set>
    <prop>
      <resourcetype>
        <collection />
        <C:calendar />
      </resourcetype>
      <C:supported-calendar-component-set>
        <C:comp name="VEVENT" />
        <C:comp name="VJOURNAL" />
        <C:comp name="VTODO" />
      </C:supported-calendar-component-set>
      <displayname>{agenda_name}</displayname>
      <C:calendar-description>{agenda_description}</C:calendar-description>
      <I:calendar-color>{agenda_color}</I:calendar-color>
    </prop>
  </set>
</create>
"""

CREATE_ADDRESSBOOK_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" ?>
<create xmlns="DAV:" xmlns:CR="urn:ietf:params:xml:ns:carddav">
  <set>
    <prop>
      <resourcetype>
        <collection />
        <CR:addressbook />
      </resourcetype>
      <displayname>{addressbook_name}</displayname>
      <CR:addressbook-description>{addressbook_description}</CR:addressbook-description>
    </prop>
  </set>
</create>
"""


class AgendaCreationState(str, Enum):
    CREATED = "created"
    DISABLED = "disabled"
    EXISTING = "existing"


class CalendarDescription(ValuedBaseElement):
    tag = ns("C", "calendar-description")


class AgendaApi(object):
    def __init__(self, session: Session, current_user: typing.Optional[User], config: CFG) -> None:
        self._user = current_user
        self._session = session
        self._config = config

    def _check_collection_exist(self, url) -> bool:
        try:
            response = requests.get(url)
        except requests.exceptions.ConnectionError as exc:
            logger.error(
                self,
                "Cannot check agenda collection existence, connection error to radicale server",
            )
            logger.exception(self, exc)
            raise AgendaServerConnectionError() from exc
        if response.status_code < 400:
            return True
        else:
            # TODO - G.M - 2019-03-13 - Better deal with other error code
            return False

    def user_has_agenda_enabled(self, user: User):
        return user.is_active and not user.is_deleted

    def workspace_has_agenda_enabled(self, workspace: Workspace):
        return workspace.agenda_enabled and not workspace.is_deleted

    def create_collection(self, url, name, description, type: AgendaResourceType):
        logger.debug(
            self, "create a new agenda collection of type {} at url {}".format(type.value, url)
        )
        # INFO - G.M - 2019-05-10 - we use str as pick key as it is determinist: same
        # result between run. default method use hash which use random hash for security concern
        if type == AgendaResourceType.calendar:
            body = CREATE_CALENDAR_TEMPLATE.format(
                agenda_name=escape(name),
                agenda_color=Color(pick_for=name, pick_key=str).get_hex(),
                agenda_description=escape(description),
            )
        elif type == AgendaResourceType.addressbook:
            body = CREATE_ADDRESSBOOK_TEMPLATE.format(
                addressbook_name=escape(name), addressbook_description=escape(description),
            )
        else:
            raise ()
        try:
            response = requests.request("mkcol", url, data=body.encode("utf-8"))
        except requests.exceptions.ConnectionError as exc:
            raise AgendaServerConnectionError() from exc
        if not response.status_code == 201:
            raise CannotCreateAgendaResource(
                "Agenda resource of type {} at url {} cannot be created:{},{}".format(
                    type.value, url, response.status_code, response.content
                )
            )
        logger.info(
            self, "new agenda resource of type {} created at url {}".format(type.value, url)
        )

    def update_collection_props(self, url, name, description, type: AgendaResourceType):
        logger.debug(
            self,
            "update existing agenda collection of type {} props at url {}".format(type.value, url),
        )
        # force renaming of agenda to be sure of consistency
        if type == AgendaResourceType.calendar:
            return self._update_agenda_props(url, name, description)
        elif type == AgendaResourceType.addressbook:
            return self._update_addressbook_props(url, name, description)
        else:
            raise ()

    def _update_agenda_props(self, url, name, description):
        try:
            caldav_client = caldav.DAVClient(username="tracim", password="tracim", url=url)
            agenda = caldav.objects.Calendar(client=caldav_client, url=url)
            props = agenda.get_properties([caldav.dav.DisplayName(), CalendarDescription()])
            # TODO - G.M - 2019-04-11 - Rewrote this better, we need to verify
            # if value are same but as props may be None but agenda_description
            # can be '' we need to convert thing in order that '' is same as None.
            if name != str(props.get(caldav.dav.DisplayName().tag) or "") or description != str(
                props.get(CalendarDescription().tag) or ""
            ):
                agenda.set_properties(
                    [caldav.dav.DisplayName(name), CalendarDescription(description)]
                )
                logger.debug(self, "props for agenda at url {} updated".format(url))
            else:
                logger.debug(self, "No props to update for agenda at url {}".format(url))
        except Exception as exc:
            raise AgendaPropsUpdateFailed("Failed to update props of agenda") from exc

    def _update_addressbook_props(self, url, name, description):
        try:
            caldav_client = caldav.DAVClient(username="tracim", password="tracim", url=url)
            addressbook = caldav.objects.Calendar(client=caldav_client, url=url)
            props = addressbook.get_properties([caldav.dav.DisplayName()])
            # TODO - G.M - 2019-04-11 - Rewrote this better, we need to verify
            # if value are same but as props may be None but agenda_description
            # can be '' we need to convert thing in order that '' is same as None.
            if name != str(props.get(caldav.dav.DisplayName().tag) or ""):
                addressbook.set_properties([caldav.dav.DisplayName(name)])
                logger.debug(self, "props for addressbook at url {} updated".format(url))
            else:
                logger.debug(self, "No props to update for addressbook at url {}".format(url))
        except Exception as exc:
            raise AgendaPropsUpdateFailed("Failed to update props of addressbook") from exc

    def _get_agenda_base_url(self, use_proxy: bool) -> str:
        if use_proxy:
            base_url = self._config.WEBSITE__BASE_URL + "/dav"
        else:
            base_url = self._config.CALDAV__RADICALE_PROXY__BASE_URL
        return base_url

    def get_workspace_agenda_url(self, workspace: Workspace, use_proxy: bool) -> str:
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        workspace_agenda_path = self._config.RADICALE__WORKSPACE_AGENDA_PATH_PATTERN.format(
            resource_type_dir=self._config.RADICALE__CALENDAR_DIR,
            workspace_subdir=self._config.RADICALE__WORKSPACE_SUBDIR,
            workspace_id=workspace.workspace_id,
        )
        return "{base_url}{workspace_agenda_path}/".format(
            base_url=base_url, workspace_agenda_path=workspace_agenda_path
        )

    def get_workspace_addressbook_url(self, workspace: Workspace, use_proxy: bool) -> str:
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        workspace_agenda_path = self._config.RADICALE__WORKSPACE_AGENDA_PATH_PATTERN.format(
            resource_type_dir=self._config.RADICALE__ADDRESSBOOK_DIR,
            workspace_subdir=self._config.RADICALE__WORKSPACE_SUBDIR,
            workspace_id=workspace.workspace_id,
        )
        return "{base_url}{workspace_agenda_path}/".format(
            base_url=base_url, workspace_agenda_path=workspace_agenda_path
        )

    def get_user_resource_url(self, user: User, use_proxy: bool) -> str:
        # HACK return user resource agenda instead of user_agenda
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        return "{base_url}/{user_resource_dir}/".format(
            base_url=base_url,
            user_resource_dir=self._config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
                user_id=user.user_id
            ),
        )

    def get_user_agenda_url(self, user: User, use_proxy: bool) -> str:
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        user_agenda_path = self._config.RADICALE__USER_AGENDA_PATH_PATTERN.format(
            resource_type_dir=self._config.RADICALE__CALENDAR_DIR,
            user_subdir=self._config.RADICALE__USER_SUBDIR,
            user_id=user.user_id,
        )
        return "{base_url}{user_agenda_path}/".format(
            base_url=base_url, user_agenda_path=user_agenda_path
        )

    def get_user_addressbook_url(self, user: User, use_proxy: bool) -> str:
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        user_agenda_path = self._config.RADICALE__USER_AGENDA_PATH_PATTERN.format(
            resource_type_dir=self._config.RADICALE__ADDRESSBOOK_DIR,
            user_subdir=self._config.RADICALE__USER_SUBDIR,
            user_id=user.user_id,
        )
        return "{base_url}{user_agenda_path}/".format(
            base_url=base_url, user_agenda_path=user_agenda_path
        )

    def sync_user_agenda(self, user: User) -> AgendaCreationState:
        if self.user_has_agenda_enabled(user):
            if self._ensure_user_agenda_exists(user=user):
                state = AgendaCreationState.EXISTING
            else:
                state = AgendaCreationState.CREATED
        else:
            # INFO - GM - 2022-27-01  - We do not delete existing agenda if set to disabled
            state = AgendaCreationState.DISABLED
        self.sync_user_symlinks(user=user)
        return state

    def sync_workspace_agenda(self, workspace: Workspace) -> AgendaCreationState:
        if self.workspace_has_agenda_enabled(workspace):
            if self._ensure_workspace_agenda_exists(workspace=workspace):
                state = AgendaCreationState.EXISTING
            else:
                state = AgendaCreationState.CREATED
        else:
            # INFO - GM - 2022-27-01  - We do not delete existing agenda if set to disabled
            state = AgendaCreationState.DISABLED
        for role in workspace.roles:
            self.sync_workspace_symlinks(workspace=workspace, user=role.user)
        return state

    def sync_user_symlinks(self, user: User):
        if self.user_has_agenda_enabled(user):
            self._ensure_user_symlinks_exist(user)
        else:
            self._ensure_user_symlinks_missing(user)

    def sync_workspace_symlinks(self, user: User, workspace: Workspace, role_deletion=False):
        # TODO - G.M - 2022-01-27 - Reconsider role_deletion option with change in role before
        # deletion like deleted status for User or Workspace ?

        if (
            self.workspace_has_agenda_enabled(workspace)
            and self.user_has_agenda_enabled(user=user)
            and not role_deletion
        ):
            self._ensure_workspace_symlinks_exist(user, workspace)
        else:
            self._ensure_workspace_symlinks_missing(user, workspace)

    def _ensure_workspace_agenda_exists(self, workspace: Workspace) -> bool:
        """
        Return true if agenda already exist, false if it was just create
        raise Exception if agenda cannot be created.
        """
        logger.debug(
            self, "check for agenda existence of workspace {}".format(workspace.workspace_id)
        )
        if not workspace.agenda_enabled:
            raise WorkspaceAgendaDisabledException()
        workspace_agenda_url = self.get_workspace_agenda_url(workspace, use_proxy=False)
        if not self._check_collection_exist(workspace_agenda_url):
            self.create_collection(
                url=workspace_agenda_url,
                name=workspace.label,
                description=workspace.description,
                type=AgendaResourceType.calendar,
            )
            result = False
        else:
            self.update_collection_props(
                url=workspace_agenda_url,
                name=workspace.label,
                description=workspace.description,
                type=AgendaResourceType.calendar,
            )
            result = True
        workspace_addressbook_url = self.get_workspace_addressbook_url(workspace, use_proxy=False)
        if not self._check_collection_exist(workspace_addressbook_url):
            self.create_collection(
                url=workspace_addressbook_url,
                name=workspace.label,
                description=workspace.description,
                type=AgendaResourceType.addressbook,
            )
            result = False
        else:
            self.update_collection_props(
                url=workspace_addressbook_url,
                name=workspace.label,
                description=workspace.description,
                type=AgendaResourceType.addressbook,
            )
            result = True
        return result

    def _ensure_user_agenda_exists(self, user: User) -> bool:
        """
        Return true if agenda already exist, false if it was just create
        raise Exception if agenda cannot be created.
        """
        logger.debug(self, "check for agenda existence of user {}".format(user.user_id))
        user_agenda_url = self.get_user_agenda_url(user, use_proxy=False)
        if not self._check_collection_exist(user_agenda_url):
            self.create_collection(
                url=user_agenda_url,
                name=user.display_name,
                description="",
                type=AgendaResourceType.calendar,
            )
            result = False
        else:
            self.update_collection_props(
                url=user_agenda_url,
                name=user.display_name,
                description="",
                type=AgendaResourceType.calendar,
            )
            result = True
        user_addressbook_url = self.get_user_addressbook_url(user, use_proxy=False)
        if not self._check_collection_exist(user_addressbook_url):
            self.create_collection(
                url=user_addressbook_url,
                name=user.display_name,
                description="",
                type=AgendaResourceType.addressbook,
            )
            result = False
        else:
            self.update_collection_props(
                url=user_addressbook_url,
                name=user.display_name,
                description="",
                type=AgendaResourceType.addressbook,
            )
            result = True
        return result

    def get_resource_type_dir(self, resource_type: AgendaResourceType) -> typing.Optional[str]:
        if resource_type == AgendaResourceType.calendar:
            return self._config.RADICALE__CALENDAR_DIR
        if resource_type == AgendaResourceType.addressbook:
            return self._config.RADICALE__ADDRESSBOOK_DIR
        else:
            return None

    def _delete_user_symlinks(
        self, original_user_id: int, dest_user_id: int, resource_type: AgendaResourceType
    ):
        user_resource_dir = self._config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=dest_user_id
        )
        user_resource = self._config.RADICALE__USER_RESOURCE_PATTERN.format(
            owner_type="user", owner_id=original_user_id, resource_type=resource_type.value,
        )
        user_resource_path = self._config.RADICALE__USER_RESOURCE_PATH_PATTERN.format(
            user_resource_dir=user_resource_dir, user_resource=user_resource
        )
        symlink_path = "{local_path}{user_resource_path}".format(
            local_path=self._config.RADICALE__LOCAL_PATH_STORAGE,
            user_resource_path=user_resource_path,
        )
        with contextlib.suppress(FileNotFoundError):
            os.remove(symlink_path)

    def _create_user_symlinks(
        self, original_user_id: int, dest_user_id: int, resource_type: AgendaResourceType
    ):
        resource_type_dir = self.get_resource_type_dir(resource_type)
        user_agenda_path = self._config.RADICALE__USER_AGENDA_PATH_PATTERN.format(
            resource_type_dir=resource_type_dir,
            user_subdir=self._config.RADICALE__USER_SUBDIR,
            user_id=original_user_id,
        )
        user_resource_dir = self._config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=dest_user_id
        )
        user_resource = self._config.RADICALE__USER_RESOURCE_PATTERN.format(
            owner_type="user", owner_id=original_user_id, resource_type=resource_type.value,
        )
        os.makedirs(
            "{local_path}/{user_resource_dir}".format(
                local_path=self._config.RADICALE__LOCAL_PATH_STORAGE,
                user_resource_dir=user_resource_dir,
            ),
            exist_ok=True,
        )

        user_ressource_path = self._config.RADICALE__USER_RESOURCE_PATH_PATTERN.format(
            user_resource_dir=user_resource_dir, user_resource=user_resource,
        )
        symlink_path = "{local_path}{user_resource_path}".format(
            local_path=self._config.RADICALE__LOCAL_PATH_STORAGE,
            user_resource_path=user_ressource_path,
        )
        if not os.path.islink(symlink_path):
            os.symlink(
                "{local_path}{user_agenda_path}".format(
                    local_path=self._config.RADICALE__LOCAL_PATH_STORAGE,
                    user_agenda_path=user_agenda_path,
                ),
                symlink_path,
            )

    def _ensure_user_symlinks_exist(self, user: User):
        self._create_user_symlinks(
            user.user_id, user.user_id, resource_type=AgendaResourceType.calendar
        )
        self._create_user_symlinks(
            user.user_id, user.user_id, resource_type=AgendaResourceType.addressbook
        )

    def _ensure_user_symlinks_missing(self, user: User):
        self._delete_user_symlinks(
            user.user_id, user.user_id, resource_type=AgendaResourceType.calendar
        )
        self._delete_user_symlinks(
            user.user_id, user.user_id, resource_type=AgendaResourceType.addressbook
        )

    def _ensure_workspace_symlinks_exist(self, user: User, workspace: Workspace):
        self._create_workspace_symlinks(
            workspace_id=workspace.workspace_id,
            dest_user_id=user.user_id,
            resource_type=AgendaResourceType.calendar,
        )
        self._create_workspace_symlinks(
            workspace_id=workspace.workspace_id,
            dest_user_id=user.user_id,
            resource_type=AgendaResourceType.addressbook,
        )

    def _ensure_workspace_symlinks_missing(self, user: User, workspace: Workspace):
        self._delete_workspace_symlinks(
            workspace_id=workspace.workspace_id,
            dest_user_id=user.user_id,
            resource_type=AgendaResourceType.calendar,
        )
        self._delete_workspace_symlinks(
            workspace_id=workspace.workspace_id,
            dest_user_id=user.user_id,
            resource_type=AgendaResourceType.addressbook,
        )

    def _delete_workspace_symlinks(
        self, workspace_id: int, dest_user_id: int, resource_type: AgendaResourceType
    ):
        user_resource_dir = self._config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=dest_user_id
        )
        user_resource = self._config.RADICALE__USER_RESOURCE_PATTERN.format(
            owner_type="space", owner_id=workspace_id, resource_type=resource_type.value,
        )
        user_resource_path = self._config.RADICALE__USER_RESOURCE_PATH_PATTERN.format(
            user_resource_dir=user_resource_dir, user_resource=user_resource
        )
        symlink_path = "{local_path}{user_resource_path}".format(
            local_path=self._config.RADICALE__LOCAL_PATH_STORAGE,
            user_resource_path=user_resource_path,
        )
        with contextlib.suppress(FileNotFoundError):
            os.remove(symlink_path)

    def _create_workspace_symlinks(
        self, workspace_id: int, dest_user_id: int, resource_type: AgendaResourceType
    ):
        resource_type_dir = self.get_resource_type_dir(resource_type)
        workspace_agenda_path = self._config.RADICALE__WORKSPACE_AGENDA_PATH_PATTERN.format(
            resource_type_dir=resource_type_dir,
            workspace_subdir=self._config.RADICALE__WORKSPACE_SUBDIR,
            workspace_id=workspace_id,
        )
        user_resource_dir = self._config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=dest_user_id
        )
        user_resource = self._config.RADICALE__USER_RESOURCE_PATTERN.format(
            owner_type="space", owner_id=workspace_id, resource_type=resource_type.value,
        )
        os.makedirs(
            "{local_path}/{user_resource_dir}".format(
                local_path=self._config.RADICALE__LOCAL_PATH_STORAGE,
                user_resource_dir=user_resource_dir,
            ),
            exist_ok=True,
        )

        user_ressource_path = self._config.RADICALE__USER_RESOURCE_PATH_PATTERN.format(
            user_resource_dir=user_resource_dir, user_resource=user_resource,
        )
        symlink_path = "{local_path}{user_resource_path}".format(
            local_path=self._config.RADICALE__LOCAL_PATH_STORAGE,
            user_resource_path=user_ressource_path,
        )
        if not os.path.islink(symlink_path):
            os.symlink(
                "{local_path}{workspace_agenda_path}".format(
                    local_path=self._config.RADICALE__LOCAL_PATH_STORAGE,
                    workspace_agenda_path=workspace_agenda_path,
                ),
                symlink_path,
            )

    def get_user_agendas(
        self,
        user: User,
        workspaces_ids_filter: typing.Optional[typing.List[int]],
        agenda_types_filter: typing.Optional[str],
        resource_types_filter: typing.Optional[str],
    ) -> typing.List[Agenda]:
        user_agendas = []
        if workspaces_ids_filter:
            agenda_types_filter = [AgendaType.workspace.value]

        if not agenda_types_filter:
            agenda_types_filter = [agenda.value for agenda in AgendaType]

        if not resource_types_filter:
            resource_types_filter = [AgendaResourceType.calendar.value]

        if AgendaType.private.value in agenda_types_filter:
            if AgendaResourceType.calendar.value in resource_types_filter:
                user_agendas.append(
                    Agenda(
                        agenda_url=self.get_user_agenda_url(user, use_proxy=True),
                        with_credentials=True,
                        agenda_type=AgendaType.private.value,
                        workspace_id=None,
                        resource_type=AgendaResourceType.calendar.value,
                    )
                )
            if AgendaResourceType.addressbook.value in resource_types_filter:
                user_agendas.append(
                    Agenda(
                        agenda_url=self.get_user_addressbook_url(user, use_proxy=True),
                        with_credentials=True,
                        agenda_type=AgendaType.private.value,
                        workspace_id=None,
                        resource_type=AgendaResourceType.addressbook.value,
                    )
                )
            if AgendaResourceType.directory.value in resource_types_filter:
                user_agendas.append(
                    Agenda(
                        agenda_url=self.get_user_resource_url(user, use_proxy=True),
                        with_credentials=True,
                        agenda_type=AgendaType.private.value,
                        workspace_id=None,
                        resource_type=AgendaResourceType.directory.value,
                    )
                )
        if AgendaType.workspace.value in agenda_types_filter:
            workspace_api = WorkspaceApi(
                current_user=self._user, session=self._session, config=self._config
            )
            workspaces = workspace_api.get_all_for_user(
                user, include_with_role=True, include_owned=False
            )
            for workspace in workspaces:
                if workspaces_ids_filter and workspace.workspace_id not in workspaces_ids_filter:
                    continue
                if not workspace.agenda_enabled:
                    continue

                if AgendaResourceType.calendar.value in resource_types_filter:
                    user_agendas.append(
                        Agenda(
                            agenda_url=self.get_workspace_agenda_url(workspace, use_proxy=True),
                            with_credentials=True,
                            agenda_type=AgendaType.workspace.value,
                            workspace_id=workspace.workspace_id,
                            resource_type=AgendaResourceType.calendar.value,
                        )
                    )
                if AgendaResourceType.addressbook.value in resource_types_filter:
                    user_agendas.append(
                        Agenda(
                            agenda_url=self.get_workspace_addressbook_url(
                                workspace, use_proxy=True
                            ),
                            with_credentials=True,
                            agenda_type=AgendaType.workspace.value,
                            workspace_id=workspace.workspace_id,
                            resource_type=AgendaResourceType.addressbook.value,
                        )
                    )
        return user_agendas


class AgendaHooks:
    def sync_workspace_agenda(
        self, workspace: Workspace, context: TracimContext, create_event: bool
    ):
        app_lib = ApplicationApi(app_list=app_list)
        if app_lib.exist(AGENDA__APP_SLUG):
            agenda_api = AgendaApi(
                current_user=None, session=context.dbsession, config=context.app_config
            )
            try:
                state = agenda_api.sync_workspace_agenda(workspace)
                if create_event and state == AgendaCreationState.CREATED:
                    logger.warning(
                        self,
                        "workspace {} is just created but its own agenda already exists !!".format(
                            workspace.workspace_id
                        ),
                    )
            except AgendaServerConnectionError as exc:
                logger.error(self, "Cannot connect to agenda server")
                logger.exception(self, exc)
            except Exception as exc:
                logger.error(self, "Something goes wrong during agenda create/update")
                logger.exception(self, exc)

    def sync_user_agenda(self, user: User, context: TracimContext, create_event: bool):
        app_lib = ApplicationApi(app_list=app_list)
        if app_lib.exist(AGENDA__APP_SLUG):
            agenda_api = AgendaApi(
                current_user=None, session=context.dbsession, config=context.app_config
            )
            try:
                state = agenda_api.sync_user_agenda(user)
                if create_event and state == AgendaCreationState.CREATED:
                    logger.warning(
                        self,
                        "user {} has just been created but their own agenda already exists".format(
                            user.user_id
                        ),
                    )
            except AgendaServerConnectionError as exc:
                logger.error(self, "Cannot connect to the agenda server")
                logger.exception(self, exc)
            except Exception as exc:
                logger.error(self, "Something went wrong during agenda create/update")
                logger.exception(self, exc)

    def sync_workspace_symlinks(
        self, role: UserRoleInWorkspace, context: TracimContext, role_deletion=False
    ):
        app_lib = ApplicationApi(app_list=app_list)
        if app_lib.exist(AGENDA__APP_SLUG):
            agenda_api = AgendaApi(
                current_user=None, session=context.dbsession, config=context.app_config
            )
            agenda_api.sync_workspace_symlinks(
                role.user, role.workspace, role_deletion=role_deletion
            )

    @hookimpl
    def on_workspace_created(self, workspace: Workspace, context: TracimContext) -> None:
        self.sync_workspace_agenda(workspace, context, create_event=True)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, context: TracimContext) -> None:
        self.sync_workspace_agenda(workspace, context, create_event=False)

    @hookimpl
    def on_user_created(self, user: User, context: TracimContext) -> None:
        # TODO - G.M - 04-04-2018 - [auth]
        # Check if this is already needed with new auth system
        user.ensure_auth_token(validity_seconds=context.app_config.USER__AUTH_TOKEN__VALIDITY)
        self.sync_user_agenda(user, context, create_event=True)

    @hookimpl
    def on_user_modified(self, user: User, context: TracimContext) -> None:
        # TODO - G.M - 04-04-2018 - [auth]
        # Check if this is already needed with new auth system
        user.ensure_auth_token(validity_seconds=context.app_config.USER__AUTH_TOKEN__VALIDITY)
        self.sync_user_agenda(user, context, create_event=False)
        for role in user.roles:
            self.sync_workspace_symlinks(role, context)

    @hookimpl
    def on_user_deleted(self, user: User, context: TracimContext) -> None:
        self.sync_user_agenda(user, context, create_event=False)
        for role in user.roles:
            self.sync_workspace_symlinks(role, context)

    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self.sync_workspace_symlinks(role=role, context=context, role_deletion=True)

    @hookimpl
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self.sync_workspace_symlinks(role=role, context=context)

    @hookimpl
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self.sync_workspace_symlinks(role=role, context=context)
