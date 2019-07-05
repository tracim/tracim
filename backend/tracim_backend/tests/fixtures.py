import logging
import typing

from depot.manager import DepotManager
import plaster
from pyramid import testing
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
import transaction

from tracim_backend import CFG
from tracim_backend import init_models
from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import ContentTypeList
from tracim_backend.fixtures import FixturesLoader
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.setup_models import get_session_factory
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.tests import TEST_CONFIG_FILE_PATH
from tracim_backend.tests.utils import ApplicationApiFactory
from tracim_backend.tests.utils import ContentApiFactory
from tracim_backend.tests.utils import GroupApiFactory
from tracim_backend.tests.utils import RoleApiFactory
from tracim_backend.tests.utils import WorkspaceApiFactory


@pytest.fixture
def config_uri() -> str:
    return TEST_CONFIG_FILE_PATH


@pytest.fixture
def config_section() -> str:
    return "base_test"


@pytest.fixture
def tracim_fixtures() -> typing.List:
    return []


@pytest.fixture
def settings(config_uri, config_section):
    return plaster.get_settings(config_uri, config_section)


@pytest.fixture
def config(settings):
    yield testing.setUp(settings=settings)
    testing.tearDown()


@pytest.fixture
def depot():
    DepotManager._clear()
    DepotManager.configure("test", {"depot.backend": "depot.io.memory.MemoryFileStorage"})
    yield DepotManager.get("test")
    DepotManager._clear()


@pytest.fixture
def app_config(depot, settings) -> CFG:
    return CFG(settings)


@pytest.fixture
def engine(config, app_config):
    init_models(config, app_config)
    from tracim_backend.models.setup_models import get_engine

    engine = get_engine(app_config)
    yield engine
    engine.dispose()


@pytest.fixture
def session_factory(engine):
    return get_session_factory(engine)


@pytest.fixture
def empty_session(session_factory):
    return get_tm_session(session_factory, transaction.manager)


@pytest.fixture
def migration_engine(engine):
    yield engine
    sql = text("DROP TABLE IF EXISTS migrate_version;")
    engine.execute(sql)


@pytest.fixture
def session(empty_session, engine, app_config, tracim_fixtures, test_logger):
    dbsession = empty_session
    from tracim_backend.models.meta import DeclarativeBase

    with transaction.manager:
        try:
            DeclarativeBase.metadata.drop_all(engine)
            DeclarativeBase.metadata.create_all(engine)
            fixtures_loader = FixturesLoader(dbsession, app_config)
            fixtures_loader.loads(tracim_fixtures)
            transaction.commit()
            logger.info(session, "Database initialized.")
        except IntegrityError:
            logger.error(
                session,
                "Warning, there was a problem when adding default data"
                ", it may have already been added:",
            )
            import traceback

            logger.error(session, traceback.format_exc())
            transaction.abort()
            logger.error(session, "Database initialization failed")
    yield dbsession
    from tracim_backend.models.meta import DeclarativeBase

    dbsession.rollback()
    dbsession.close_all()
    transaction.abort()
    DeclarativeBase.metadata.drop_all(engine)


@pytest.fixture
def workspace_api_factory(session, app_config, admin_user) -> WorkspaceApiFactory:
    return WorkspaceApiFactory(session, app_config, admin_user)


@pytest.fixture
def content_api_factory(session, app_config, admin_user) -> ContentApiFactory:
    return ContentApiFactory(session, app_config, admin_user)


@pytest.fixture
def group_api_factory(session, app_config, admin_user) -> GroupApiFactory:
    return GroupApiFactory(session, app_config, admin_user)


@pytest.fixture
def role_api_factory(session, app_config, admin_user) -> RoleApiFactory:
    return RoleApiFactory(session, app_config, admin_user)


@pytest.fixture
def application_api_factory(app_list) -> ApplicationApiFactory:
    return ApplicationApiFactory(app_list)


@pytest.fixture()
def admin_user(session) -> User:
    return session.query(User).filter(User.email == "admin@admin.admin").one()


@pytest.fixture()
def app_list() -> typing.List[Application]:
    from tracim_backend.extensions import app_list as application_list_static

    return application_list_static


@pytest.fixture()
def content_type_list() -> ContentTypeList:
    from tracim_backend.app_models.contents import content_type_list as content_type_list_static

    return content_type_list_static


@pytest.fixture
def test_logger() -> None:
    """
    Set all logger to a high level to avoid getting too much noise for tests
    """
    logger._logger.setLevel("ERROR")
    logging.getLogger().setLevel("ERROR")
    logging.getLogger("sqlalchemy").setLevel("ERROR")
    logging.getLogger("txn").setLevel("ERROR")
    logging.getLogger("cliff").setLevel("ERROR")
    logging.getLogger("_jb_pytest_runner").setLevel("ERROR")
    return logger
