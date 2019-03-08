# -*- coding: utf-8 -*-
import argparse
import plaster
from tracim_backend.command import AppContextCommand
from wsgi import caldav_app
from wsgi import CALDAV_APP_NAME


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
