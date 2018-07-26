# -*- coding: utf-8 -*-
from collections import OrderedDict

from sqlalchemy import inspect

from tracim.models import ContentRevisionRO
from tracim.models import User
from tracim.models.data import ContentType
from tracim.tests import DefaultTest
from tracim.tests import eq_

class TestContentRevision(DefaultTest):

    def _new_from(self, revision):
        excluded_columns = (
            'revision_id',
            '_sa_instance_state',
            'depot_file',
            'node',
            'revision_read_statuses',
        )
        revision_columns = [attr.key for attr in inspect(revision).attrs
                            if attr.key not in excluded_columns]
        new_revision = ContentRevisionRO()

        for revision_column in revision_columns:
            old_revision_column_value = getattr(revision, revision_column)
            setattr(new_revision, revision_column, old_revision_column_value)

        return new_revision

    def _get_dict_representation(self, revision):
        keys_to_remove = ('updated', '_sa_instance_state')
        dict_repr = OrderedDict(sorted(revision.__dict__.items()))
        for key_to_remove in keys_to_remove:
            dict_repr.pop(key_to_remove, None)
        return dict_repr

    def test_new_revision(self):
        admin = self.session.query(User).filter(
            User.email == 'admin@admin.admin'
        ).one()
        workspace = self._create_workspace_and_test(
            name='workspace_1',
            user=admin
        )
        folder = self._create_content_and_test(
            name='folder_1',
            workspace=workspace,
            type=ContentType.Folder
        )
        page = self._create_content_and_test(
            workspace=workspace,
            parent=folder,
            name='file_1',
            description='content of file_1',
            type=ContentType.Page,
            owner=admin
        )

        self.session.flush()

        # Model create a new instance with list of column
        new_revision_by_model = ContentRevisionRO.new_from(page.revision)
        # Test create a new instance from dynamic listing of model
        # columns mapping
        new_revision_by_test = self._new_from(page.revision)

        new_revision_by_model_dict = self._get_dict_representation(
            new_revision_by_model
        )
        new_revision_by_test_dict = self._get_dict_representation(
            new_revision_by_test
        )

        # They must be identical
        eq_(new_revision_by_model_dict, new_revision_by_test_dict)
