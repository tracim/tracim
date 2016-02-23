# -*- coding: utf-8 -*-
from nose.tools import raises
from sqlalchemy.orm import aliased
from sqlalchemy.sql.elements import and_
from sqlalchemy.testing import eq_

from tracim.lib.content import ContentApi
from tracim.lib.exception import ContentRevisionUpdateError
from tracim.model import DBSession, User, Content
from tracim.model.data import ContentRevisionRO, Workspace, ActionDescription, ContentType, new_revision
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
            content.description = 'TEST_CONTENT_DESCRIPTION_1_UPDATED'
        DBSession.flush()

        eq_(2, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_1').count())
        eq_(1, DBSession.query(Content).filter(Content.id == created_content.id).count())

        with new_revision(content):
            content.description = 'TEST_CONTENT_DESCRIPTION_1_UPDATED_2'
            content.label = 'TEST_CONTENT_1_UPDATED_2'
        DBSession.flush()

        eq_(1, DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.label == 'TEST_CONTENT_1_UPDATED_2').count())
        eq_(1, DBSession.query(Content).filter(Content.id == created_content.id).count())

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
            #file_content=None,  # TODO: pk ? (J'ai du mettre nullable=True)
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

    def _create_content(self, *args, **kwargs):
        content = Content(*args, **kwargs)
        DBSession.add(content)
        DBSession.flush()

        return content
