# -*- coding: utf-8 -*-
import argparse

import plaster_pastedeploy
import transaction
from depot.manager import DepotManager
from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

from tracim import CFG
from tracim.fixtures import FixturesLoader
from tracim.fixtures.users_and_groups import Base as BaseFixture
from tracim.fixtures.content import Content as ContentFixture
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
        return "Initialize database"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--test-data",
            help='Add some default data to database to make test',
            dest='test_data',
            required=False,
            action='store_true',
            default=False,
        )
        return parser

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(InitializeDBCommand, self).take_action(parsed_args)
        config_uri = parsed_args.config_file
        setup_logging(config_uri)
        settings = get_appsettings(config_uri)
        self._create_schema(settings)
        self._populate_database(settings, add_test_data=parsed_args.test_data)

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
            settings: plaster_pastedeploy.ConfigDict,
            add_test_data: bool
    ) -> None:
        engine = get_engine(settings)
        session_factory = get_session_factory(engine)
        app_config = CFG(settings)
        print("- Populate database with default data -")
        with transaction.manager:
            dbsession = get_tm_session(session_factory, transaction.manager)
            try:
                fixtures = [BaseFixture]
                fixtures_loader = FixturesLoader(dbsession, app_config)
                fixtures_loader.loads(fixtures)
                transaction.commit()
                if add_test_data:
                    app_config.configure_filedepot()
                    fixtures = [ContentFixture]
                    fixtures_loader.loads(fixtures)
                transaction.commit()
                print("Database initialized.")
            except IntegrityError:
                print('Warning, there was a problem when adding default data'
                      ', it may have already been added:')
                import traceback
                print(traceback.format_exc())
                transaction.abort()
                print('Database initialization failed')


class DeleteDBCommand(AppContextCommand):
    auto_setup_context = False

    def get_description(self) -> str:
        return "Delete database"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--force",
            help='force delete of database',
            dest='force',
            required=False,
            action='store_true',
            default=False,
        )
        return parser

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(DeleteDBCommand, self).take_action(parsed_args)
        config_uri = parsed_args.config_file
        setup_logging(config_uri)
        settings = get_appsettings(config_uri)
        engine = get_engine(settings)
        app_config = CFG(settings)
        app_config.configure_filedepot()

        if parsed_args.force:
            print('Database deletion begin.')
            DeclarativeBase.metadata.drop_all(engine)
            print('Database deletion done.')
            print('Cleaning depot begin.')
            depot = DepotManager.get()
            depot_files = depot.list()
            for file_ in depot_files:
                depot.delete(file_)
            print('Cleaning depot done.')
        else:
            print('Warning, You should use --force if you really want to'
                  ' delete database.')
