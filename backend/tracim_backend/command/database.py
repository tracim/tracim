# -*- coding: utf-8 -*-
import argparse
import re
import traceback
import typing

from depot.io.utils import FileIntent
from depot.manager import DepotManager
from pyramid.paster import get_appsettings
from sqlalchemy.engine import reflection
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import transaction

from tracim_backend.command import AppContextCommand
from tracim_backend.config import CFG
from tracim_backend.exceptions import DatabaseInitializationFailed
from tracim_backend.exceptions import ForceArgumentNeeded
from tracim_backend.fixtures import FixturesLoader
from tracim_backend.fixtures.content import Content as ContentFixture
from tracim_backend.fixtures.users import Base as BaseFixture
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.setup_models import get_engine
from tracim_backend.models.setup_models import get_session_factory
from tracim_backend.models.setup_models import get_tm_session


class InitializeDBCommand(AppContextCommand):
    auto_setup_context = False

    def get_description(self) -> str:
        return "Initialize database"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--test-data",
            help="Add some default data to database to make test",
            dest="test_data",
            required=False,
            action="store_true",
            default=False,
        )
        return parser

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(InitializeDBCommand, self).take_action(parsed_args)
        config_uri = parsed_args.config_file
        settings = get_appsettings(config_uri)
        # INFO - G.M - 2018-06-178 - We need to add info from [DEFAULT]
        # section of config file in order to have both global and
        # web app specific param.
        settings.update(settings.global_conf)
        app_config = CFG(settings)
        self._create_schema(app_config)
        self._populate_database(app_config, add_test_data=parsed_args.test_data)

    @classmethod
    def _create_schema(cls, app_config: CFG) -> None:
        print("- Create Schemas of databases -")
        engine = get_engine(app_config)
        DeclarativeBase.metadata.create_all(engine)

    @classmethod
    def _populate_database(cls, app_config: CFG, add_test_data: bool) -> None:
        engine = get_engine(app_config)
        session_factory = get_session_factory(engine)
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
            except IntegrityError as exc:
                transaction.abort()
                print("Database initialization failed")
                raise DatabaseInitializationFailed(
                    "Warning, there was a problem when adding default data"
                    ", it may have already been added."
                ) from exc


class DeleteDBCommand(AppContextCommand):
    auto_setup_context = False

    def get_description(self) -> str:
        return "Delete database"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--force",
            help="force delete of database",
            dest="force",
            required=False,
            action="store_true",
            default=False,
        )
        return parser

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(DeleteDBCommand, self).take_action(parsed_args)
        config_uri = parsed_args.config_file
        # setup_logging(config_uri)
        settings = get_appsettings(config_uri)
        settings.update(settings.global_conf)
        app_config = CFG(settings)
        app_config.configure_filedepot()
        engine = get_engine(app_config)

        if parsed_args.force:
            print("Database deletion begin.")
            DeclarativeBase.metadata.drop_all(engine)
            print("Database deletion done.")
            try:
                print("Cleaning depot begin.")
                depot = DepotManager.get(app_config.UPLOADED_FILES__STORAGE__STORAGE_NAME)
                depot_files = depot.list()
                for file_ in depot_files:
                    try:
                        depot.delete(file_)
                    # TODO - G.M - 2019-05-09 - better handling of specific exception here
                    except Exception as exc:
                        traceback.print_exc()
                        print("Something goes wrong during deletion of {}".format(file_))
                        raise exc
                print("Cleaning depot done.")
            except FileNotFoundError:
                print("Warning! Can delete depots file, is depot path correctly" " configured?")
        else:
            force_arg_required = (
                "Warning! You should use --force if you really want to delete database."
            )
            print(force_arg_required)
            print("Database not deleted")
            raise ForceArgumentNeeded(force_arg_required)


class MigrateMysqlCharsetCommand(AppContextCommand):
    auto_setup_context = False
    DEFAULT_COLLATION = "utf8mb4_unicode_520_ci"
    DEFAULT_CHARSET = "utf8mb4"

    def get_description(self) -> str:
        return "change Mysql/Mariadb charset/collation"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--collation",
            help="set database collation",
            dest="collation",
            required=False,
            default=None,
        )
        parser.add_argument(
            "--charset", help="set database charset", dest="charset", required=False, default=None,
        )
        return parser

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(MigrateMysqlCharsetCommand, self).take_action(parsed_args)
        config_uri = parsed_args.config_file
        settings = get_appsettings(config_uri)
        settings.update(settings.global_conf)
        app_config = CFG(settings)
        app_config.configure_filedepot()
        engine = get_engine(app_config)
        inspector = reflection.Inspector.from_engine(engine)
        database_name = engine.url.database
        collation = parsed_args.collation or self.DEFAULT_COLLATION
        charset = parsed_args.charset or self.DEFAULT_CHARSET
        if not engine.dialect.name.startswith("mysql"):
            raise ValueError("This command is only supported on Mysql/Mariadb databases")
        logger.info(self, "Database not deleted")
        set_database = "ALTER DATABASE {database} CHARACTER SET {charset} COLLATE {collation};".format(
            database=database_name, charset=charset, collation=collation
        )
        logger.debug(self, set_database)
        engine.execute(set_database)
        for table in inspector.get_table_names():
            set_table = "ALTER TABLE {table} CONVERT TO CHARACTER SET {charset} COLLATE {collation};".format(
                table=table, charset=charset, collation=collation
            )
            logger.debug(self, set_table)
            engine.execute(set_table)
        print('Database set to "{}" character set with "{}" collation '.format(charset, collation))


class UpdateNamingConventionsV1ToV2Command(AppContextCommand):
    auto_setup_context = False

    def get_description(self) -> str:
        return "Update database naming conventions from V1 database to V2"

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(UpdateNamingConventionsV1ToV2Command, self).take_action(parsed_args)
        config_uri = parsed_args.config_file
        settings = get_appsettings(config_uri)
        settings.update(settings.global_conf)
        app_config = CFG(settings)
        app_config.configure_filedepot()
        engine = get_engine(app_config)
        inspector = reflection.Inspector.from_engine(engine)
        v1_unique_convention = re.compile(r"uk__(\w+)__(\w+)")
        v1_foreign_key_convention = re.compile(r"fk__(\w+)__(\w+)__(\w+)")
        v1_primary_key_convention = re.compile(r"pk__(\w+)")

        if not engine.dialect.name.startswith("postgresql"):
            raise ValueError("This command is only supported on PostgreSQL databases")

        with engine.begin():
            for table_name in inspector.get_table_names():
                if table_name == "migrate_version":
                    continue

                for unique_constraint in inspector.get_unique_constraints(table_name):
                    match = v1_unique_convention.search(unique_constraint["name"])
                    if match:
                        new_name = "uq__{}__{}".format(match.group(1), match.group(2))
                        engine.execute(
                            "ALTER TABLE {} RENAME CONSTRAINT {} TO {}".format(
                                table_name, unique_constraint["name"], new_name
                            )
                        )

                for foreign_key in inspector.get_foreign_keys(table_name):
                    match = v1_foreign_key_convention.search(foreign_key["name"])
                    # special cases for content_revisions and revision_read_status
                    if foreign_key["name"] == "fk__content_revisions__owner_id":
                        new_name = "fk_content_revisions_owner_id_users"
                        engine.execute(
                            "ALTER TABLE {} RENAME CONSTRAINT {} TO {}".format(
                                table_name, foreign_key["name"], new_name
                            )
                        )
                    elif foreign_key["name"] == "revision_read_status_revision_id_fkey":
                        new_name = "fk_revision_read_status_revision_id_content_revisions"
                        engine.execute(
                            "ALTER TABLE {} RENAME CONSTRAINT {} TO {}".format(
                                table_name, foreign_key["name"], new_name
                            )
                        )
                    elif foreign_key["name"] == "revision_read_status_user_id_fkey":
                        new_name = "fk_revision_read_status_user_id_users"
                        engine.execute(
                            "ALTER TABLE {} RENAME CONSTRAINT {} TO {}".format(
                                table_name, foreign_key["name"], new_name
                            )
                        )
                    elif match:
                        new_name = "fk_{}_{}_{}".format(
                            match.group(1), match.group(2), match.group(3)
                        )
                        engine.execute(
                            "ALTER TABLE {} RENAME CONSTRAINT {} TO {}".format(
                                table_name, foreign_key["name"], new_name
                            )
                        )

                primary_key = inspector.get_pk_constraint(table_name)
                if primary_key:
                    match = v1_primary_key_convention.search(primary_key["name"])
                    if primary_key["name"] == "pk__users__user_id":
                        engine.execute(
                            "ALTER INDEX {} RENAME TO pk_users".format(primary_key["name"])
                        )
                    elif primary_key["name"] == "pk__content_revisions__revision_id":
                        engine.execute(
                            "ALTER INDEX {} RENAME TO pk_content_revisions".format(
                                primary_key["name"]
                            )
                        )
                    elif primary_key["name"] == "pk__user_workspace__user_id__workspace_id":
                        engine.execute(
                            "ALTER INDEX {} RENAME TO pk_user_workspace".format(primary_key["name"])
                        )
                    elif primary_key["name"] == "pk__workspace__workspace_id":
                        engine.execute(
                            "ALTER INDEX {} RENAME TO pk_workspaces".format(primary_key["name"])
                        )
                    elif primary_key["name"] == "revision_read_status_pkey":
                        engine.execute(
                            "ALTER INDEX {} RENAME TO pk_revision_read_status".format(
                                primary_key["name"]
                            )
                        )
                    elif match:
                        new_name = "pk_{}".format(match.group(1))
                        engine.execute(
                            "ALTER INDEX {} RENAME TO {}".format(primary_key["name"], new_name)
                        )


class MigrateStorageCommand(AppContextCommand):
    auto_setup_context = False

    def get_description(self) -> str:
        return "migrate database storage"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-o",
            "--old-config",
            help="old configuration file to use",
            dest="old_config_file",
            required=True,
        )
        return parser

    def _reupload_depot_file(self, db_object, field_names: typing.List[str], dbsession: Session):
        for field_name in field_names:
            field_value = getattr(db_object, field_name)
            if field_value:
                setattr(
                    db_object,
                    field_name,
                    FileIntent(field_value.file, field_value.filename, field_value.content_type),
                )
                dbsession.add(db_object)
                dbsession.flush()

    def take_action(self, parsed_args: argparse.Namespace) -> None:
        super(MigrateStorageCommand, self).take_action(parsed_args)

        config_uri = parsed_args.config_file
        settings = get_appsettings(config_uri)
        settings.update(settings.global_conf)
        new_cfg = CFG(settings)
        new_cfg.configure_filedepot()

        old_config_uri = parsed_args.old_config_file
        old_settings = get_appsettings(old_config_uri)
        old_settings.update(old_settings.global_conf)
        old_cfg = CFG(old_settings)
        old_cfg.configure_filedepot()

        original_storage_name = old_cfg.UPLOADED_FILES__STORAGE__STORAGE_NAME
        original_storage_type = old_cfg.UPLOADED_FILES__STORAGE__STORAGE_TYPE
        new_storage_name = new_cfg.UPLOADED_FILES__STORAGE__STORAGE_NAME
        new_storage_type = new_cfg.UPLOADED_FILES__STORAGE__STORAGE_TYPE
        print(
            "Migration of storage from {}({}) to {}({}) started".format(
                original_storage_name, original_storage_type, new_storage_name, new_storage_type
            )
        )

        if new_storage_name == original_storage_name:
            raise Exception(
                "You need to use a different storage name between old and new storage type"
            )
        if new_cfg.SQLALCHEMY__URL != old_cfg.SQLALCHEMY__URL:
            raise Exception("This feature cannot be used between different databases")

        DepotManager.set_default(new_cfg.UPLOADED_FILES__STORAGE__STORAGE_NAME)
        engine = get_engine(new_cfg)
        session_factory = get_session_factory(engine)
        with transaction.manager:
            dbsession = get_tm_session(session_factory, transaction.manager)
            revisions = dbsession.query(ContentRevisionRO).all()
            for revision in revisions:
                self._reupload_depot_file(revision, field_names=["depot_file"], dbsession=dbsession)
            users = dbsession.query(User).all()
            for user in users:
                self._reupload_depot_file(
                    user,
                    field_names=["avatar", "cropped_avatar", "cover", "cropped_cover"],
                    dbsession=dbsession,
                )
            transaction.commit()
        print(
            "Migration of storage finished from {}({}) to {}({})".format(
                original_storage_name, original_storage_type, new_storage_name, new_storage_type
            )
        )
