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
from tracim_backend.applications.agenda.schemas import AgendaType
from tracim_backend.apps import AGENDA__APP_SLUG
from tracim_backend.config import CFG
from tracim_backend.exceptions import AgendaPropsUpdateFailed
from tracim_backend.exceptions import AgendaServerConnectionError
from tracim_backend.exceptions import CannotCreateAgenda
from tracim_backend.exceptions import WorkspaceAgendaDisabledException
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import Agenda
from tracim_backend.models.data import Workspace

CREATE_AGENDA_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" ?>
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


class CalendarDescription(ValuedBaseElement):
    tag = ns("C", "calendar-description")


class AgendaApi(object):
    def __init__(self, session: Session, current_user: typing.Optional[User], config: CFG) -> None:
        self._user = current_user
        self._session = session
        self._config = config

    def _check_agenda_exist(self, agenda_url) -> bool:
        try:
            response = requests.get(agenda_url)
        except requests.exceptions.ConnectionError as exc:
            logger.error(self, "Cannot check agenda existence, connection error to radicale server")
            logger.exception(self, exc)
            raise AgendaServerConnectionError() from exc
        if response.status_code < 400:
            return True
        else:
            # TODO - G.M - 2019-03-13 - Better deal with other error code
            return False

    def _create_agenda(self, agenda_url, agenda_name, agenda_description):
        logger.debug(self, "create a new caldav agenda at url {}".format(agenda_url))
        # INFO - G.M - 2019-05-10 - we use str as pick key as it is determinist: same
        # result between run. default method use hash which use random hash for security concern
        body = CREATE_AGENDA_TEMPLATE.format(
            agenda_name=escape(agenda_name),
            agenda_color=Color(pick_for=agenda_name, pick_key=str).get_hex(),
            agenda_description=escape(agenda_description),
        )
        try:
            response = requests.request("mkcol", agenda_url, data=body.encode("utf-8"))
        except requests.exceptions.ConnectionError as exc:
            raise AgendaServerConnectionError() from exc
        if not response.status_code == 201:
            raise CannotCreateAgenda(
                "Agenda {} cannot be created:{},{}".format(
                    agenda_url, response.status_code, response.content
                )
            )
        logger.info(self, "new caldav agenda created at url {}".format(agenda_url))

    def _update_agenda_props(self, agenda_url, agenda_name, agenda_description):
        logger.debug(self, "update existing caldav agenda props at url {}".format(agenda_url))
        # force renaming of agenda to be sure of consistency
        try:
            caldav_client = caldav.DAVClient(username="tracim", password="tracim", url=agenda_url)
            agenda = caldav.objects.Calendar(client=caldav_client, url=agenda_url)
            props = agenda.get_properties([caldav.dav.DisplayName(), CalendarDescription()])
            # TODO - G.M - 2019-04-11 - Rewrote this better, we need to verify
            # if value are same but as props may be None but agenda_description
            # can be '' we need to convert thing in order that '' is same as None.
            if agenda_name != str(
                props.get(caldav.dav.DisplayName().tag) or ""
            ) or agenda_description != str(props.get(CalendarDescription().tag) or ""):
                agenda.set_properties(
                    [caldav.dav.DisplayName(agenda_name), CalendarDescription(agenda_description)]
                )
                logger.debug(self, "props for calendar at url {} updated".format(agenda_url))
            else:
                logger.debug(self, "No props to update for calendar at url {}".format(agenda_url))
        except Exception as exc:
            raise AgendaPropsUpdateFailed("Failed to update props of agenda") from exc

    def _get_agenda_base_url(self, use_proxy: bool) -> str:
        if use_proxy:
            base_url = self._config.WEBSITE__BASE_URL
        else:
            base_url = self._config.CALDAV__RADICALE_PROXY__BASE_URL
        return base_url

    def get_workspace_agenda_url(self, workspace: Workspace, use_proxy: bool) -> str:
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        return "{}{}{}/".format(
            base_url, self._config.CALDAV_RADICALE_WORKSPACE_PATH, workspace.workspace_id
        )

    def get_user_agenda_url(self, user: User, use_proxy: bool) -> str:
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        return "{}{}{}/".format(base_url, self._config.CALDAV__RADICALE__USER_PATH, user.user_id)

    def ensure_workspace_agenda_exists(self, workspace: Workspace) -> bool:
        """
        Return true if agenda already exist, false if it was just create,
        raise Exception if agenda cannot be created.
        """
        logger.debug(
            self, "check for agenda existence of workspace {}".format(workspace.workspace_id)
        )
        if not workspace.agenda_enabled:
            raise WorkspaceAgendaDisabledException()
        workspace_agenda_url = self.get_workspace_agenda_url(workspace, use_proxy=False)
        if not self._check_agenda_exist(workspace_agenda_url):
            self._create_agenda(
                agenda_url=workspace_agenda_url,
                agenda_name=workspace.label,
                agenda_description=workspace.description,
            )
            result = False
        else:
            self._update_agenda_props(
                agenda_url=workspace_agenda_url,
                agenda_name=workspace.label,
                agenda_description=workspace.description,
            )
            result = True
        for role in workspace.roles:
            self._create_workspace_symlink(workspace.workspace_id, role.user_id, type="agenda")
        return result

    def ensure_user_agenda_exists(self, user: User) -> bool:
        """
        Return true if agenda already exist, false if it was just create,
        raise Exception if agenda cannot be created.
        """
        logger.debug(self, "check for agenda existence of user {}".format(user.user_id))
        user_agenda_url = self.get_user_agenda_url(user, use_proxy=False)
        if not self._check_agenda_exist(user_agenda_url):
            self._create_agenda(
                agenda_url=user_agenda_url, agenda_name=user.display_name, agenda_description=""
            )
            result = False
        else:
            self._update_agenda_props(
                agenda_url=user_agenda_url, agenda_name=user.display_name, agenda_description=""
            )
            result = True
        self._create_user_symlink(user.user_id, user.user_id, type="agenda")
        return result

    def _delete_user_symlink(self, original_user_id: int, dest_user_id: int, type="agenda"):
        symlink_path = "{}{}{}/{}".format(
            self._config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            "/user_resource_{}".format(dest_user_id),
            "{}_{}_{}".format("user", original_user_id, "type"),
        )
        os.remove(symlink_path)

    def _create_user_symlink(self, original_user_id: int, dest_user_id: int, type="agenda"):
        original_agenda_path = "{}{}{}{}".format(
            self._config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            self._config.CALDAV__RADICALE__USER_PATH,
            original_user_id,
        )
        os.makedirs(
            "{}{}{}".format(
                self._config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
                "/collection-root",
                "/user_resource_{}".format(dest_user_id),
                dest_user_id,
            ),
            exist_ok=True,
        )
        symlink_path = "{}{}{}/{}".format(
            self._config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            "/user_resource_{}".format(dest_user_id),
            "{}_{}_{}".format("user", original_user_id, type),
        )
        if not os.path.islink(symlink_path):
            os.symlink(original_agenda_path, symlink_path)

    def _delete_workspace_symlink(self, workspace_id: int, dest_user_id: int, type="agenda"):
        symlink_path = "{}{}{}/{}".format(
            self._config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            "/user_resource_{}".format(dest_user_id),
            "{}_{}_{}".format("space", workspace_id, type),
        )
        os.remove(symlink_path)

    def _create_workspace_symlink(self, workspace_id: int, dest_user_id: int, type="agenda"):
        original_agenda_path = "{}{}{}{}".format(
            self._config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            self._config.CALDAV_RADICALE_WORKSPACE_PATH,
            workspace_id,
        )
        os.makedirs(
            "{}{}{}".format(
                self._config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
                "/collection-root",
                "/user_resource_{}".format(dest_user_id),
            ),
            exist_ok=True,
        )
        symlink_path = "{}{}{}/{}".format(
            self._config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            "/collection-root",
            "/user_resource_{}".format(dest_user_id),
            "{}_{}_{}".format("space", workspace_id, type),
        )
        if not os.path.islink(symlink_path):
            os.symlink(original_agenda_path, symlink_path)

    def get_user_agendas(
        self,
        user: User,
        workspaces_ids_filter: typing.Optional[typing.List[int]],
        agenda_types_filter: typing.Optional[str],
    ) -> typing.List[Agenda]:
        user_agendas = []

        if not agenda_types_filter:
            agenda_types_filter = [agenda.value for agenda in AgendaType]

        if AgendaType.private.value in agenda_types_filter and not workspaces_ids_filter:
            user_agendas.append(
                Agenda(
                    agenda_url=self.get_user_agenda_url(user, use_proxy=True),
                    with_credentials=True,
                    agenda_type=AgendaType.private.value,
                    workspace_id=None,
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
                user_agendas.append(
                    Agenda(
                        agenda_url=self.get_workspace_agenda_url(workspace, use_proxy=True),
                        with_credentials=True,
                        agenda_type=AgendaType.workspace.value,
                        workspace_id=workspace.workspace_id,
                    )
                )
        return user_agendas


class AgendaHooks:
    def ensure_workspace_agenda_exists(
        self, workspace: Workspace, context: TracimContext, create_event: bool
    ):
        app_lib = ApplicationApi(app_list=app_list)
        if app_lib.exist(AGENDA__APP_SLUG):
            if workspace.agenda_enabled:
                agenda_api = AgendaApi(
                    current_user=None, session=context.dbsession, config=context.app_config
                )
                try:
                    agenda_already_exist = agenda_api.ensure_workspace_agenda_exists(workspace)
                    if create_event and agenda_already_exist:
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

    def ensure_user_agenda_exists(self, user: User, context: TracimContext, create_event: bool):
        app_lib = ApplicationApi(app_list=app_list)
        if app_lib.exist(AGENDA__APP_SLUG):
            agenda_api = AgendaApi(
                current_user=None, session=context.dbsession, config=context.app_config
            )
            try:
                agenda_already_exist = agenda_api.ensure_user_agenda_exists(user)
                if agenda_already_exist and create_event:
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

    @hookimpl
    def on_workspace_created(self, workspace: Workspace, context: TracimContext) -> None:
        self.ensure_workspace_agenda_exists(workspace, context, create_event=True)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, context: TracimContext) -> None:

        self.ensure_workspace_agenda_exists(workspace, context, create_event=False)

    @hookimpl
    def on_user_created(self, user: User, context: TracimContext) -> None:

        # TODO - G.M - 04-04-2018 - [auth]
        # Check if this is already needed with new auth system
        user.ensure_auth_token(validity_seconds=context.app_config.USER__AUTH_TOKEN__VALIDITY)
        self.ensure_user_agenda_exists(user, context, create_event=True)

    @hookimpl
    def on_user_modified(self, user: User, context: TracimContext) -> None:
        # TODO - G.M - 04-04-2018 - [auth]
        # Check if this is already needed with new auth system
        user.ensure_auth_token(validity_seconds=context.app_config.USER__AUTH_TOKEN__VALIDITY)
        self.ensure_user_agenda_exists(user, context, create_event=False)
