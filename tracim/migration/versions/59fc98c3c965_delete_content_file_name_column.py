"""delete content file name column

Revision ID: 59fc98c3c965
Revises: 15305f71bfda
Create Date: 2016-11-25 14:55:22.176175

"""

# revision identifiers, used by Alembic.
revision = '59fc98c3c965'
down_revision = '15305f71bfda'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.drop_column('content_revisions', 'file_name')


def downgrade():
    op.add_column(
        'content_revisions',
        sa.Column(
            'file_name',
            sa.VARCHAR(length=255),
            server_default=sa.text("''::character varying"),
            autoincrement=False,
            nullable=False
        ),
    )
