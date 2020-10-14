#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Simple script to setup require directories for pytests
"""
import os
from pathlib import Path  # python3 only
from typing import Optional
from dotenv import load_dotenv

env_path = Path(".") / ".test.env"
load_dotenv(dotenv_path=env_path)


def create_dir(path: str, description: str) -> None:
    print('> Creating directory "{}" ({})'.format(path, description))
    try:
        os.makedirs(path, exist_ok=False)
    except FileExistsError:
        pass


def is_dir(path: Optional[str], description: str) -> None:
    print("> Checking whether {} is a directory ({})".format(path, description))
    if not path or not Path.is_dir(Path(path)):
        print('/!\\ WARNING: folder {} does not exist! in "{}"'.format(description, path))


def is_file(path: Optional[str], description: str) -> None:
    print("> Checking whether {} is a file ({})".format(path, description))
    if not path or not Path.is_file(Path(path)):
        print('/!\\ WARNING: {} file does not exist! in "{}"'.format(description, path))


def exists(value: Optional[str], name: str) -> None:
    if value:
        print("> Info: {} is set to '{}'".format(name, value))
    else:
        print("/!\\ WARNING: {} is not set.".format(name))


def get_path(env_var_name: str) -> Optional[str]:
    env_var = os.getenv(env_var_name)

    if env_var:
        return os.path.abspath(env_var)

    return None


print(
    """About configuring tests
-----------------------
By default, tests are run using values:
- set in file TEST_CONFIG_FILE_PATH (current: "{}"),
- variables set in "backend/.test.env".

You can override these values (e.g, to use another database) by
setting environment variables before running this script or pytest.

For instance:

export TRACIM_SQLALCHEMY__URL=sqlite:////tmp/mydatabase.sqlite
python3 ./setup_dev_env.py
pytest
-----------------------
""".format(
        get_path("TEST_CONFIG_FILE_PATH")
    )
)

test_directories = [
    ("TRACIM_DEPOT_STORAGE_DIR", "depot storage", True),
    ("TRACIM_PREVIEW_CACHE_DIR", "preview cache", True),
    ("TRACIM_SESSION__DATA_DIR", "session data", True),
    ("TRACIM_SESSION__LOCK_DIR", "session locks", True),
    ("CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER", "caldav storage", False),
]

for (env_var_name, description, is_error) in test_directories:
    path = get_path(env_var_name)
    if path:
        create_dir(path, description)
    else:
        print(
            "\n/!\\ {}: missing environment variable {} ({})\n".format(
                "ERROR" if is_error else "WARNING", env_var_name, description
            )
        )

migration_script_location = get_path("TEST_MIGRATION_SCRIPT_LOCATION")
is_dir(migration_script_location, "migration script location")

color_config_file_path = get_path("TRACIM_COLOR__CONFIG_FILE_PATH")
is_file(color_config_file_path, "color config")

test_config_file_path = get_path("TEST_CONFIG_FILE_PATH")
is_file(test_config_file_path, "test config")

exists(os.getenv("TRACIM_SQLALCHEMY__URL"), "TRACIM_SQLALCHEMY__URL")

print(
    """
Running tests:
--------------
 - All the tests:

    pytest

 - A particular file:

    pytest [file]

   For instance:

    pytest ./tracim_backend/tests/library/test_user_api.py

 - A particular test:

    pytest [file]::[TestUnit]::[test_function]

   For instance:

    pytest ./tracim_backend/tests/library/test_user_api.py test_unit__get_known_users__distinct_workspaces_users_by_name__exclude_workspace
-------------"""
)
