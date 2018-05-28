# -*- coding: utf-8 -*-
import io

import pytest
from sqlalchemy.exc import InvalidRequestError
from wsgidav.wsgidav_app import DEFAULT_CONFIG
from tracim import WebdavAppFactory
from tracim.lib.core.user import UserApi
from tracim.lib.webdav import TracimDomainController
from tracim.tests import eq_
from tracim.lib.core.notifications import DummyNotifier
from tracim.lib.webdav.dav_provider import Provider
from tracim.lib.webdav.resources import RootResource
from tracim.models import Content
from tracim.models import ContentRevisionRO
from tracim.tests import StandardTest
from tracim.fixtures.content import Content as ContentFixtures
from tracim.fixtures.users_and_groups import Base as BaseFixture
from wsgidav import util
from unittest.mock import MagicMock


class TestWebdavFactory(StandardTest):

    def test_unit__initConfig__ok__nominal_case(self):
        """
        Check if config is correctly modify for wsgidav using mocked
        wsgidav and tracim conf (as dict)
        :return:
        """
        tracim_settings = {
            'sqlalchemy.url': 'sqlite:///:memory:',
            'user.auth_token.validity': '604800',
            'depot_storage_dir': '/tmp/test/depot',
            'depot_storage_name': 'test',
            'preview_cache_dir': '/tmp/test/preview_cache',
            'wsgidav.config_path': 'development.ini'

        }
        wsgidav_setting = DEFAULT_CONFIG.copy()
        wsgidav_setting.update(
            {
               'root_path':  '',
               'acceptbasic': True,
               'acceptdigest': False,
               'defaultdigest': False,
            }
        )
        mock = MagicMock()
        mock._initConfig = WebdavAppFactory._initConfig
        mock._readConfigFile.return_value = wsgidav_setting
        mock._get_tracim_settings.return_value = tracim_settings
        config = mock._initConfig(mock)
        assert config
        assert config['acceptbasic'] is True
        assert config['acceptdigest'] is False
        assert config['defaultdigest'] is False
        # TODO - G.M - 25-05-2018 - Better check for middleware stack config
        assert 'middleware_stack' in config
        assert len(config['middleware_stack']) == 7
        assert 'root_path' in config
        assert 'provider_mapping' in config
        assert config['root_path'] in config['provider_mapping']
        assert isinstance(config['provider_mapping'][config['root_path']], Provider)  # nopep8
        assert 'domaincontroller' in config
        assert isinstance(config['domaincontroller'], TracimDomainController)


class TestWebDav(StandardTest):
    fixtures = [BaseFixture, ContentFixtures]

    def _get_provider(self, config):
        return Provider(
            show_archived=False,
            show_deleted=False,
            show_history=False,
            app_config=config,
        )

    def _get_environ(
            self,
            provider: Provider,
            username: str,
    ) -> dict:
        return {
            'http_authenticator.username': username,
            'http_authenticator.realm': '/',
            'wsgidav.provider': provider,
            'tracim_user': self._get_user(username),
            'tracim_dbsession': self.session,
        }

    def _get_user(self, email):
        return UserApi(None,
                       self.session,
                       self.app_config
                       ).get_one_by_email(email)
    def _put_new_text_file(
            self,
            provider,
            environ,
            file_path,
            file_content,
    ):
        # This part id a reproduction of
        # wsgidav.request_server.RequestServer#doPUT

        # Grab parent folder where create file
        parentRes = provider.getResourceInst(
            util.getUriParent(file_path),
            environ,
        )
        assert parentRes, 'we should found folder for {0}'.format(file_path)

        new_resource = parentRes.createEmptyResource(
            util.getUriName(file_path),
        )
        write_object = new_resource.beginWrite(
            contentType='application/octet-stream',
        )
        write_object.write(file_content)
        write_object.close()
        new_resource.endWrite(withErrors=False)

        # Now file should exist
        return provider.getResourceInst(
            file_path,
            environ,
        )

    def test_unit__get_root__ok(self):
        provider = self._get_provider(self.app_config)
        root = provider.getResourceInst(
            '/',
            self._get_environ(
                provider,
                'bob@fsf.local',
            )
        )
        assert root, 'Path / should return a RootResource instance'
        assert isinstance(root, RootResource)

    def test_unit__list_workspaces_with_user__ok(self):
        provider = self._get_provider(self.app_config)
        root = provider.getResourceInst(
            '/',
            self._get_environ(
                provider,
                'bob@fsf.local',
            )
        )
        assert root, 'Path / should return a RootResource instance'
        assert isinstance(root, RootResource), 'Path / should return a RootResource instance'

        children = root.getMemberList()
        eq_(
            2,
            len(children),
            msg='RootResource should return 2 workspaces instead {0}'.format(
                len(children),
            )
        )

        workspaces_names = [w.name for w in children]
        assert 'w1' in workspaces_names, \
            'w1 should be in names ({0})'.format(
                workspaces_names,
        )
        assert 'w2' in workspaces_names, 'w2 should be in names ({0})'.format(
            workspaces_names,
        )

    def test_unit__list_workspaces_with_admin__ok(self):
        provider = self._get_provider(self.app_config)
        root = provider.getResourceInst(
            '/',
            self._get_environ(
                provider,
                'admin@admin.admin',
            )
        )
        assert root, 'Path / should return a RootResource instance'
        assert isinstance(root, RootResource), 'Path / should return a RootResource instance'

        children = root.getMemberList()
        eq_(
            2,
            len(children),
            msg='RootResource should return 2 workspaces instead {0}'.format(
                len(children),
            )
        )

        workspaces_names = [w.name for w in children]
        assert 'w1' in workspaces_names, 'w1 should be in names ({0})'.format(
            workspaces_names,
        )
        assert 'w3' in workspaces_names, 'w3 should be in names ({0})'.format(
            workspaces_names,
        )

    def test_unit__list_workspace_folders__ok(self):
        provider = self._get_provider(self.app_config)
        w1 = provider.getResourceInst(
            '/w1/',
            self._get_environ(
                provider,
                'bob@fsf.local',
            )
        )
        assert w1, 'Path /w1 should return a Wrkspace instance'

        children = w1.getMemberList()
        eq_(
            2,
            len(children),
            msg='w1 should list 2 folders instead {0}'.format(
                len(children),
            ),
        )

        folders_names = [f.name for f in children]
        assert 'w1f1' in folders_names, 'w1f1 should be in names ({0})'.format(
                folders_names,
        )
        assert 'w1f2' in folders_names, 'w1f2 should be in names ({0})'.format(
                folders_names,
        )

    def test_unit__list_content__ok(self):
        provider = self._get_provider(self.app_config)
        w1f1 = provider.getResourceInst(
            '/w1/w1f1',
            self._get_environ(
                provider,
                'bob@fsf.local',
            )
        )
        assert w1f1, 'Path /w1f1 should return a Wrkspace instance'

        children = w1f1.getMemberList()
        eq_(
            5,
            len(children),
            msg='w1f1 should list 5 folders instead {0}'.format(
                len(children),
            ),
        )

        content_names = [c.name for c in children]
        assert 'w1f1p1.html' in content_names, \
            'w1f1.html should be in names ({0})'.format(
                content_names,
        )

        assert 'w1f1t1.html' in content_names,\
            'w1f1t1.html should be in names ({0})'.format(
                content_names,
        )
        assert 'w1f1d1.txt' in content_names,\
            'w1f1d1.txt should be in names ({0})'.format(content_names,)

        assert 'w1f1f1' in content_names, \
            'w1f1f1 should be in names ({0})'.format(
                content_names,
        )

        assert 'w1f1d2.html' in content_names,\
            'w1f1d2.html should be in names ({0})'.format(
                content_names,
        )

    def test_unit__get_content__ok(self):
        provider = self._get_provider(self.app_config)
        w1f1d1 = provider.getResourceInst(
            '/w1/w1f1/w1f1d1.txt',
            self._get_environ(
                provider,
                'bob@fsf.local',
            )
        )

        assert w1f1d1, 'w1f1d1 should be found'
        eq_('w1f1d1.txt', w1f1d1.name)

    def test_unit__delete_content__ok(self):
        provider = self._get_provider(self.app_config)
        w1f1d1 = provider.getResourceInst(
            '/w1/w1f1/w1f1d1.txt',
            self._get_environ(
                provider,
                'bob@fsf.local',
            )
        )
        
        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(Content.label == 'w1f1d1') \
            .one()  # It must exist only one revision, cf fixtures
        eq_(
            False,
            content_w1f1d1.is_deleted,
            msg='Content should not be deleted !'
        )
        content_w1f1d1_id = content_w1f1d1.content_id

        w1f1d1.delete()

        self.session.flush()
        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(Content.content_id == content_w1f1d1_id) \
            .order_by(Content.revision_id.desc()) \
            .first()
        eq_(
            True,
            content_w1f1d1.is_deleted,
            msg='Content should be deleted !'
        )

        result = provider.getResourceInst(
            '/w1/w1f1/w1f1d1.txt',
            self._get_environ(
                provider,
                'bob@fsf.local',
            )
        )
        eq_(None, result, msg='Result should be None instead {0}'.format(
            result
        ))

    def test_unit__create_content__ok(self):
        provider = self._get_provider(self.app_config)
        environ = self._get_environ(
            provider,
            'bob@fsf.local',
        )
        result = provider.getResourceInst(
            '/w1/w1f1/new_file.txt',
            environ,
        )

        eq_(None, result, msg='Result should be None instead {0}'.format(
            result
        ))

        result = self._put_new_text_file(
            provider,
            environ,
            '/w1/w1f1/new_file.txt',
            b'hello\n',
        )

        assert result, 'Result should not be None instead {0}'.format(
            result
        )
        eq_(
            b'hello\n',
            result.content.depot_file.file.read(),
            msg='fiel content should be "hello\n" but it is {0}'.format(
                result.content.depot_file.file.read()
            )
        )

    def test_unit__create_delete_and_create_file__ok(self):
        provider = self._get_provider(self.app_config)
        environ = self._get_environ(
            provider,
            'bob@fsf.local',
        )
        new_file = provider.getResourceInst(
            '/w1/w1f1/new_file.txt',
            environ,
        )

        eq_(None, new_file, msg='Result should be None instead {0}'.format(
            new_file
        ))

        # create it
        new_file = self._put_new_text_file(
            provider,
            environ,
            '/w1/w1f1/new_file.txt',
            b'hello\n',
        )
        assert new_file, 'Result should not be None instead {0}'.format(
            new_file
        )

        content_new_file = self.session.query(ContentRevisionRO) \
            .filter(Content.label == 'new_file') \
            .one()  # It must exist only one revision
        eq_(
            False,
            content_new_file.is_deleted,
            msg='Content should not be deleted !'
        )
        content_new_file_id = content_new_file.content_id

        # Delete if
        new_file.delete()

        self.session.flush()
        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(Content.content_id == content_new_file_id) \
            .order_by(Content.revision_id.desc()) \
            .first()
        eq_(
            True,
            content_w1f1d1.is_deleted,
            msg='Content should be deleted !'
        )

        result = provider.getResourceInst(
            '/w1/w1f1/new_file.txt',
            self._get_environ(
                provider,
                'bob@fsf.local',
            )
        )
        eq_(None, result, msg='Result should be None instead {0}'.format(
            result
        ))

        # Then create it again
        new_file = self._put_new_text_file(
            provider,
            environ,
            '/w1/w1f1/new_file.txt',
            b'hello\n',
        )
        assert new_file, 'Result should not be None instead {0}'.format(
            new_file
        )

        # Previous file is still dleeted
        self.session.flush()
        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(Content.content_id == content_new_file_id) \
            .order_by(Content.revision_id.desc()) \
            .first()
        eq_(
            True,
            content_w1f1d1.is_deleted,
            msg='Content should be deleted !'
        )

        # And an other file exist for this name
        content_new_new_file = self.session.query(ContentRevisionRO) \
            .filter(Content.label == 'new_file') \
            .order_by(Content.revision_id.desc()) \
            .first()
        assert content_new_new_file.content_id != content_new_file_id,\
            'Contents ids should not be same !'

        eq_(
            False,
            content_new_new_file.is_deleted,
            msg='Content should not be deleted !'
        )

    def test_unit__rename_content__ok(self):
        provider = self._get_provider(self.app_config)
        environ = self._get_environ(
            provider,
            'bob@fsf.local',
        )
        w1f1d1 = provider.getResourceInst(
            '/w1/w1f1/w1f1d1.txt',
            environ,
        )

        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(Content.label == 'w1f1d1') \
            .one()  # It must exist only one revision, cf fixtures
        assert content_w1f1d1, 'w1f1d1 should be exist'
        content_w1f1d1_id = content_w1f1d1.content_id

        w1f1d1.moveRecursive('/w1/w1f1/w1f1d1_RENAMED.txt')

        # Database content is renamed
        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(ContentRevisionRO.content_id == content_w1f1d1_id) \
            .order_by(ContentRevisionRO.revision_id.desc()) \
            .first()
        eq_(
            'w1f1d1_RENAMED',
            content_w1f1d1.label,
            msg='File should be labeled w1f1d1_RENAMED, not {0}'.format(
                content_w1f1d1.label
            )
        )

    def test_unit__move_content__ok(self):
        provider = self._get_provider(self.app_config)
        environ = self._get_environ(
            provider,
            'bob@fsf.local',
        )
        w1f1d1 = provider.getResourceInst(
            '/w1/w1f1/w1f1d1.txt',
            environ,
        )

        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(Content.label == 'w1f1d1') \
            .one()  # It must exist only one revision, cf fixtures
        assert content_w1f1d1, 'w1f1d1 should be exist'
        content_w1f1d1_id = content_w1f1d1.content_id
        content_w1f1d1_parent = content_w1f1d1.parent
        eq_(
            content_w1f1d1_parent.label,
            'w1f1',
            msg='field parent should be w1f1',
        )

        w1f1d1.moveRecursive('/w1/w1f2/w1f1d1.txt')  # move in f2

        # Database content is moved
        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(ContentRevisionRO.content_id == content_w1f1d1_id) \
            .order_by(ContentRevisionRO.revision_id.desc()) \
            .first()

        assert content_w1f1d1.parent.label != content_w1f1d1_parent.label,\
            'file should be moved in w1f2 but is in {0}'.format(
                content_w1f1d1.parent.label
        )

    def test_unit__move_and_rename_content__ok(self):
        provider = self._get_provider(self.app_config)
        environ = self._get_environ(
            provider,
            'bob@fsf.local',
        )
        w1f1d1 = provider.getResourceInst(
            '/w1/w1f1/w1f1d1.txt',
            environ,
        )

        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(Content.label == 'w1f1d1') \
            .one()  # It must exist only one revision, cf fixtures
        assert content_w1f1d1, 'w1f1d1 should be exist'
        content_w1f1d1_id = content_w1f1d1.content_id
        content_w1f1d1_parent = content_w1f1d1.parent
        eq_(
            content_w1f1d1_parent.label,
            'w1f1',
            msg='field parent should be w1f1',
        )

        w1f1d1.moveRecursive('/w1/w1f2/w1f1d1_RENAMED.txt')

        # Database content is moved
        content_w1f1d1 = self.session.query(ContentRevisionRO) \
            .filter(ContentRevisionRO.content_id == content_w1f1d1_id) \
            .order_by(ContentRevisionRO.revision_id.desc()) \
            .first()
        assert content_w1f1d1.parent.label != content_w1f1d1_parent.label,\
            'file should be moved in w1f2 but is in {0}'.format(
                content_w1f1d1.parent.label
        )
        eq_(
            'w1f1d1_RENAMED',
            content_w1f1d1.label,
            msg='File should be labeled w1f1d1_RENAMED, not {0}'.format(
                content_w1f1d1.label
            )
        )

    def test_unit__move_content__ok__another_workspace(self):
        provider = self._get_provider(self.app_config)
        environ = self._get_environ(
            provider,
            'bob@fsf.local',
        )
        content_to_move_res = provider.getResourceInst(
            '/w1/w1f1/w1f1d1.txt',
            environ,
        )

        content_to_move = self.session.query(ContentRevisionRO) \
            .filter(Content.label == 'w1f1d1') \
            .one()  # It must exist only one revision, cf fixtures
        assert content_to_move, 'w1f1d1 should be exist'
        content_to_move_id = content_to_move.content_id
        content_to_move_parent = content_to_move.parent
        eq_(
            content_to_move_parent.label,
            'w1f1',
            msg='field parent should be w1f1',
        )

        content_to_move_res.moveRecursive('/w2/w2f1/w1f1d1.txt')  # move in w2, f1

        # Database content is moved
        content_to_move = self.session.query(ContentRevisionRO) \
            .filter(ContentRevisionRO.content_id == content_to_move_id) \
            .order_by(ContentRevisionRO.revision_id.desc()) \
            .first()

        assert content_to_move.parent, 'Content should have a parent'

        assert content_to_move.parent.label == 'w2f1',\
            'file should be moved in w2f1 but is in {0}'.format(
                content_to_move.parent.label
        )

    def test_unit__update_content__ok(self):
        provider = self._get_provider(self.app_config)
        environ = self._get_environ(
            provider,
            'bob@fsf.local',
        )
        result = provider.getResourceInst(
            '/w1/w1f1/new_file.txt',
            environ,
        )

        eq_(None, result, msg='Result should be None instead {0}'.format(
            result
        ))

        result = self._put_new_text_file(
            provider,
            environ,
            '/w1/w1f1/new_file.txt',
            b'hello\n',
        )

        assert result, 'Result should not be None instead {0}'.format(
            result
        )
        eq_(
            b'hello\n',
            result.content.depot_file.file.read(),
            msg='fiel content should be "hello\n" but it is {0}'.format(
                result.content.depot_file.file.read()
            )
        )

        # ReInit DummyNotifier counter
        DummyNotifier.send_count = 0

        # Update file content
        write_object = result.beginWrite(
            contentType='application/octet-stream',
        )
        write_object.write(b'An other line')
        write_object.close()
        result.endWrite(withErrors=False)

        eq_(
            1,
            DummyNotifier.send_count,
            msg='DummyNotifier should send 1 mail, not {}'.format(
                DummyNotifier.send_count
            ),
        )
