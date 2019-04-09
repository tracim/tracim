# -*- coding: utf-8 -*-
import argparse

import plaster
from pyramid.scripting import AppEnvironment

from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import CalendarServerConnectionError
from tracim_backend.exceptions import CannotCreateCalendar
from tracim_backend.lib.calendar.calendar import CalendarApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from wsgi import CALDAV_APP_NAME
from wsgi import caldav_app


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
        loader = plaster.get_loader(config_uri, protocols=['wsgi'])
        return loader.get_wsgi_server(name=CALDAV_APP_NAME)



class CaldavCreateCalendarsCommand(AppContextCommand):


    def get_description(self) -> str:
        return "create calendar for all workspaces/user"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        return parser

    def take_app_action(
            self,
            parsed_args: argparse.Namespace,
            app_context: AppEnvironment
    ) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context['request'].dbsession
        self._app_config = app_context['registry'].settings['CFG']
        self._user_api = UserApi(
            current_user=None,
            session=self._session,
            config=self._app_config,
        )
        self._workspace_api = WorkspaceApi(
            current_user=None,
            force_role=True,
            session=self._session,
            config=self._app_config,
        )
        self._calendar_api = CalendarApi(
            current_user=None,
            session=self._session,
            config=self._app_config
        )

        # INFO - G.M - 2019-03-13 - check users calendars
        users = self._user_api.get_all()
        nb_error_calendar_access = 0
        for user in users:
            try:
                already_exist = self._calendar_api.ensure_user_calendar_exist(user)
                if not already_exist:
                    print(
                        'New created calendar for user {}'.format(user)
                    )
            except CannotCreateCalendar as exc:
                nb_error_calendar_access += 1
                print('Cannot create calendar for user {}'.format(user.user_id))
                logger.exception(self, exc)
            except CalendarServerConnectionError as exc:
                nb_error_calendar_access += 1
                print('Cannot access to calendar server: connection error.')
                logger.exception(self, exc)
            except Exception as exc:
                nb_error_calendar_access += 1
                print('Something goes wrong during calendar create/update')
                logger.exception(self, exc)
        nb_user_calendars = len(users)
        nb_verified_user_calendar = len(users) - nb_error_calendar_access
        print('{}/{} users calendar verified'.format(nb_verified_user_calendar, nb_user_calendars))

        # # INFO - G.M - 2019-03-13 - check workspaces calendars
        workspaces = self._workspace_api.get_all()
        nb_error_calendar_access = 0
        nb_workspaces = 0
        nb_calendar_enabled_workspace = 0
        for workspace in workspaces:
            nb_workspaces += 1
            if workspace.calendar_enabled:
                nb_calendar_enabled_workspace +=1
                try:
                    already_exist = self._calendar_api.ensure_workspace_calendar_exist(workspace)
                    if not already_exist:
                        print(
                            'New created calendar for workspace {}'.format(workspace.workspace_id)
                        )
                except CannotCreateCalendar as exc:
                    print('Cannot create calendar for workspace {}'.format(workspace.workspace_id))
                    logger.exception(self, exc)
                except CalendarServerConnectionError as exc:
                    nb_error_calendar_access += 1
                    print('Cannot access to calendar server: connection error.')
                    logger.exception(self, exc)
        nb_verified_workspace_calendar = nb_calendar_enabled_workspace - nb_error_calendar_access
        nb_workspace_without_calendar_enabled = nb_workspaces - nb_calendar_enabled_workspace
        print('{}/{} workspace calendar verified ({} workspace without calendar feature enabled)'.format(
            nb_verified_workspace_calendar,
            nb_calendar_enabled_workspace,
            nb_workspace_without_calendar_enabled
        ))