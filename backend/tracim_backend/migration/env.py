# -*- coding: utf-8 -*-

from __future__ import with_statement

import os

from alembic import context
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
