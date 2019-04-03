# -*- coding: utf-8 -*-
import logging
import os
import multiprocessing
import typing
import unittest

import plaster
import requests
import transaction
from depot.manager import DepotManager
from pyramid import testing
from requests import Response
from sqlalchemy.exc import IntegrityError
from tracim_backend.command import AppContextCommand

from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.setup_models import get_engine, get_session_factory, \
    get_tm_session
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import Content
from tracim_backend.lib.utils.logger import logger
from tracim_backend.fixtures import FixturesLoader
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend import web, CaldavAppFactory
from tracim_backend import webdav
from tracim_backend import WebdavAppFactory
from waitress import serve
from webtest import TestApp
from io import BytesIO
from PIL import Image
import threading

DEFAULT_TEST_STORAGE_NAME = 'test'
TEST_STORAGE_NAME_ENV_VAR = 'TRACIM_TEST_DEPOT_NAME'

DEFAULT_TEST_STORAGE_DIR = '/tmp/test/depot'
TEST_STORAGE_DIR_ENV_VAR = 'TRACIM_TEST_DEPOT_DIR'

DEFAULT_TEST_PREVIEW_CACHE_DIR = '/tmp/test/preview_cache'
TEST_PREVIEW_CACHE_DIR_ENV_VAR = 'TRACIM_TEST_PREVIEW_CACHE_DIR'

DEFAULT_TEST_SQLALCHEMY_URL= 'sqlite:///tracim_test.sqlite'
TEST_SQLALCHEMY_URL_ENV_VAR = 'TRACIM_TEST_SQLALCHEMY_URL'

DEFAULT_TEST_SESSIONS_DATA_DIR = '/tmp/test/sessions/sessions_data'
TEST_SESSIONS_DATA_DIR_ENV_VAR = 'TRACIM_TEST_SESSIONS_DATA_DIR'

DEFAULT_TEST_SESSIONS_LOCK_DIR = '/tmp/test/sessions/sessions_lock'
TEST_SESSIONS_LOCK_DIR_ENV_VAR = 'TRACIM_TEST_SESSIONS_LOCK_DIR'

DEFAULT_TEST_RADICALE_STORAGE_DIR = '/tmp/test/radicale_storage'
TEST_RADICALE_STORAGE_DIR_ENV_VAR = 'TRACIM_TEST_RADICALE_STORAGE_DIR'

def eq_(a, b, msg=None) -> None:
    # TODO - G.M - 05-04-2018 - Remove this when all old nose code is removed
    assert a == b, msg or "%r != %r" % (a, b)

# TODO - G.M - 2018-06-179 - Refactor slug change function
#  as a kind of pytest fixture ?



def setup_parametrizable_config(settings: typing.Dict[str, str]):
    settings['depot_storage_name'] = os.environ.get(
        TEST_STORAGE_NAME_ENV_VAR,
        DEFAULT_TEST_STORAGE_NAME
    )
    settings['depot_storage_dir'] = os.environ.get(
        TEST_STORAGE_DIR_ENV_VAR,
        DEFAULT_TEST_STORAGE_DIR
    )
    settings['preview_cache_dir'] = os.environ.get(
        TEST_PREVIEW_CACHE_DIR_ENV_VAR,
        DEFAULT_TEST_PREVIEW_CACHE_DIR
    )

    settings['sqlalchemy.url'] = os.environ.get(
        TEST_SQLALCHEMY_URL_ENV_VAR,
        DEFAULT_TEST_SQLALCHEMY_URL
    )
    settings['session.data_dir'] = os.environ.get(
        TEST_SESSIONS_DATA_DIR_ENV_VAR,
        DEFAULT_TEST_SESSIONS_DATA_DIR
    )

    settings['session.lock_dir'] = os.environ.get(
        TEST_SESSIONS_LOCK_DIR_ENV_VAR,
        DEFAULT_TEST_SESSIONS_LOCK_DIR
    )
    settings['caldav.radicale.storage.filesystem_folder'] = os.environ.get(
        TEST_RADICALE_STORAGE_DIR_ENV_VAR,
        DEFAULT_TEST_RADICALE_STORAGE_DIR
    )
    # INFO - G.M - 2019-04-02 - try to create dir if no exist to avoid trouble
    # in test
    os.makedirs(settings['preview_cache_dir'], exist_ok=True)
    os.makedirs(settings['depot_storage_dir'], exist_ok=True)
    os.makedirs(settings['session.data_dir'], exist_ok=True)
    os.makedirs(settings['session.lock_dir'], exist_ok=True)
    os.makedirs(settings['caldav.radicale.storage.filesystem_folder'], exist_ok=True)
    return settings


def set_html_document_slug_to_legacy(session_factory) -> None:
    """
    Simple function to help some functional test. This modify "html-documents"
    type content in database to legacy "page" slug.
    :param session_factory: session factory of the test
    :return: Nothing.
    """
    dbsession = get_tm_session(
        session_factory,
        transaction.manager
    )
    content_query = dbsession.query(ContentRevisionRO).filter(ContentRevisionRO.type == 'page').filter(ContentRevisionRO.content_id == 6)  # nopep8
    assert content_query.count() == 0
    html_documents_query = dbsession.query(ContentRevisionRO).filter(ContentRevisionRO.type == 'html-document')  # nopep8
    html_documents_query.update({ContentRevisionRO.type: 'page'})
    transaction.commit()
    assert content_query.count() > 0


def create_1000px_png_test_image() -> None:
    file = BytesIO()
    image = Image.new('RGBA', size=(1000, 1000), color=(0, 0, 0))
    image.save(file, 'png')
    file.name = 'test_image.png'
    file.seek(0)
    return file

class AbstractMailHogTest(object):

    MAILHOG_BASE_URL = 'http://127.0.0.1:8025'
    MAILHOG_MESSAGES_ENDPOINT = '/api/v1/messages'


    def cleanup_mailhog(self) -> Response:
        logger.debug(self, 'Cleanup MailHog Mails...')
        return requests.delete('{}{}'.format(
            self.MAILHOG_BASE_URL,
            self.MAILHOG_MESSAGES_ENDPOINT
        ))

    def get_mailhog_mails(self) -> typing.List[typing.Any]:
        logger.debug(self, 'gets MailHog messages...')
        return requests.get('{}{}'.format(
            self.MAILHOG_BASE_URL,
            self.MAILHOG_MESSAGES_ENDPOINT
        )).json()

class AbstractSettingsTest(unittest.TestCase):

    def setup_settings(self) -> typing.Dict[str, typing.Any]:
        settings = self.default_settings()
        settings.update(plaster.get_settings(
            self.config_uri,
            self.config_section
        ))
        settings = self.override_settings(settings)
        return settings

    def default_settings(self) -> typing.Dict[str, typing.Any]:
        return setup_parametrizable_config({})

class FunctionalTest(AbstractSettingsTest):

    fixtures = [BaseFixture]
    config_uri = 'tests_configs.ini'
    config_section = 'functional_test'

    def _set_logger(self) -> None:
        """
        Set all logger to a high level to avoid getting too much noise for tests
        """
        logger._logger.setLevel('ERROR')
        logging.getLogger().setLevel('ERROR')
        logging.getLogger('sqlalchemy').setLevel('ERROR')
        logging.getLogger('txn').setLevel('ERROR')
        logging.getLogger('cliff').setLevel('ERROR')
        logging.getLogger('_jb_pytest_runner').setLevel('ERROR')

    def setUp(self) -> None:
        self._set_logger()
        DepotManager._clear()
        self.settings = self.setup_settings()
        # INFO - G.M - 2019-03-19 - Reset all hapic context: PyramidContext
        # and controllers
        hapic.reset_context()
        # TODO - G.M - 2019-03-19 - Replace this code by something better, see
        # https://github.com/algoo/hapic/issues/144
        hapic._controllers = []
        self.connect_database(create_tables=True)
        self.app_config = CFG(self.settings)
        self.app_config.configure_filedepot()
        self.init_database(self.settings)
        DepotManager._clear()
        self.run_app()

    def connect_database(self, create_tables: bool = False) -> None:
        self.engine = get_engine(self.settings)
        if create_tables:
            DeclarativeBase.metadata.create_all(self.engine)
        self.session_factory = get_session_factory(self.engine)
        self.session = get_tm_session(self.session_factory, transaction.manager)

    def override_settings(self, settings: typing.Dict[str, typing.Any]) -> typing.Dict[str, typing.Any]:  # nopep8
        """
        Allow to override some setting by code.
        by default : do nothing
        """
        return settings

    def run_app(self) -> None:
        app = web({}, **self.settings)
        self.testapp = TestApp(app)

    def init_database(self, settings: typing.Dict[str, typing.Any]):
        with transaction.manager:
            try:
                fixtures_loader = FixturesLoader(self.session, self.app_config)
                fixtures_loader.loads(self.fixtures)
                transaction.commit()
                logger.info(self,"Database initialized.")
            except IntegrityError:
                logger.error(self,'Warning, there was a problem when adding default data'  # nopep8
                               ', it may have already been added:')
                import traceback
                logger.error(self, traceback.format_exc())
                transaction.abort()
                logger.error(self, 'Database initialization failed')

    def disconnect_database(self, remove_tables: bool = False) -> None:
        self.session.rollback()
        transaction.abort()
        self.session.close_all()
        self.engine.dispose()
        if remove_tables:
            DeclarativeBase.metadata.drop_all(self.engine)
        DepotManager._clear()

    def tearDown(self) -> None:
        logger.debug(self, 'TearDown Test...')
        self.disconnect_database(remove_tables=True)
        testing.tearDown()


class MailHogFunctionalTest(FunctionalTest, AbstractMailHogTest):

    def setUp(self):
        self.cleanup_mailhog()
        super().setUp()

    def tearDown(self):
       super().tearDown()
       self.cleanup_mailhog()



class WebdavFunctionalTest(FunctionalTest):
    config_uri = 'tests_configs.ini'
    config_section = 'functional_webdav_test'

    def run_app(self) -> None:
        app_factory = WebdavAppFactory(**self.settings)
        app = app_factory.get_wsgi_app()
        self.testapp = TestApp(app)

class CaldavRadicaleProxyFunctionalTest(FunctionalTest):
    config_section = 'functional_caldav_radicale_proxy_test'
    radicale_server = None

    def start_radicale_server(self):
        settings = self.setup_settings()
        app_factory = CaldavAppFactory(**settings)
        app = app_factory.get_wsgi_app()
        self.radicale_server = multiprocessing.Process(target=serve, kwargs={
            'app': app,
            'listen': 'localhost:5232'
            }
        )
        self.radicale_server.daemon = True
        self.radicale_server.start()

    def stop_radicale_server(self):
        if self.radicale_server:
            self.radicale_server.terminate()
    def setUp(self):
        super().setUp()
        self.start_radicale_server()


    def tearDown(self):
       super().tearDown()
       self.stop_radicale_server()


class FunctionalTestEmptyDB(FunctionalTest):
    fixtures = []


class FunctionalTestNoDB(FunctionalTest):
    """
    Special test case when sqlalchemy.url is not correct
    """
    config_section = 'functional_test_no_db'

    def override_settings(self, settings: typing.Dict[str, typing.Any]) -> typing.Dict[str, typing.Any]:  # nopep8
        """
        Disable sqlalchemy.url with wrong value
        :return new settings dict
        """
        settings['sqlalchemy.url'] = 'sqlite://'
        return settings

    def init_database(self, settings: typing.Dict[str, typing.Any]) -> None:
        self.engine = get_engine(settings)


class CommandFunctionalTestBase(FunctionalTest):
    def _set_logger(self):
        super()._set_logger()
        logging.getLogger('_jb_pytest_runner').setLevel('CRITICAL')

    def run_app(self):
        """ Disable run pyramid app for command functional test"""
        pass

class CommandFunctionalTestWithDB(FunctionalTest):

    tmp_command_default_settings = None

    def override_settings(self, settings: typing.Dict[str, typing.Any]):
        settings = super().override_settings(settings)
        # FIXME - G.M - 2019-04-02 - hack to be able to override default config
        # for command tests
        self.tmp_command_default_settings=AppContextCommand.default_settings
        AppContextCommand.default_settings = setup_parametrizable_config({})
        return settings

    def tearDown(self):
        super().tearDown()
        AppContextCommand.default_settings = self.tmp_command_default_settings

class BaseTest(AbstractSettingsTest):
    """
    Pyramid default test.
    """
    fixtures = []
    config_uri = 'tests_configs.ini'
    config_section = 'base_test'

    def _set_logger(self) -> None:
        """
        Set all logger to a high level to avoid getting too much noise for tests
        """
        logger._logger.setLevel('ERROR')
        logging.getLogger().setLevel('ERROR')
        logging.getLogger('sqlalchemy').setLevel('ERROR')
        logging.getLogger('txn').setLevel('ERROR')
        logging.getLogger('cliff').setLevel('ERROR')
        logging.getLogger('_jb_pytest_runner').setLevel('ERROR')

    def init_database(self) -> None:
        session = get_tm_session(self.session_factory, transaction.manager)
        with transaction.manager:
            try:
                DeclarativeBase.metadata.drop_all(self.engine)
                DeclarativeBase.metadata.create_all(self.engine)
                fixtures_loader = FixturesLoader(session, self.app_config)
                fixtures_loader.loads(self.fixtures)
                transaction.commit()
                logger.info(self,"Database initialized.")
            except IntegrityError:
                logger.error(self,'Warning, there was a problem when adding default data'  # nopep8
                               ', it may have already been added:')
                import traceback
                logger.error(self, traceback.format_exc())
                transaction.abort()
                logger.error(self, 'Database initialization failed')

    def override_settings(self, settings: typing.Dict[str, typing.Any]) -> typing.Dict[str, typing.Any]:  # nopep8
        """
        Allow to override some setting by code.
        by default : setup depot, sqlalchemy database and other paths
        """
        settings = setup_parametrizable_config(settings)
        return settings

    def setUp(self) -> None:
        self._set_logger()
        logger.debug(self, 'Setup Test...')
        self.settings = self.setup_settings()
        self.config = testing.setUp(settings = self.settings)
        self.config.include('tracim_backend.models.setup_models')
        DepotManager._clear()
        DepotManager.configure(
            'test', {'depot.backend': 'depot.io.memory.MemoryFileStorage'}
        )
        settings = self.config.get_settings()
        self.app_config = CFG(settings)
        from tracim_backend.models.setup_models import (
            get_engine,
            get_session_factory,
            get_tm_session,
        )

        self.engine = get_engine(settings)
        self.session_factory = get_session_factory(self.engine)
        self.init_database()
        self.session = get_tm_session(self.session_factory, transaction.manager)

    def tearDown(self) -> None:
        logger.debug(self, 'TearDown Test...')
        from tracim_backend.models.meta import DeclarativeBase

        self.session.rollback()
        self.session.close_all()
        transaction.abort()
        DeclarativeBase.metadata.drop_all(self.engine)
        self.engine.dispose()
        DepotManager._clear()
        testing.tearDown()


class StandardTest(BaseTest):
    """
    BaseTest with default fixtures
    """
    fixtures = [BaseFixture]


class DefaultTest(StandardTest):

    def _create_workspace_and_test(self, name, user) -> Workspace:
        """
        All extra parameters (*args, **kwargs) are for Workspace init
        :return: Created workspace instance
        """
        WorkspaceApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        ).create_workspace(name, save_now=True)

        eq_(
            1,
            self.session.query(Workspace).filter(
                Workspace.label == name
            ).count()
        )
        return self.session.query(Workspace).filter(
            Workspace.label == name
        ).one()

    def _create_content_and_test(
            self,
            name,
            workspace,
            *args,
            **kwargs
    ) -> Content:
        """
        All extra parameters (*args, **kwargs) are for Content init
        :return: Created Content instance
        """
        content = Content(*args, **kwargs)
        content.label = name
        content.workspace = workspace
        self.session.add(content)
        self.session.flush()

        content_api = ContentApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        eq_(
            1,
            content_api.get_canonical_query().filter(
                Content.label == name
            ).count()
        )
        return content_api.get_canonical_query().filter(
            Content.label == name
        ).one()

    def _create_thread_and_test(self,
                                user,
                                workspace_name='workspace_1',
                                folder_name='folder_1',
                                thread_name='thread_1') -> Content:
        """
        :return: Thread
        """
        workspace = self._create_workspace_and_test(workspace_name, user)
        folder = self._create_content_and_test(
            folder_name, workspace,
            type=content_type_list.Folder.slug,
            owner=user
        )
        thread = self._create_content_and_test(
            thread_name,
            workspace,
            type=content_type_list.Thread.slug,
            parent=folder,
            owner=user
        )
        return thread


class MailHogTest(DefaultTest, AbstractMailHogTest):
    """
    Theses test need a working mailhog
    """
    config_section = 'mail_test'

    def setUp(self):
        self.cleanup_mailhog()
        super().setUp()

    def tearDown(self) -> None:
        super().tearDown()
        self.cleanup_mailhog()
