# -*- coding: utf-8 -*-
import unittest

import plaster
import requests
import transaction
from depot.manager import DepotManager
from pyramid import testing
from sqlalchemy.exc import IntegrityError

from tracim.command.database import InitializeDBCommand
from tracim.lib.core.content import ContentApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.models import get_engine, DeclarativeBase, get_session_factory, \
    get_tm_session
from tracim.models.data import Workspace, ContentType
from tracim.models.data import Content
from tracim.lib.utils.logger import logger
from tracim.fixtures import FixturesLoader
from tracim.fixtures.users_and_groups import Base as BaseFixture
from tracim.config import CFG
from tracim.extensions import hapic
from tracim import web
from webtest import TestApp


def eq_(a, b, msg=None):
    # TODO - G.M - 05-04-2018 - Remove this when all old nose code is removed
    assert a == b, msg or "%r != %r" % (a, b)


class FunctionalTest(unittest.TestCase):

    fixtures = [BaseFixture]
    sqlalchemy_url = 'sqlite:///tracim_test.sqlite'

    def setUp(self):
        DepotManager._clear()
        settings = {
            'sqlalchemy.url': self.sqlalchemy_url,
            'user.auth_token.validity': '604800',
            'depot_storage_dir': '/tmp/test/depot',
            'depot_storage_name': 'test',
            'preview_cache_dir': '/tmp/test/preview_cache',

        }
        hapic.reset_context()
        app = web({}, **settings)
        self.init_database(settings)
        self.testapp = TestApp(app)

    def init_database(self, settings):
        self.engine = get_engine(settings)
        DeclarativeBase.metadata.create_all(self.engine)
        session_factory = get_session_factory(self.engine)
        app_config = CFG(settings)
        with transaction.manager:
            dbsession = get_tm_session(session_factory, transaction.manager)
            try:
                fixtures_loader = FixturesLoader(dbsession, app_config)
                fixtures_loader.loads(self.fixtures)
                transaction.commit()
                print("Database initialized.")
            except IntegrityError:
                print('Warning, there was a problem when adding default data'
                      ', it may have already been added:')
                import traceback
                print(traceback.format_exc())
                transaction.abort()
                print('Database initialization failed')

    def tearDown(self):
        logger.debug(self, 'TearDown Test...')
        from tracim.models.meta import DeclarativeBase

        testing.tearDown()
        transaction.abort()
        DeclarativeBase.metadata.drop_all(self.engine)
        DepotManager._clear()


class FunctionalTestEmptyDB(FunctionalTest):
    fixtures = []


class FunctionalTestNoDB(FunctionalTest):
    sqlalchemy_url = 'sqlite://'

    def init_database(self, settings):
        self.engine = get_engine(settings)


class BaseTest(unittest.TestCase):
    """
    Pyramid default test.
    """

    config_uri = 'tests_configs.ini'
    config_section = 'base_test'

    def setUp(self):
        logger.debug(self, 'Setup Test...')
        self.settings = plaster.get_settings(
            self.config_uri,
            self.config_section
        )
        self.config = testing.setUp(settings = self.settings)
        self.config.include('tracim.models')
        DepotManager._clear()
        DepotManager.configure(
            'test', {'depot.backend': 'depot.io.memory.MemoryFileStorage'}
        )
        settings = self.config.get_settings()
        self.app_config = CFG(settings)
        from tracim.models import (
            get_engine,
            get_session_factory,
            get_tm_session,
        )

        self.engine = get_engine(settings)
        session_factory = get_session_factory(self.engine)

        self.session = get_tm_session(session_factory, transaction.manager)
        self.init_database()

    def init_database(self):
        logger.debug(self, 'Init Database Schema...')
        from tracim.models.meta import DeclarativeBase
        DeclarativeBase.metadata.create_all(self.engine)

    def tearDown(self):
        logger.debug(self, 'TearDown Test...')
        from tracim.models.meta import DeclarativeBase

        testing.tearDown()
        transaction.abort()
        DeclarativeBase.metadata.drop_all(self.engine)


class StandardTest(BaseTest):
    """
    BaseTest with default fixtures
    """
    fixtures = [BaseFixture]

    def init_database(self):
        BaseTest.init_database(self)
        fixtures_loader = FixturesLoader(
            session=self.session,
            config=CFG(self.config.get_settings()))
        fixtures_loader.loads(self.fixtures)


class DefaultTest(StandardTest):

    def _create_workspace_and_test(self, name, user) -> Workspace:
        """
        All extra parameters (*args, **kwargs) are for Workspace init
        :return: Created workspace instance
        """
        WorkspaceApi(
            current_user=user,
            session=self.session,
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
            type=ContentType.Folder,
            owner=user
        )
        thread = self._create_content_and_test(
            thread_name,
            workspace,
            type=ContentType.Thread,
            parent=folder,
            owner=user
        )
        return thread


class MailHogTest(DefaultTest):
    """
    Theses test need a working mailhog
    """

    config_section = 'mail_test'

    def tearDown(self):
        logger.debug(self, 'Cleanup MailHog list...')
        requests.delete('http://127.0.0.1:8025/api/v1/messages')
