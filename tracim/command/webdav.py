# -*- coding: utf-8 -*-
import argparse

import plaster_pastedeploy
from waitress import serve

from tracim.command import AppContextCommand
from tracim.lib.webdav import WebdavAppFactory
from wsgi import webdav_app


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
        serve(app, port=app.config['port'], host=app.config['host'])
