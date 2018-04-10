# -*- coding: utf-8 -*-
import argparse

import plaster_pastedeploy
import transaction
from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

from tracim import CFG
from tracim.fixtures import FixturesLoader
from tracim.fixtures.users_and_groups import Base as BaseFixture
from sqlalchemy.exc import IntegrityError
from tracim.command import AppContextCommand
from tracim.models.meta import DeclarativeBase
from tracim.models import (
    get_engine,
    get_session_factory,
    get_tm_session,
    )


class InitializeDBCommand(AppContextCommand):
    auto_setup_context = False

    def get_description(self) -> str:
        return "Initialize DB"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        return parser

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(InitializeDBCommand, self).take_action(parsed_args)
        config_uri = parsed_args.config_file
        setup_logging(config_uri)
        settings = get_appsettings(config_uri)
        self._create_schema(settings)
        self._populate_database(settings)

    @classmethod
    def _create_schema(
            cls,
            settings: plaster_pastedeploy.ConfigDict
    ) -> None:
        print("- Create Schemas of databases -")
        engine = get_engine(settings)
        DeclarativeBase.metadata.create_all(engine)

    @classmethod
    def _populate_database(
            cls,
            settings: plaster_pastedeploy.ConfigDict
    ) -> None:
        engine = get_engine(settings)
        session_factory = get_session_factory(engine)
        app_config = CFG(settings)
        print("- Populate database with default data -")
        with transaction.manager:
            dbsession = get_tm_session(session_factory, transaction.manager)
            try:
                fixtures_loader = FixturesLoader(dbsession, app_config)
                fixtures_loader.loads([BaseFixture])
                transaction.commit()
                print("Database initialized.")
            except IntegrityError:
                print('Warning, there was a problem when adding default data'
                      ', it may have already been added:')
                import traceback
                print(traceback.format_exc())
                transaction.abort()
                print('Database initialization failed')
