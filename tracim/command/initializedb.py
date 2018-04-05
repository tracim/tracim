# -*- coding: utf-8 -*-
import os
import sys
import transaction

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )
from pyramid.scripts.common import parse_vars

from tracim.command import AppContextCommand
from tracim.models.meta import DeclarativeBase
from tracim.models import (
    get_engine,
    get_session_factory,
    get_tm_session,
    )


class InitializeDBCommand(AppContextCommand):
    auto_setup_context = False

    def get_description(self):
        return "Initialize DB"

    def get_epilog(self):
        return "################"

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        return parser

    def take_action(self, parsed_args):
        super(InitializeDBCommand, self).take_action(parsed_args)
        config_uri = parsed_args.config_file

        setup_logging(config_uri)
        settings = get_appsettings(config_uri)
        engine = get_engine(settings)
        DeclarativeBase.metadata.create_all(engine)
        session_factory = get_session_factory(engine)

        with transaction.manager:
            pass
            # dbsession = get_tm_session(session_factory, transaction.manager)
            # model = MyModel(name='one', value=1)
            # dbsession.add(model)
            # Add global manager data, just for test