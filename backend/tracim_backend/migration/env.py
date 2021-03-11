# -*- coding: utf-8 -*-

from __future__ import with_statement

import os
import typing

from alembic import context
from alembic.operations import MigrateOperation
from alembic.operations import Operations
from sqlalchemy import Enum
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from tracim_backend.exceptions import ConfigurationError
from tracim_backend.models.meta import metadata
from tracim_backend.models.setup_models import *  # noqa: F403,F401

# from logging.config import fileConfig

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config
# INFO - G.M - 2019-05-02 - hack to get env url instead of current config file
# url for migration script
env_sqlalchemy_url = os.environ.get("TRACIM_SQLALCHEMY__URL")
if env_sqlalchemy_url:
    config.set_main_option("sqlalchemy.url", env_sqlalchemy_url)
if not config.get_main_option("sqlalchemy.url"):
    raise ConfigurationError("SQLALCHEMY__URL is mandatory")
# Interpret the config file for Python logging.
# This line sets up loggers basically.
# fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata

target_metadata = metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


# Custom operations definitions
@Operations.register_operation("replace_enum")
class ReplaceEnumOp(MigrateOperation):
    """Replace an Enum()."""

    def __init__(
        self,
        table_name: str,
        column_name: str,
        from_enum: Enum,
        to_enum: Enum,
        default_value: typing.Any,
    ) -> None:
        self.table_name = table_name
        self.column_name = column_name
        self.from_enum = from_enum
        self.to_enum = to_enum
        self.default_value = default_value

    @classmethod
    def replace_enum(
        cls,
        operations: Operations,
        table_name: str,
        column_name: str,
        from_enum: Enum,
        to_enum: Enum,
        default_value: typing.Any,
    ) -> Operations:
        """Replace an enum with specific behaviour for PostgreSQL."""

        op = ReplaceEnumOp(table_name, column_name, from_enum, to_enum, default_value)
        return operations.invoke(op)


@Operations.implementation_for(ReplaceEnumOp)
def replace_enum(operations: Operations, operation: ReplaceEnumOp) -> None:
    if operations.get_context().dialect.name == "postgresql":
        operations.execute(
            "ALTER TYPE {} RENAME TO {}_old".format(
                operation.from_enum.name, operation.from_enum.name
            )
        )
        operations.execute(
            "ALTER TABLE {} alter {} drop default".format(
                operation.table_name, operation.column_name
            )
        )
        operation.to_enum.create(operations.get_bind(), checkfirst=False)
        with operations.batch_alter_table(operation.table_name) as batch_op:
            batch_op.alter_column(
                operation.column_name,
                type_=operation.to_enum,
                postgresql_using="{}::text::{}".format(
                    operation.column_name, operation.to_enum.name
                ),
                server_default=operation.default_value,
            )
        operations.execute("DROP TYPE {}_old".format(operation.from_enum.name))
    else:
        operation.to_enum.create(operations.get_bind(), checkfirst=False)
        with operations.batch_alter_table(operation.table_name) as batch_op:
            batch_op.alter_column(operation.column_name, type_=operation.to_enum)


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, version_table="migrate_version")

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    engine = engine_from_config(
        config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool
    )

    connection = engine.connect()
    context.configure(
        connection=connection, target_metadata=target_metadata, version_table="migrate_version"
    )

    try:
        with context.begin_transaction():
            context.run_migrations()
    finally:
        connection.close()
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
