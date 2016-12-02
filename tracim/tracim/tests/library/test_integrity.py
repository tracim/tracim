# -*- coding: utf-8 -*-
from nose.tools import ok_

from tracim.fixtures.content import Content as ContentFixtures
from tracim.lib.integrity import PathValidationManager
from tracim.model import DBSession
from tracim.model.data import Workspace
from tracim.model.data import Content
from tracim.model.data import ContentRevisionRO
from tracim.tests import TestStandard


class TestWebDav(TestStandard):
    fixtures = [ContentFixtures]

    def _get_content_by_label(self, label: str) -> Content:
        revision = DBSession.query(ContentRevisionRO) \
            .filter(ContentRevisionRO.label == label) \
            .one()

        return DBSession.query(Content) \
            .filter(Content.id == revision.content_id) \
            .one()

    def test_unit__workspace_label_available__ok(self):
        integrity_manager = PathValidationManager()
        ok_(
            integrity_manager.workspace_label_is_free('w42'),
            msg='label w42 should not be used',
        )

    def test_unit__workspace_label_reserved__ok(self):
        integrity_manager = PathValidationManager()
        ok_(
            not integrity_manager.workspace_label_is_free('w1'),
            msg='label w1 should be reserved',
        )

    def test_unit__workspace_label_reserved_with_case__ok(self):
        integrity_manager = PathValidationManager()
        ok_(
            not integrity_manager.workspace_label_is_free('W1'),
            msg='label W1 should be reserved',
        )

    def test_unit__folder_label_available__ok__folder_at_root(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()

        ok_(
            integrity_manager.content_label_is_free(
                content_label_as_file='f42',
                workspace=w1,
                parent=None,
            ),
            msg='label f42 should not be used',
        )

    def test_unit__folder_label_reserved__ok__folder_at_root(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()

        ok_(
            not integrity_manager.content_label_is_free(
                content_label_as_file='w1f1',
                workspace=w1,
                parent=None,
            ),
            msg='label w1f1 should be reserved',
        )

    def test_unit__folder_label_reserved_with_case__ok__folder_at_root(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()

        ok_(
            not integrity_manager.content_label_is_free(
                content_label_as_file='W1F1',
                workspace=w1,
                parent=None,
            ),
            msg='label W1F1 should be reserved',
        )

    def test_unit__folder_label_reserved__ok__folder_in_folder(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()
        w1f1 = self._get_content_by_label('w1f1')

        ok_(
            not integrity_manager.content_label_is_free(
                content_label_as_file='w1f1f1',
                workspace=w1,
                parent=w1f1,
            ),
            msg='label w1f1f1 should be reserved',
        )

    def test_unit__content_label_reserved__ok__because_page_name(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()
        w1f1 = self._get_content_by_label('w1f1')

        ok_(
            not integrity_manager.content_label_is_free(
                content_label_as_file='w1f1p1.html',
                workspace=w1,
                parent=w1f1,
            ),
            msg='label w1f1p1.html should be reserved '
                'because page w1f1p1.html',
        )

    def test_unit__content_label_available__ok(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()
        w1f1 = self._get_content_by_label('w1f1')

        ok_(
            integrity_manager.content_label_is_free(
                content_label_as_file='w1f1p42.html',
                workspace=w1,
                parent=w1f1,
            ),
            msg='label w1f1p42.html should be available',
        )

    def test_unit__content_label_available__ok__without_extension(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()
        w1f1 = self._get_content_by_label('w1f1')

        ok_(
            integrity_manager.content_label_is_free(
                content_label_as_file='w1f1p42',
                workspace=w1,
                parent=w1f1,
            ),
            msg='label w1f1p42 should be available',
        )

    def test_unit__content_label_reserved__ok(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()
        w1f1 = self._get_content_by_label('w1f1')

        ok_(
            not integrity_manager.content_label_is_free(
                content_label_as_file='w1f1p1.html',
                workspace=w1,
                parent=w1f1,
            ),
            msg='label w1f1p1.html should be reserved',
        )

    def test_unit__content_label_reserved__ok__because_thread_extension(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()
        w1f1 = self._get_content_by_label('w1f1')

        ok_(
            not integrity_manager.content_label_is_free(
                content_label_as_file='w1f1t1.html',
                workspace=w1,
                parent=w1f1,
            ),
            msg='label w1f1t1 should be reserved because '
                'w1f1t1 rendered with .html',
        )

    def test_unit__content_label_reserved__ok__because_html_file(self):
        integrity_manager = PathValidationManager()
        w1 = DBSession.query(Workspace).filter(Workspace.label == 'w1').one()
        w1f1 = self._get_content_by_label('w1f1')

        ok_(
            not integrity_manager.content_label_is_free(
                content_label_as_file='w1f1d2.html',
                workspace=w1,
                parent=w1f1,
            ),
            msg='label w1f1d2.html should be reserved because '
                'w1f1d2 rendered with .html and file w1f1d2.html exist',
        )
