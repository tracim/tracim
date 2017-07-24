"""all files only on disk

Revision ID: f3852e1349c4
Revises: 913efdf409e5
Create Date: 2017-07-24 17:15:54.278141

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f3852e1349c4'
down_revision = '913efdf409e5'


def upgrade():
    """Drops the file content from revision."""
    with op.batch_alter_table('content_revisions') as batch_op:
        batch_op.drop_column('file_content')


def downgrade():
    """Adds the file content in revision."""
    with op.batch_alter_table('content_revisions') as batch_op:
        batch_op.add_column(sa.Column('file_content', sa.LargeBinary))
