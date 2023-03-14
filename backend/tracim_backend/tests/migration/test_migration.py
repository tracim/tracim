import os
import typing

from alembic import command
from alembic.config import Config
from alembic.runtime.environment import EnvironmentContext
from alembic.script import ScriptDirectory
import pytest
from sqlalchemy.engine import Engine

from tracim_backend.models.setup_models import *  # noqa: F403,F401
from tracim_backend.tests.fixtures import *  # noqa: F403,F401

TEST_MIGRATION_SCRIPT_LOCATION = os.environ.get("TEST_MIGRATION_SCRIPT_LOCATION")


def get_revision(
    config: Config, engine: Engine, script: ScriptDirectory, revision_type="current"
) -> tuple:
    """
    Helper to get revision id
    """
    with engine.connect() as conn:
        with EnvironmentContext(config, script) as env_context:
            env_context.configure(conn, version_table="migrate_version")
            if revision_type == "head":
                revision = env_context.get_head_revisions()
            else:
                migration_context = env_context.get_context()
                revision = migration_context.get_current_heads()
    return revision


def find_all_paths(graph, start, end, path=[]):
    path = path + [start]
    if start == end:
        return [path]
    if start not in graph:
        return []
    paths = []
    for node in graph[start]:
        if node not in path:
            new_paths = find_all_paths(graph, node, end, path)
            for new_path in new_paths:
                paths.append(new_path)
    return paths


def get_paths(alembic_config: Config) -> typing.Dict[str, tuple]:
    scripts = ScriptDirectory.from_config(alembic_config)

    graph = {}
    start = None
    dest = None

    # Construct the graph using alembic API
    for sc in scripts.walk_revisions():
        down_revision = sc.down_revision
        if start is None:
            start = sc.revision
        if down_revision is None:
            dest = sc.revision
            continue
        elif isinstance(down_revision, str):
            down_revision = tuple([down_revision])

        graph[sc.revision] = down_revision

    # Get every paths
    return find_all_paths(graph, start, dest)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "migration_test"}], indirect=True)
class TestMigration(object):
    def test_downgrade_and_upgrade(self, migration_engine, session, app_config):
        """Test all migrations up and down.

        Tests that we can apply all migrations from a brand new empty
        database, and also that we can remove them all.
        """
        uri = app_config.SQLALCHEMY__URL
        folder = TEST_MIGRATION_SCRIPT_LOCATION

        alembic_config = Config()
        alembic_config.set_main_option("script_location", folder)
        alembic_config.set_main_option("sqlalchemy.url", uri)
        script = ScriptDirectory.from_config(alembic_config)

        paths = get_paths(alembic_config)

        # Stamp last_revision
        head_revision = get_revision(alembic_config, migration_engine, script, "head")
        current_revision = get_revision(alembic_config, migration_engine, script, "current")
        assert current_revision == tuple()
        head_revision = get_revision(alembic_config, migration_engine, script, "head")
        command.stamp(alembic_config, head_revision)
        current_revision = get_revision(alembic_config, migration_engine, script, "current")
        assert current_revision == tuple(head_revision)

        for path in paths:
            # Test downgrade
            for revision in path:
                command.downgrade(alembic_config, revision)
            command.downgrade(alembic_config, "-1")
            current_revision = get_revision(alembic_config, migration_engine, script, "current")
            assert current_revision == tuple()

            # Test upgrade
            for revision in reversed(path):
                command.upgrade(alembic_config, revision)
            current_revision = get_revision(alembic_config, migration_engine, script, "current")
            assert current_revision == tuple(head_revision)
