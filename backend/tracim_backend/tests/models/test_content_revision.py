# -*- coding: utf-8 -*-
from collections import OrderedDict

import pytest
from sqlalchemy import inspect

from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.tests.fixtures import *  # noqa F403,F401


@pytest.mark.usefixtures("base_fixture")
class TestContentRevision(object):
    def _new_from(self, revision):
        excluded_columns = (
            "revision_id",
            "_sa_instance_state",
            "depot_file",
            "node",
            "revision_read_statuses",
        )
        revision_columns = [
            attr.key for attr in inspect(revision).attrs if attr.key not in excluded_columns
        ]
        new_revision = ContentRevisionRO()

        for revision_column in revision_columns:
            old_revision_column_value = getattr(revision, revision_column)
            setattr(new_revision, revision_column, old_revision_column_value)

        return new_revision

    def _get_dict_representation(self, revision):
        keys_to_remove = ("updated", "_sa_instance_state")
        dict_repr = OrderedDict(sorted(revision.__dict__.items()))
        for key_to_remove in keys_to_remove:
            dict_repr.pop(key_to_remove, None)
        return dict_repr

    def test_new_revision(
        self, session, admin_user, workspace_api_factory, content_api_factory, content_type_list
    ):
        workspace = workspace_api_factory.get().create_workspace(label="workspace_1")
        folder = content_api_factory.get().create(
            content_type_slug="folder", workspace=workspace, label="folder_1", do_save=True
        )
        html_document = content_api_factory.get().create(
            content_type_slug="html-document", workspace=workspace, label="file_1", parent=folder
        )

        session.flush()

        # Model create a new instance with list of column
        new_revision_by_model = ContentRevisionRO.new_from(html_document.revision)
        # Test create a new instance from dynamic listing of model
        # columns mapping
        new_revision_by_test = self._new_from(html_document.revision)

        new_revision_by_model_dict = self._get_dict_representation(new_revision_by_model)
        new_revision_by_test_dict = self._get_dict_representation(new_revision_by_test)

        # They must be identical
        assert new_revision_by_model_dict == new_revision_by_test_dict
