"""files on disk

Revision ID: 69fb10c3d6f0
Revises: c1cea4bbae16
Create Date: 2017-06-07 17:25:47.306472

"""

# revision identifiers, used by Alembic.
revision = '69fb10c3d6f0'
down_revision = 'c1cea4bbae16'

from alembic import op
import sqlalchemy as sa
from depot.fields.sqlalchemy import UploadedFileField


def upgrade():
    op.add_column('content_revisions', sa.Column('depot_file_uid', UploadedFileField))


def downgrade():
    op.drop_column('content_revisions', 'depot_file_uid')
