# -*- coding: utf-8 -*-
import time

from depot.fields.upload import UploadedFile
from nose.tools import ok_
from nose.tools import raises
from sqlalchemy.sql.elements import and_
from sqlalchemy.testing import eq_

from tracim.lib.content import ContentApi
from tracim.lib.exception import ContentRevisionUpdateError
from tracim.model import Content
from tracim.model import DBSession
from tracim.model import new_revision
from tracim.model import User
from tracim.model.data import ActionDescription
from tracim.model.data import ContentRevisionRO
from tracim.model.data import ContentType
from tracim.model.data import Workspace
from tracim.tests import TestStandard


class TestContent(TestStandard):

    @raises(ContentRevisionUpdateError)
    def test_update_without_prepare(self):
        content1 = self.test_create()
        content1.description = 'FOO'  # Raise ContentRevisionUpdateError because revision can't be updated

    def test_query(self):
        content1 = self.test_create()
        with new_revision(content1):
            content1.description = 'TEST_CONTENT_DESCRIPTION_1_UPDATED'
        DBSession.flush()

        content2 = self.test_create(key='2')
        with new_revision(content2):
            content2.description = 'TEST_CONTENT_DESCRIPTION_2_UPDATED'
        DBSession.flush()

        workspace1 = DBSession.query(Workspace).filter(Workspace.label == 'TEST_WORKSPACE_1').one()
        workspace2 = DBSession.query(Workspace).filter(Workspace.label == 'TEST_WORKSPACE_2').one()

        # To get Content in database we have to join Content and ContentRevisionRO with particular condition:
        # Join have to be on most recent revision
        join_sub_query = DBSession.query(ContentRevisionRO.revision_id)\
            .filter(ContentRevisionRO.content_id == Content.id)\
            .order_by(ContentRevisionRO.revision_id.desc())\
            .limit(1)\
            .correlate(Content)

        base_query = DBSession.query(Content)\
            .join(ContentRevisionRO, and_(Content.id == ContentRevisionRO.content_id,
                                          ContentRevisionRO.revision_id == join_sub_query))

        eq_(2, base_query.count())

        eq_(1, base_query.filter(Content.workspace == workspace1).count())
        eq_(1, base_query.filter(Content.workspace == workspace2).count())

        content1_from_query = base_query.filter(Content.workspace == workspace1).one()
        eq_(content1.id, content1_from_query.id)
        eq_('TEST_CONTENT_DESCRIPTION_1_UPDATED', content1_from_query.description)

        user_admin = DBSession.query(User).filter(User.email == 'admin@admin.admin').one()
        api = ContentApi(None)

        content1_from_api = api.get_one(content1.id, ContentType.Page, workspace1)

    def test_update(self):
        created_content = self.test_create()
        content = DBSession.query(Content).filter(Content.id == created_content.id).one()
        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_1').count())

        with new_revision(content):
            time.sleep(0.00001)
            content.description = 'TEST_CONTENT_DESCRIPTION_1_UPDATED'
        DBSession.flush()

        eq_(2, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_1').count())
        eq_(1, DBSession.query(Content).filter(Content.id == created_content.id).count())

        with new_revision(content):
            time.sleep(0.00001)
            content.description = 'TEST_CONTENT_DESCRIPTION_1_UPDATED_2'
            content.label = 'TEST_CONTENT_1_UPDATED_2'
        DBSession.flush()

        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_1_UPDATED_2').count())
        eq_(1, DBSession.query(Content).filter(Content.id == created_content.id).count())

        revision_1 = DBSession.query(ContentRevisionRO)\
            .filter(ContentRevisionRO.description == 'TEST_CONTENT_DESCRIPTION_1').one()
        revision_2 = DBSession.query(ContentRevisionRO)\
            .filter(ContentRevisionRO.description == 'TEST_CONTENT_DESCRIPTION_1_UPDATED').one()
        revision_3 = DBSession.query(ContentRevisionRO)\
            .filter(ContentRevisionRO.description == 'TEST_CONTENT_DESCRIPTION_1_UPDATED_2').one()

        # Updated dates must be different
        ok_(revision_1.updated < revision_2.updated < revision_3.updated)
        # Created dates must be equal
        ok_(revision_1.created == revision_2.created == revision_3.created)

    def test_creates(self):
        eq_(0, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_1').count())
        eq_(0, DBSession.query(Workspace).filter(Workspace.label == 'TEST_WORKSPACE_1').count())

        user_admin = DBSession.query(User).filter(User.email == 'admin@admin.admin').one()
        workspace = Workspace(label="TEST_WORKSPACE_1")
        DBSession.add(workspace)
        DBSession.flush()
        eq_(1, DBSession.query(Workspace).filter(Workspace.label == 'TEST_WORKSPACE_1').count())

        first_content = self._create_content(
            owner=user_admin,
            workspace=workspace,
            type=ContentType.Page,
            label='TEST_CONTENT_1',
            description='TEST_CONTENT_DESCRIPTION_1',
            revision_type=ActionDescription.CREATION,
            is_deleted=False,  # TODO: pk ?
            is_archived=False,  # TODO: pk ?
            # file_content=None,  # TODO: pk ? (J'ai du mettre nullable=True)
        )

        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_1').count())

        content = DBSession.query(Content).filter(Content.id == first_content.id).one()
        eq_('TEST_CONTENT_1', content.label)
        eq_('TEST_CONTENT_DESCRIPTION_1', content.description)

        # Create a second content
        second_content = self._create_content(
            owner=user_admin,
            workspace=workspace,
            type=ContentType.Page,
            label='TEST_CONTENT_2',
            description='TEST_CONTENT_DESCRIPTION_2',
            revision_type=ActionDescription.CREATION
        )

        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_2').count())

        content = DBSession.query(Content).filter(Content.id == second_content.id).one()
        eq_('TEST_CONTENT_2', content.label)
        eq_('TEST_CONTENT_DESCRIPTION_2', content.description)

    def test_create(self, key='1'):
        eq_(0, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_%s' % key).count())
        eq_(0, DBSession.query(Workspace).filter(Workspace.label == 'TEST_WORKSPACE_%s' % key).count())

        user_admin = DBSession.query(User).filter(User.email == 'admin@admin.admin').one()
        workspace = Workspace(label="TEST_WORKSPACE_%s" % key)
        DBSession.add(workspace)
        DBSession.flush()
        eq_(1, DBSession.query(Workspace).filter(Workspace.label == 'TEST_WORKSPACE_%s' % key).count())

        created_content = self._create_content(
            owner=user_admin,
            workspace=workspace,
            type=ContentType.Page,
            label='TEST_CONTENT_%s' % key,
            description='TEST_CONTENT_DESCRIPTION_%s' % key,
            revision_type=ActionDescription.CREATION
        )

        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_%s' % key).count())

        content = DBSession.query(Content).filter(Content.id == created_content.id).one()
        eq_('TEST_CONTENT_%s' % key, content.label)
        eq_('TEST_CONTENT_DESCRIPTION_%s' % key, content.description)

        return created_content

    def _get_user(self):
        email = 'admin@admin.admin'
        user_query = DBSession.query(User)
        user_filter = user_query.filter(User.email == email)
        user = user_filter.one()
        return user

    def _create_content(self, *args, **kwargs):
        content = Content(*args, **kwargs)
        DBSession.add(content)
        DBSession.flush()
        return content

    def _create_content_from_nothing(self):
        user_admin = self._get_user()
        workspace = Workspace(label="TEST_WORKSPACE_1")
        content = self._create_content(
            owner=user_admin,
            workspace=workspace,
            type=ContentType.File,
            label='TEST_CONTENT_1',
            description='TEST_CONTENT_DESCRIPTION_1',
            revision_type=ActionDescription.CREATION,
        )
        return content

    def test_unit__content_depot_file(self):
        """ Depot file access thought content property methods. """
        content = self._create_content_from_nothing()
        # tests uninitialized depot file
        eq_(content.depot_file, None)
        # initializes depot file
        # which is able to behave like a python file object
        content.depot_file = b'test'
        # tests initialized depot file
        ok_(content.depot_file)
        # tests type of initialized depot file
        eq_(type(content.depot_file), UploadedFile)
        # tests content of initialized depot file
        # using depot_file.file of type StoredFile to fetch content back
        eq_(content.depot_file.file.read(), b'test')
