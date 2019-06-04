# -*- coding: utf-8 -*-

"""
Simple script to setup require directories for pytests
"""
import os
from pathlib import Path  # python3 only

from dotenv import load_dotenv

env_path = Path(".") / ".test.env"
load_dotenv(dotenv_path=env_path)


def create_dir(path: str, name: str) -> None:
    print('> trying creation of {} dirs in "{}"'.format(name, path))
    try:
        os.makedirs(path, exist_ok=False)
        print('\t "{}" dir created'.format(path))
    except FileExistsError:
        print('\t "{}" already exist'.format(path))


def is_dir(path: str, name: str) -> None:
    print('> check existence of {} dir in "{}"'.format(name, path))
    if Path.is_dir(Path(path)):
        print('\t {} dir exist in "{}"'.format(name, path))
    else:
        print('\t WARNING /!\\ {} dir do not exist ! in "{}"'.format(name, path))


def is_file(path: str, name: str) -> None:
    print('> check existence of {} file in "{}"'.format(name, path))
    if Path.is_file(Path(path)):
        print('\t {} file exist in "{}"'.format(name, path))
    else:
        print('\t WARNING /!\\ {} file do not exist ! in "{}"'.format(name, path))


def exists(value: str, name: str) -> None:
    print("> check existence of {}".format(name, value))
    if not value:
        print('\t WARNING /!\\ {} is a falsy value: "{}"'.format(name, value))
    else:
        print('\t {} value exist: "{}"'.format(name, value))


def get_path(env_var_name: str):
    return os.path.abspath(os.getenv(env_var_name))


print(">>> ABOUT TESTS CONFIG\n")
print(
    'Tests are run by default with test config file TEST_CONFIG_FILE_PATH(current: "{}") and default env var setted in "backend/.test.env".\nIf you want to override default value used for test (if you want for example, use another database), you should set env var before running this script or pytest.\n'.format(
        get_path("TEST_CONFIG_FILE_PATH")
    )
)
print("for example:\n ")
print("export TRACIM_SQLALCHEMY__URL=sqlite:////tmp/mydatabase.sqlite")
print("python3 ./setup_dev_env.py")
print("pytest")
print("\n>>> CREATE DIR NEEDED FOR TESTS \n")
depot_storage_dir = get_path("TRACIM_DEPOT_STORAGE_DIR")
create_dir(depot_storage_dir, "depot storage")

preview_cache_dir = get_path("TRACIM_PREVIEW_CACHE_DIR")
create_dir(preview_cache_dir, "preview_cache")

session_data_dir = get_path("TRACIM_SESSION__DATA_DIR")
create_dir(session_data_dir, "session data")

session_lock_dir = get_path("TRACIM_SESSION__LOCK_DIR")
create_dir(session_lock_dir, "session lock")

caldav_storage_dir = get_path("CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER")
create_dir(caldav_storage_dir, "caldav storage dir")

print("\n>>> OTHER CHECKS \n")
migration_script_location = get_path("TEST_MIGRATION_SCRIPT_LOCATION")
is_dir(migration_script_location, "migration script location")

color_config_file_path = get_path("TRACIM_COLOR__CONFIG_FILE_PATH")
is_file(color_config_file_path, "color config")

test_config_file_path = get_path("TEST_CONFIG_FILE_PATH")
is_file(test_config_file_path, "test config")

exists(os.getenv("TRACIM_SQLALCHEMY__URL"), "TRACIM_SQLALCHEMY__URL")
