# -*- coding: utf-8 -*-
from datetime import datetime

from depot.fields.upload import UploadedFile
from freezegun import freeze_time
import pytest
from sqlalchemy.sql.elements import and_
import transaction

from tracim_backend.exceptions import ContentRevisionUpdateError
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa:F401,F403


@pytest.mark.usefixtures("base_fixture")
class TestContent(object):
    def test_unit__create_content__ok__nominal_case(self, admin_user, session, content_type_list):
        assert session.query(Workspace).filter(Workspace.label == "TEST_WORKSPACE_1").count() == 0
        workspace = Workspace(label="TEST_WORKSPACE_1")
        session.add(workspace)
        session.flush()
        assert session.query(Workspace).filter(Workspace.label == "TEST_WORKSPACE_1").count() == 1
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.label == "TEST_CONTENT_1")
            .count()
            == 0
        )
        content = Content(
            owner=admin_user,
            workspace=workspace,
            type=content_type_list.Page.slug,
            label="TEST_CONTENT_1",
            description="TEST_CONTENT_DESCRIPTION_1",
            revision_type=ActionDescription.CREATION,
            is_deleted=False,
            is_archived=False,
        )
        session.add(content)
        session.flush()
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.label == "TEST_CONTENT_1")
            .count()
            == 1
        )
        searched_content = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.label == "TEST_CONTENT_1")
            .one()
        )
        assert searched_content.label == content.label

    def test_unit__update__ok__nominal_case(self, admin_user, session, content_type_list):
        workspace = Workspace(label="TEST_WORKSPACE_1")
        session.add(workspace)
        session.flush()
        with freeze_time("1999-12-31 23:59:59"):
            content = Content(
                owner=admin_user,
                workspace=workspace,
                type=content_type_list.Page.slug,
                label="TEST_CONTENT_1",
                description="TEST_CONTENT_DESCRIPTION_1",
                revision_type=ActionDescription.CREATION,
                is_deleted=False,
                is_archived=False,
            )
            # TODO - G.M - 2019-07-05 - for unknown reason freeze-time doesn't work implicitly at
            # content creation, we do override date here to have correct behaviour.
            content.updated = content.created = datetime.utcnow()
            session.add(content)
            session.flush()
            transaction.commit()
        searched_content = session.query(Content).filter(Content.id == content.id).one()
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.label == "TEST_CONTENT_1")
            .count()
            == 1
        )
        assert session.query(Content).filter(Content.id == searched_content.id).count() == 1
        with freeze_time("2000-01-01 00:00:05"):
            with new_revision(session=session, tm=transaction.manager, content=content):
                content.description = "TEST_CONTENT_DESCRIPTION_1_UPDATED"
            session.flush()
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.label == "TEST_CONTENT_1")
            .count()
            == 2
        )
        assert session.query(Content).filter(Content.id == searched_content.id).count() == 1
        with freeze_time("2003-12-31 23:59:59"):
            with new_revision(session=session, tm=transaction.manager, content=content):
                content.description = "TEST_CONTENT_DESCRIPTION_1_UPDATED_2"
            session.flush()
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.label == "TEST_CONTENT_1")
            .count()
            == 3
        )
        assert session.query(Content).filter(Content.id == searched_content.id).count() == 1

        revision_1 = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.description == "TEST_CONTENT_DESCRIPTION_1")
            .one()
        )
        revision_2 = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.description == "TEST_CONTENT_DESCRIPTION_1_UPDATED")
            .one()
        )
        revision_3 = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.description == "TEST_CONTENT_DESCRIPTION_1_UPDATED_2")
            .one()
        )

        # Updated dates must be different
        assert revision_1.updated < revision_2.updated < revision_3.updated
        # Created dates must be equal
        assert revision_1.created == revision_2.created == revision_3.created

    def test_unit__update__err__without_prepare(self, admin_user, session, content_type_list):
        # file creation
        workspace = Workspace(label="TEST_WORKSPACE_1")
        session.add(workspace)
        session.flush()
        content = Content(
            owner=admin_user,
            workspace=workspace,
            type=content_type_list.Page.slug,
            label="TEST_CONTENT_1",
            description="TEST_CONTENT_DESCRIPTION_1",
            revision_type=ActionDescription.CREATION,
            is_deleted=False,
            is_archived=False,
        )
        session.add(content)
        session.flush()

        # file update
        with pytest.raises(ContentRevisionUpdateError):
            content.description = "FOO"
        # Raise ContentRevisionUpdateError because revision can't be updated

    def test_unit__content_depot_file__ok__nominal_case(
        self, admin_user, session, content_type_list
    ):
        """ Depot file access thought content property methods. """
        workspace = Workspace(label="TEST_WORKSPACE_1")
        session.add(workspace)
        session.flush()
        content = Content(
            owner=admin_user,
            workspace=workspace,
            type=content_type_list.Page.slug,
            label="TEST_CONTENT_1",
            description="TEST_CONTENT_DESCRIPTION_1",
            revision_type=ActionDescription.CREATION,
            is_deleted=False,
            is_archived=False,
        )
        session.add(content)
        session.flush()

        # tests uninitialized depot file
        assert content.depot_file is None
        # initializes depot file
        # which is able to behave like a python file object
        content.depot_file = b"test"
        # tests initialized depot file
        assert content.depot_file
        # tests type of initialized depot file
        assert type(content.depot_file) == UploadedFile
        # tests content of initialized depot file
        # using depot_file.file of type StoredFile to fetch content back
        assert content.depot_file.file.read() == b"test"

    def test_unit__get_children__ok__nominal_case(sel, admin_user, session, content_type_list):
        workspace = Workspace(label="TEST_WORKSPACE_1")
        session.add(workspace)
        session.flush()
        parent_folder = Content(
            owner=admin_user,
            workspace=workspace,
            type=content_type_list.Folder.slug,
            label="TEST_CONTENT_1",
            description="TEST_CONTENT_DESCRIPTION_1",
            revision_type=ActionDescription.CREATION,
            is_deleted=False,
            is_archived=False,
        )
        session.add(parent_folder)
        session.flush()
        assert parent_folder.children == []
        children_folder = Content(
            owner=admin_user,
            workspace=workspace,
            type=content_type_list.Folder.slug,
            label="TEST_CONTENT_1",
            description="TEST_CONTENT_DESCRIPTION_1",
            revision_type=ActionDescription.CREATION,
            parent=parent_folder,
        )
        session.add(children_folder)
        session.flush()
        assert [type(child) == Content for child in parent_folder.children]
        assert [child.revision_id for child in parent_folder.children] == [
            children_folder.revision_id
        ]

        with new_revision(session=session, tm=transaction.manager, content=children_folder):
            children_folder.parent = None
        session.flush()
        assert parent_folder.children == []

    def test_unit__query_content__ok__nominal_case(self, admin_user, session, content_type_list):
        workspace = Workspace(label="TEST_WORKSPACE_1")
        session.add(workspace)
        session.flush()
        workspace2 = Workspace(label="TEST_WORKSPACE_2")
        session.add(workspace2)
        session.flush()
        content1 = Content(
            owner=admin_user,
            workspace=workspace,
            type=content_type_list.Page.slug,
            label="TEST_CONTENT_1",
            description="TEST_CONTENT_DESCRIPTION_1",
            revision_type=ActionDescription.CREATION,
            is_deleted=False,
            is_archived=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=content1):
            content1.description = "TEST_CONTENT_DESCRIPTION_1_UPDATED"
            session.add(content1)
        session.flush()
        content2 = Content(
            owner=admin_user,
            workspace=workspace2,
            type=content_type_list.Page.slug,
            label="TEST_CONTENT_2",
            description="TEST_CONTENT_DESCRIPTION_2",
            revision_type=ActionDescription.CREATION,
            is_deleted=False,
            is_archived=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=content2):
            content2.description = "TEST_CONTENT_DESCRIPTION_2_UPDATED"
            session.add(content2)
            session.flush()

        workspace1 = session.query(Workspace).filter(Workspace.label == "TEST_WORKSPACE_1").one()
        workspace2 = session.query(Workspace).filter(Workspace.label == "TEST_WORKSPACE_2").one()

        # To get Content in database
        # we have to join Content and ContentRevisionRO
        # with particular condition:
        # Join have to be on most recent revision
        join_sub_query = (
            session.query(ContentRevisionRO.revision_id)
            .filter(ContentRevisionRO.content_id == Content.id)
            .order_by(ContentRevisionRO.revision_id.desc())
            .limit(1)
            .correlate(Content)
        )

        base_query = session.query(Content).join(
            ContentRevisionRO,
            and_(
                Content.id == ContentRevisionRO.content_id,
                ContentRevisionRO.revision_id == join_sub_query,
            ),
        )

        pattern = "TEST_CONTENT_DESCRIPTION_%_UPDATED"
        assert base_query.filter(Content.description.like(pattern)).count() == 2

        assert base_query.filter(Content.workspace == workspace1).count() == 1
        assert base_query.filter(Content.workspace == workspace2).count() == 1

        content1_from_query = base_query.filter(Content.workspace == workspace1).one()
        assert content1.id == content1_from_query.id
        assert "TEST_CONTENT_DESCRIPTION_1_UPDATED" == content1_from_query.description

    def test_unit__get_allowed_content_type__ok(
        self, admin_user, session, content_type_list
    ) -> None:
        workspace = Workspace(label="TEST_WORKSPACE")
        session.add(workspace)
        session.flush()
        content1 = Content(
            owner=admin_user,
            workspace=workspace,
            type=content_type_list.Page.slug,
            label="TEST_CONTENT_1",
            description="TEST_CONTENT_DESCRIPTION_1",
            revision_type=ActionDescription.CREATION,
            is_deleted=False,
            is_archived=False,
        )
        content1.properties = {"allowed_content": {"unknown_type": True}}
        try:
            assert content1.get_allowed_content_types() == []
        except ValueError:
            pytest.fail(
                "Unknown content type should not raise exception anymore "
                "when getting allowed content_type"
            )
