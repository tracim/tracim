from operator import attrgetter

import pytest
import transaction

from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F401


class TestWorkspaceModel(object):
    @pytest.mark.usefixtures("base_fixture")
    def test_unit__workspace_get_size(self, admin_user, session, content_type_list):
        """ Depot file access thought content property methods. """
        workspace = Workspace(label="TEST_WORKSPACE_1", owner=admin_user)
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
        content.depot_file = b"test"
        session.add(content)

        assert workspace.get_size() == 4
        assert workspace.get_size(include_deleted=True) == 4
        assert workspace.get_size(include_archived=True) == 4
        with new_revision(session=session, tm=transaction.manager, content=content):
            content.is_deleted = True
            content.is_archived = False
        session.flush()
        transaction.commit()
        assert workspace.get_size() == 0
        assert workspace.get_size(include_deleted=True) == 8
        assert workspace.get_size(include_archived=True) == 0
        with new_revision(session=session, tm=transaction.manager, content=content):
            content.is_deleted = False
            content.is_archived = True
        session.flush()
        transaction.commit()
        assert workspace.get_size() == 0
        assert workspace.get_size(include_deleted=True) == 0
        assert workspace.get_size(include_archived=True) == 12

    @pytest.mark.usefixtures("base_fixture")
    def test_unit__get_children__nominal_case(self, admin_user, session):
        """
        Test recursive and not recursive method of get_children with a complex workspace family tree
        """
        grandparent = Workspace(label="grandparent", owner=admin_user)
        parent = Workspace(label="parent", owner=admin_user, parent=grandparent)
        child_1 = Workspace(label="child_1", owner=admin_user, parent=parent)
        child_2 = Workspace(label="child_2", owner=admin_user, parent=parent)
        child_3 = Workspace(label="child_3", owner=admin_user, parent=parent)
        grandson_1_1 = Workspace(label="grandson_1_1", owner=admin_user, parent=child_1)
        grandson_3_1 = Workspace(label="grandson_3_1", owner=admin_user, parent=child_3)
        grandson_3_2 = Workspace(label="grandson_3_2", owner=admin_user, parent=child_3)

        session.add(grandparent)
        session.add(parent)
        session.add(child_1)
        session.add(child_2)
        session.add(child_3)
        session.add(grandson_1_1)
        session.add(grandson_3_1)
        session.add(grandson_3_2)
        session.flush()
        transaction.commit()

        assert grandson_1_1.get_children(recursively=False) == []
        assert grandson_1_1.get_children(recursively=True) == []
        assert grandson_3_1.get_children(recursively=False) == []
        assert grandson_3_1.get_children(recursively=True) == []
        assert grandson_3_2.get_children(recursively=False) == []
        assert grandson_3_2.get_children(recursively=True) == []

        rec_child_3_children = child_3_children = [grandson_3_1, grandson_3_2]
        rec_child_2_children = child_2_children = []
        rec_child_1_children = child_1_children = [grandson_1_1]
        assert child_1.get_children(recursively=False) == child_1_children
        assert child_1.get_children(recursively=True) == rec_child_1_children
        assert child_2.get_children(recursively=False) == child_2_children
        assert child_2.get_children(recursively=True) == rec_child_2_children
        assert child_3.get_children(recursively=False) == child_3_children
        assert child_3.get_children(recursively=True) == rec_child_3_children

        parent_children = [child_1, child_2, child_3]
        rec_parent_children = sorted(
            rec_child_1_children + rec_child_2_children + rec_child_3_children + parent_children,
            key=attrgetter("workspace_id"),
        )
        assert parent.get_children(recursively=False) == parent_children
        assert parent.get_children(recursively=True) == rec_parent_children

        rec_grandparent_children = sorted(
            rec_parent_children + [parent], key=attrgetter("workspace_id")
        )
        assert grandparent.get_children(recursively=False) == [parent]
        assert grandparent.get_children(recursively=True) == rec_grandparent_children
