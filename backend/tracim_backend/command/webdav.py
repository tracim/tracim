# -*- coding: utf-8 -*-
import argparse
import plaster
from tracim_backend.command import AppContextCommand
from wsgi import webdav_app
from wsgi import WEBDAV_APP_NAME


class WebdavRunnerCommand(AppContextCommand):
    auto_setup_context = False

    def get_description(self) -> str:
        return "run webdav server"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        return parser

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(WebdavRunnerCommand, self).take_action(parsed_args)
        tracim_config = parsed_args.config_file
        # TODO - G.M - 16-04-2018 - Allow specific webdav config file
        app = webdav_app(tracim_config)
        server = self._get_server(tracim_config)
        server(app)

    def _get_server(self, config_uri: str):
        loader = plaster.get_loader(config_uri, protocols=['wsgi'])
        return loader.get_wsgi_server(name=WEBDAV_APP_NAME)
