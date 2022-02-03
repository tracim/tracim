# -*- coding: utf-8 -*-
import argparse

import plaster
from pyramid.scripting import AppEnvironment

from tracim_backend.applications.agenda.lib import AgendaApi
from tracim_backend.applications.agenda.lib import AgendaSyncState
from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import AgendaServerConnectionError
from tracim_backend.exceptions import CannotCreateAgendaResource
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.wsgi import CALDAV_APP_NAME
from tracim_backend.wsgi import caldav_app


class CaldavRunnerCommand(AppContextCommand):
    auto_setup_context = False

    def get_description(self) -> str:
        return "run caldav/radicale server"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        return parser

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(CaldavRunnerCommand, self).take_action(parsed_args)
        tracim_config = parsed_args.config_file
        app = caldav_app(tracim_config)
        server = self._get_server(tracim_config)
        server(app)

    def _get_server(self, config_uri: str):
        loader = plaster.get_loader(config_uri, protocols=["wsgi"])
        return loader.get_wsgi_server(name=CALDAV_APP_NAME)


class CaldavSyncCommand(AppContextCommand):
    def get_description(self) -> str:
        return "synchronize tracim with radicale"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self._user_api = UserApi(current_user=None, session=self._session, config=self._app_config)
        self._workspace_api = WorkspaceApi(
            current_user=None, force_role=True, session=self._session, config=self._app_config
        )
        self._agenda_api = AgendaApi(
            current_user=None, session=self._session, config=self._app_config
        )

        # INFO - G.M - 2019-03-13 - check users agendas
        users = self._user_api.get_all()
        nb_error_agenda_access = 0
        for user in users:
            try:
                state = self._agenda_api.sync_user_agenda(user=user)
                if state == AgendaSyncState.CREATED:
                    print("New created agenda for user {}".format(user.user_id))
            except CannotCreateAgendaResource as exc:
                nb_error_agenda_access += 1
                print("Cannot create agenda for user {}".format(user.user_id))
                logger.exception(self, exc)
            except AgendaServerConnectionError as exc:
                nb_error_agenda_access += 1
                print("Cannot access to agenda server: connection error.")
                logger.exception(self, exc)
            except Exception as exc:
                nb_error_agenda_access += 1
                print("Something goes wrong during agenda create/update")
                logger.exception(self, exc)
        nb_user_agendas = len(users)
        nb_verified_user_agenda = len(users) - nb_error_agenda_access
        print("{}/{} users agenda verified".format(nb_verified_user_agenda, nb_user_agendas))

        # # INFO - G.M - 2019-03-13 - check workspaces agendas
        workspaces = self._workspace_api.get_all()
        nb_error_agenda_access = 0
        nb_workspaces = 0
        nb_agenda_enabled_workspace = 0
        for workspace in workspaces:
            nb_workspaces += 1
            try:
                state = self._agenda_api.sync_workspace_agenda(workspace=workspace)
                if state in [AgendaSyncState.CREATED, AgendaSyncState.EXISTING]:
                    nb_agenda_enabled_workspace += 1
                if state == AgendaSyncState.CREATED:
                    print("New created agenda for workspace {}".format(workspace.workspace_id))
            except CannotCreateAgendaResource as exc:
                print("Cannot create agenda for workspace {}".format(workspace.workspace_id))
                logger.exception(self, exc)
            except AgendaServerConnectionError as exc:
                nb_error_agenda_access += 1
                print("Cannot access to agenda server: connection error.")
                logger.exception(self, exc)
        nb_verified_workspace_agenda = nb_agenda_enabled_workspace - nb_error_agenda_access
        nb_workspace_without_agenda_enabled = nb_workspaces - nb_agenda_enabled_workspace
        print(
            "{}/{} workspace agenda verified ({} workspace without agenda feature enabled)".format(
                nb_verified_workspace_agenda,
                nb_agenda_enabled_workspace,
                nb_workspace_without_agenda_enabled,
            )
        )
