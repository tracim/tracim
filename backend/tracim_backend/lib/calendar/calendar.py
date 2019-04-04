import typing

import requests
from colour import Color
from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.exceptions import AgendaServerConnectionError
from tracim_backend.exceptions import CannotCreateAgenda
from tracim_backend.exceptions import WorkspaceAgendaDisabledException
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import Agenda
from tracim_backend.models.data import Workspace
from tracim_backend.views.agenda_api.schemas import AgendaType

CREATE_AGENDA_TEMPLATE = \
"""<?xml version="1.0" encoding="UTF-8" ?>
<create xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:I="http://apple.com/ns/ical/">
  <set>
    <prop>
      <resourcetype>
        <collection />
        <C:agenda />
      </resourcetype>
      <C:supported-agenda-component-set>
        <C:comp name="VEVENT" />
        <C:comp name="VJOURNAL" />
        <C:comp name="VTODO" />
      </C:supported-agenda-component-set>
      <displayname>{agenda_name}</displayname>
      <C:agenda-description>{agenda_description}</C:agenda-description>
      <I:agenda-color>{agenda_color}</I:agenda-color>
    </prop>
  </set>
</create>
"""

class AgendaApi(object):

    def __init__(
            self,
            session: Session,
            current_user: typing.Optional[User],
            config: CFG
    ):
        self._user = current_user
        self._session = session
        self._config = config


    def _check_agenda_exist(self, agenda_url) -> bool:
        try:
            response = requests.get(agenda_url)
        except requests.exceptions.ConnectionError as exc:
            logger.error(self, 'Cannot check agenda existence, connection error to radicale server')
            logger.exception(self, exc)
            raise AgendaServerConnectionError() from exc
        if response.status_code < 400:
            return True
        else:
            # TODO - G.M - 2019-03-13 - Better deal with other error code
            return False

    def _create_agenda(self, agenda_url, agenda_name, agenda_description):
        logger.debug(self, 'create a new caldav agenda at url {}'.format(agenda_url))
        body = CREATE_AGENDA_TEMPLATE.format(
            agenda_name=agenda_name,
            agenda_color=Color(pick_for='agenda_name').get_hex(),
            agenda_description=agenda_description,
        )
        try:
            response = requests.request('mkcol', agenda_url, data=body)
        except requests.exceptions.ConnectionError as exc:
            raise AgendaServerConnectionError() from exc
        if not response.status_code == 201:
            raise CannotCreateAgenda('Agenda {} cannot be created:{},{}'.format(agenda_url, response.status_code, response.content))
        logger.info(self, 'new caldav agenda created at url {}'.format(agenda_url))

    def _get_agenda_base_url(self, use_proxy: bool):
        if use_proxy:
            base_url = self._config.WEBSITE_BASE_URL
        else:
            base_url = self._config.CALDAV_RADICALE_PROXY_BASE_URL
        return base_url

    def get_workspace_agenda_url(self, workspace: Workspace, use_proxy: bool) -> str:
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        return '{}{}{}/'.format(base_url, self._config.CALDAV_RADICALE_WORKSPACE_PATH, workspace.workspace_id)

    def get_user_agenda_url(self, user: User, use_proxy: bool) -> str:
        base_url = self._get_agenda_base_url(use_proxy=use_proxy)
        return '{}{}{}/'.format(base_url, self._config.CALDAV_RADICALE_USER_PATH, user.user_id)

    def ensure_workspace_agenda_exist(self, workspace: Workspace) -> bool:
        """
        Return true if agenda already exist, false if it was just create,
        raise Exception if agenda cannot be created.
        """
        logger.debug(self, 'check for agenda existence of workspace {}'.format(workspace.workspace_id))
        if not workspace.agenda_enabled:
            raise WorkspaceAgendaDisabledException()
        workspace_agenda_url = self.get_workspace_agenda_url(workspace, use_proxy=False)
        if not self._check_agenda_exist(workspace_agenda_url):
            self._create_agenda(
                agenda_url=workspace_agenda_url,
                agenda_name=workspace.label,
                agenda_description=workspace.description,
            )
            return False
        return True

    def ensure_user_agenda_exist(self, user: User) -> bool:
        """
        Return true if agenda already exist, false if it was just create,
        raise Exception if agenda cannot be created.
        """
        logger.debug(self, 'check for agenda existence of user {}'.format(user.user_id))
        user_agenda_url = self.get_user_agenda_url(user, use_proxy=False)
        if not self._check_agenda_exist(user_agenda_url):
            self._create_agenda(
                agenda_url=user_agenda_url,
                agenda_name=user.display_name,
                agenda_description='',
            )
            return False
        return True

    def get_user_agendas(
            self,
            user:User,
            workspaces_ids_filter: typing.Optional[typing.List[int]],
            agenda_types_filter: typing.Optional[str]
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
                current_user=self._user,
                session=self._session,
                config=self._config
            )
            workspaces = workspace_api.get_all_for_user(user)
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
                        workspace_id=workspace.workspace_id
                    )
                )
        return user_agendas
