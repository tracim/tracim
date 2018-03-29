"""files on disk.

Revision ID: 69fb10c3d6f0
Revises: c1cea4bbae16
Create Date: 2017-06-07 17:25:47.306472

"""

from alembic import op
from depot.fields.sqlalchemy import UploadedFileField
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '69fb10c3d6f0'
down_revision = 'c1cea4bbae16'


# INFO - A.P - 2017-07-20 - alembic batch migrations
# http://alembic.zzzcomputing.com/en/latest/batch.html
# This migration uses alembic batch mode, a workaround allowing to enforce
# ALTER statement with SQLite while maintaining the traditional behavior of
# the commented lines on other RDBMS.


def upgrade():
    """Adds the depot file in revision."""
    # op.add_column('content_revisions',
    #               sa.Column('depot_file',
    #                         UploadedFileField))
    with op.batch_alter_table('content_revisions') as batch_op:
        batch_op.add_column(sa.Column('depot_file', UploadedFileField))


def downgrade():
    """Drops the depot file in revision."""
    # op.drop_column('content_revisions', 'depot_file')
    with op.batch_alter_table('content_revisions') as batch_op:
        batch_op.drop_column('depot_file')
