# -*- coding: utf-8 -*-
import argparse
import os
import sys

import transaction
from gearbox.command import Command
from paste.deploy import loadapp
from webtest import TestApp

from tracim.lib.exception import CommandAbortedError


class BaseCommand(Command):
    """ Setup ap at take_action call """
    auto_setup_app = True

    def run(self, parsed_args):
        try:
            super().run(parsed_args)
        except CommandAbortedError as exc:
            if parsed_args.raise_error:
                raise
            print(exc)

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)

        parser.add_argument(
            "--raise",
            help='Raise CommandAbortedError errors instead print it\'s message',
            dest='raise_error',
            action='store_true',
        )

        return parser


class AppContextCommand(BaseCommand):
    """
    Command who initialize app context at beginning of take_action method.
    """

    def __init__(self, *args, **kwargs):
        super(AppContextCommand, self).__init__(*args, **kwargs)

    @staticmethod
    def _get_initialized_app_context(parsed_args):
        """
        :param parsed_args: parsed args (eg. from take_action)
        :return: (wsgi_app, test_app)
        """
        config_file = parsed_args.config_file
        config_name = 'config:%s' % config_file
        here_dir = os.getcwd()

        # Load locals and populate with objects for use in shell
        sys.path.insert(0, here_dir)

        # Load the wsgi app first so that everything is initialized right
        wsgi_app = loadapp(config_name, relative_to=here_dir, global_conf={
            'disable_daemons': 'true',
        })
        test_app = TestApp(wsgi_app)

        # Make available the tg.request and other global variables
        tresponse = test_app.get('/_test_vars')

        return wsgi_app, test_app

    def take_action(self, parsed_args):
        super(AppContextCommand, self).take_action(parsed_args)
        if self.auto_setup_app:
            self._get_initialized_app_context(parsed_args)

    def get_parser(self, prog_name):
        parser = super(AppContextCommand, self).get_parser(prog_name)

        parser.add_argument("-c", "--config",
                            help='application config file to read (default: development.ini)',
                            dest='config_file', default="development.ini")
        return parser

    def run(self, parsed_args):
        super().run(parsed_args)
        transaction.commit()


class Extender(argparse.Action):
    """
    Copied class from http://stackoverflow.com/a/12461237/801924
    """
    def __call__(self, parser, namespace, values, option_strings=None):
        # Need None here incase `argparse.SUPPRESS` was supplied for `dest`
        dest = getattr(namespace, self.dest, None)
        # print dest,self.default,values,option_strings
        if not hasattr(dest, 'extend') or dest == self.default:
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
