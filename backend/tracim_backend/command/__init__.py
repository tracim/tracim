# -*- coding: utf-8 -*-
import argparse
from argparse import ArgumentParser
from argparse import Namespace
import logging
import sys
from typing import Any
from typing import List
from typing import Optional

from cliff.app import App
from cliff.command import Command
from cliff.commandmanager import CommandManager
from pyramid.paster import bootstrap
from pyramid.paster import setup_logging

from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.utils import DEFAULT_TRACIM_CONFIG_FILE


class TracimCLI(App):
    def __init__(self) -> None:
        super(TracimCLI, self).__init__(
            description="TracimCli",
            version="0.1",
            command_manager=CommandManager("tracimcli"),
            deferred_help=True,
        )

    def initialize_app(self, argv: List[str]) -> None:
        self.LOG.debug("initialize_app")

    def prepare_to_run_command(self, cmd: Command) -> None:
        self.LOG.debug("prepare_to_run_command %s", cmd.__class__.__name__)

    def clean_up(self, cmd: Command, result: int, err: Any) -> None:
        self.LOG.debug("clean_up %s", cmd.__class__.__name__)
        if err:
            self.LOG.debug("got an error: %s", err)


def main(argv=sys.argv[1:]):
    myapp = TracimCLI()
    return myapp.run(argv)


if __name__ == "__main__":
    main()


class AppContextCommand(Command):
    """
    Command who initialize app context at beginning of take_action method.
    """

    auto_setup_context = True

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        try:
            super(AppContextCommand, self).take_action(parsed_args)
            self._setup_logging(parsed_args)
            if self.auto_setup_context:
                with bootstrap(parsed_args.config_file) as app_context:
                    with app_context["request"].tm:
                        self.take_app_action(parsed_args, app_context)
        except Exception as exc:
            logger.exception(self, exc)
            print("Something goes wrong during command")
            raise exc

    def _setup_logging(self, parsed_args: Namespace) -> None:
        if parsed_args.debug:
            # INFO - G.M - 2019-03-13 - setup logging for config file
            setup_logging(parsed_args.config_file)
        else:
            # INFO - G.M - 2019-03-13 - disable all logging
            logging.config.dictConfig({"version": 1, "disable_existing_loggers": True})

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super(AppContextCommand, self).get_parser(prog_name)

        parser.add_argument(
            "-c",
            "--config",
            help="application config file to read (default: {})".format(DEFAULT_TRACIM_CONFIG_FILE),
            dest="config_file",
            default=DEFAULT_TRACIM_CONFIG_FILE,
        )
        parser.add_argument(
            "-d",
            "--debug_mode",
            help="enable Tracim log for debug",
            dest="debug",
            required=False,
            action="store_true",
            default=False,
        )
        return parser


class Extender(argparse.Action):
    """
    Copied class from http://stackoverflow.com/a/12461237/801924
    """

    def __call__(
        self,
        parser: ArgumentParser,
        namespace: Namespace,
        values: List[str],
        option_strings: Optional[str] = None,
    ) -> None:
        # Need None here incase `argparse.SUPPRESS` was supplied for `dest`
        dest = getattr(namespace, self.dest, None)
        # print dest,self.default,values,option_strings
        if not hasattr(dest, "extend") or dest == self.default:
            dest = []
            setattr(namespace, self.dest, dest)
            # if default isn't set to None, this method might be called
            # with the default as `values` for other arguements which
            # share this destination.
            parser.set_defaults(**{self.dest: None})
        try:
            dest.extend(values)
        except ValueError:
            dest.append(values)
