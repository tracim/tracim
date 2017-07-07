"""files on disk

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


def upgrade():
    op.add_column('content_revisions',
                  sa.Column('depot_file',
                            UploadedFileField))


def downgrade():
    op.drop_column('content_revisions', 'depot_file')
