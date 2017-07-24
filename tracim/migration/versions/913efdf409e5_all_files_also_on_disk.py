"""all files also on disk.

Revision ID: 913efdf409e5
Revises: 69fb10c3d6f0
Create Date: 2017-07-12 15:44:20.568447

"""

import shutil

from alembic import op
from depot.fields.sqlalchemy import UploadedFileField
from depot.fields.upload import UploadedFile
from depot.io.utils import FileIntent
from depot.manager import DepotManager
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '913efdf409e5'
down_revision = '69fb10c3d6f0'


revision_helper = sa.Table(
    'content_revisions',
    sa.MetaData(),
    sa.Column('revision_id', sa.Integer, primary_key=True),
    sa.Column('label', sa.String(1024), nullable=False),
    sa.Column('file_extension', sa.String(255), nullable=False),
    sa.Column('file_mimetype', sa.String(255), nullable=False),
    sa.Column('file_content', sa.LargeBinary),
    sa.Column('depot_file', UploadedFileField, nullable=True),
    sa.Column('type', sa.String(32), nullable=False),
)


def delete_files_on_disk(connection: sa.engine.Connection):
    """Deletes files from disk and their references in database."""
    delete_query = revision_helper.update() \
        .where(revision_helper.c.type == 'file') \
        .where(revision_helper.c.depot_file.isnot(None)) \
        .values(depot_file=None)
    connection.execute(delete_query)
    shutil.rmtree('depot/', ignore_errors=True)


def upgrade():
    """
    Sets all depot files for file typed revisions.

    Until now, files are both in database and, for the newly created
    ones, on disk. In order to simplify the migration, this procedure
    will:
    - delete the few files on disk,
    - create all files on disk from database.
    """
    # Creates files depot used in this migration
    DepotManager.configure(
        'tracim', {'depot.storage_path': 'depot/'},
    )
    connection = op.get_bind()
    delete_files_on_disk(connection=connection)
    select_query = revision_helper.select() \
        .where(revision_helper.c.type == 'file') \
        .where(revision_helper.c.depot_file.is_(None))
    all_files = connection.execute(select_query).fetchall()
    for one_file in all_files:
        one_file_filename = '{0}{1}'.format(
            one_file.label,
            one_file.file_extension,
        )
        depot_file_intent = FileIntent(
            one_file.file_content,
            one_file_filename,
            one_file.file_mimetype,
        )
        depot_file_field = UploadedFile(depot_file_intent, 'tracim')
        update_query = revision_helper.update() \
            .where(revision_helper.c.revision_id == one_file.revision_id) \
            .values(depot_file=depot_file_field) \
            .return_defaults()
        connection.execute(update_query)


def downgrade():
    """Resets depot file for file typed revisions."""
    connection = op.get_bind()
    delete_files_on_disk(connection=connection)
