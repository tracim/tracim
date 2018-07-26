# -*- coding: utf-8 -*-
import time

from depot.fields.upload import UploadedFile
from sqlalchemy.sql.elements import and_
from sqlalchemy.testing import eq_
import transaction
import pytest

# from tracim.lib.content import ContentApi
from tracim.exceptions import ContentRevisionUpdateError
from tracim.lib.core.content import ContentApi
from tracim.models import Content
from tracim.models.revision_protection import new_revision
from tracim.models import User
from tracim.models.data import ActionDescription
from tracim.models.data import ContentRevisionRO
from tracim.models.data import ContentType
from tracim.models.data import Workspace
from tracim.tests import StandardTest


class TestContent(StandardTest):

    def test_update_without_prepare(self):
        content1 = self.test_create()
        with pytest.raises(ContentRevisionUpdateError):
            content1.description = 'FOO'
        # Raise ContentRevisionUpdateError because revision can't be updated

    def test_query(self):
        content1 = self.test_create()
        with new_revision(
                session=self.session,
                tm=transaction.manager,
                content=content1,
        ):
            content1.description = 'TEST_CONTENT_DESCRIPTION_1_UPDATED'
        self.session.flush()

        content2 = self.test_create(key='2')
        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=content2,
        ):
            content2.description = 'TEST_CONTENT_DESCRIPTION_2_UPDATED'
        self.session.flush()

        workspace1 = self.session.query(Workspace)\
            .filter(Workspace.label == 'TEST_WORKSPACE_1').one()
        workspace2 = self.session.query(Workspace)\
            .filter(Workspace.label == 'TEST_WORKSPACE_2').one()

        # To get Content in database
        # we have to join Content and ContentRevisionRO
        # with particular condition:
        # Join have to be on most recent revision
        join_sub_query = self.session.query(ContentRevisionRO.revision_id)\
            .filter(ContentRevisionRO.content_id == Content.id)\
            .order_by(ContentRevisionRO.revision_id.desc())\
            .limit(1)\
            .correlate(Content)

        base_query = self.session.query(Content).join(
            ContentRevisionRO,
            and_(
                Content.id == ContentRevisionRO.content_id,
                ContentRevisionRO.revision_id == join_sub_query
            )
        )

        pattern = 'TEST_CONTENT_DESCRIPTION_%_UPDATED'
        eq_(2, base_query.filter(Content.description.like(pattern)).count())

        eq_(1, base_query.filter(Content.workspace == workspace1).count())
        eq_(1, base_query.filter(Content.workspace == workspace2).count())

        content1_from_query = base_query\
            .filter(Content.workspace == workspace1).one()
        eq_(content1.id, content1_from_query.id)
        eq_(
            'TEST_CONTENT_DESCRIPTION_1_UPDATED',
            content1_from_query.description
        )

        user_admin = self.session.query(User)\
            .filter(User.email == 'admin@admin.admin').one()

        api = ContentApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )

        content1_from_api = api.get_one(
            content1.id,
            ContentType.Page,
            workspace1
        )

    def test_update(self):
        created_content = self.test_create()
        content = self.session.query(Content)\
            .filter(Content.id == created_content.id).one()
        eq_(1, self.session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.label == 'TEST_CONTENT_1').count())

        with new_revision(
                session=self.session,
                tm=transaction.manager,
                content=content
        ):
            time.sleep(0.00001)
            content.description = 'TEST_CONTENT_DESCRIPTION_1_UPDATED'
        self.session.flush()

        eq_(
            2,
            self.session.query(ContentRevisionRO).filter(
                ContentRevisionRO.label == 'TEST_CONTENT_1'
            ).count()
        )
        eq_(
            1,
            self.session.query(Content).filter(
                Content.id == created_content.id
            ).count()
        )

        with new_revision(
                session=self.session,
                tm=transaction.manager,
                content=content
        ):
            time.sleep(0.00001)
            content.description = 'TEST_CONTENT_DESCRIPTION_1_UPDATED_2'
            content.label = 'TEST_CONTENT_1_UPDATED_2'
        self.session.flush()

        eq_(
            1,
            self.session.query(ContentRevisionRO).filter(
                ContentRevisionRO.label == 'TEST_CONTENT_1_UPDATED_2'
            ).count()
        )
        eq_(
            1,
            self.session.query(Content).filter(
                Content.id == created_content.id
            ).count()
        )

        revision_1 = self.session.query(ContentRevisionRO).filter(
            ContentRevisionRO.description == 'TEST_CONTENT_DESCRIPTION_1'
        ).one()
        revision_2 = self.session.query(ContentRevisionRO).filter(
            ContentRevisionRO.description == 'TEST_CONTENT_DESCRIPTION_1_UPDATED'  # nopep8
        ).one()
        revision_3 = self.session.query(ContentRevisionRO).filter(
            ContentRevisionRO.description == 'TEST_CONTENT_DESCRIPTION_1_UPDATED_2'  # nopep8
        ).one()

        # Updated dates must be different
        assert revision_1.updated < revision_2.updated < revision_3.updated
        # Created dates must be equal
        assert revision_1.created == revision_2.created == revision_3.created

    def test_creates(self):
        eq_(
            0,
            self.session.query(ContentRevisionRO).filter(
                ContentRevisionRO.label == 'TEST_CONTENT_1'
            ).count()
        )
        eq_(
            0,
            self.session.query(Workspace).filter(
                Workspace.label == 'TEST_WORKSPACE_1'
            ).count()
        )

        user_admin = self.session.query(User).filter(
            User.email == 'admin@admin.admin'
        ).one()
        workspace = Workspace(label="TEST_WORKSPACE_1")
        self.session.add(workspace)
        self.session.flush()
        eq_(
            1,
            self.session.query(Workspace).filter(
                Workspace.label == 'TEST_WORKSPACE_1'
            ).count()
        )

        first_content = self._create_content(
            owner=user_admin,
            workspace=workspace,
            type=ContentType.Page,
            label='TEST_CONTENT_1',
            description='TEST_CONTENT_DESCRIPTION_1',
            revision_type=ActionDescription.CREATION,
            is_deleted=False,
            is_archived=False,
        )

        eq_(
            1,
            self.session.query(ContentRevisionRO).filter(
                ContentRevisionRO.label == 'TEST_CONTENT_1'
            ).count()
        )

        content = self.session.query(Content).filter(
            Content.id == first_content.id
        ).one()
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

        eq_(
            1,
            self.session.query(ContentRevisionRO).filter(
                ContentRevisionRO.label == 'TEST_CONTENT_2'
            ).count()
        )

        content = self.session.query(Content).filter(
            Content.id == second_content.id
        ).one()
        eq_('TEST_CONTENT_2', content.label)
        eq_('TEST_CONTENT_DESCRIPTION_2', content.description)

    def test_create(self, key='1'):
        eq_(
            0,
            self.session.query(ContentRevisionRO).filter(
                ContentRevisionRO.label == 'TEST_CONTENT_%s' % key).count()
        )
        eq_(
            0,
            self.session.query(Workspace).filter(
                Workspace.label == 'TEST_WORKSPACE_%s' % key).count()
        )

        user_admin = self.session.query(User).filter(
            User.email == 'admin@admin.admin'
        ).one()
        workspace = Workspace(label="TEST_WORKSPACE_%s" % key)
        self.session.add(workspace)
        self.session.flush()
        eq_(
            1,
            self.session.query(Workspace).filter(
                Workspace.label == 'TEST_WORKSPACE_%s' % key
            ).count()
        )

        created_content = self._create_content(
            owner=user_admin,
            workspace=workspace,
            type=ContentType.Page,
            label='TEST_CONTENT_%s' % key,
            description='TEST_CONTENT_DESCRIPTION_%s' % key,
            revision_type=ActionDescription.CREATION
        )

        eq_(
            1,
            self.session.query(ContentRevisionRO).filter(
                ContentRevisionRO.label == 'TEST_CONTENT_%s' % key
            ).count()
        )

        content = self.session.query(Content).filter(
            Content.id == created_content.id
        ).one()
        eq_('TEST_CONTENT_%s' % key, content.label)
        eq_('TEST_CONTENT_DESCRIPTION_%s' % key, content.description)

        return created_content

    def _get_user(self):
        email = 'admin@admin.admin'
        user_query = self.session.query(User)
        user_filter = user_query.filter(User.email == email)
        user = user_filter.one()
        return user

    def _create_content(self, *args, **kwargs):
        content = Content(*args, **kwargs)
        self.session.add(content)
        self.session.flush()
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
        assert content.depot_file
        # tests type of initialized depot file
        eq_(type(content.depot_file), UploadedFile)
        # tests content of initialized depot file
        # using depot_file.file of type StoredFile to fetch content back
        eq_(content.depot_file.file.read(), b'test')
