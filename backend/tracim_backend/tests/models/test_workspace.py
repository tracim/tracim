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
