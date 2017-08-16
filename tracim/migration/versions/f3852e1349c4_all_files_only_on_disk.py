"""all files only on disk

Revision ID: f3852e1349c4
Revises: 913efdf409e5
Create Date: 2017-07-24 17:15:54.278141

"""

from alembic import context
from alembic import op
from depot.fields.sqlalchemy import UploadedFileField
from depot.manager import DepotManager
import sqlalchemy as sa
from sqlalchemy.sql.expression import func

# revision identifiers, used by Alembic.
revision = 'f3852e1349c4'
down_revision = '913efdf409e5'


def configure_depot():
    """Configure Depot."""
    depot_storage_name = context.config.get_main_option('depot_storage_name')
    depot_storage_path = context.config.get_main_option('depot_storage_dir')
    depot_storage_settings = {'depot.storage_path': depot_storage_path}
    DepotManager.configure(
        depot_storage_name,
        depot_storage_settings,
    )


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


def upgrade():
    """Drops the file content from revision."""
    with op.batch_alter_table('content_revisions') as batch_op:
        batch_op.drop_column('file_content')


def downgrade():
    """Adds the file content in revision."""
    with op.batch_alter_table('content_revisions') as batch_op:
        batch_op.add_column(sa.Column('file_content', sa.LargeBinary))

    configure_depot()
    depot = DepotManager.get()
    connection = op.get_bind()
    select_query = revision_helper.select() \
        .where(revision_helper.c.type == 'file') \
        .where(revision_helper.c.depot_file.isnot(None)) \
        .where(func.length(revision_helper.c.depot_file) > 0)
    files = connection.execute(select_query).fetchall()
    for file in files:
        depot_file_content = depot.get(file.depot_file)
        update_query = revision_helper.update() \
            .where(revision_helper.c.revision_id == file.revision_id) \
            .values(file_content=depot_file_content)
        connection.execute(update_query)
