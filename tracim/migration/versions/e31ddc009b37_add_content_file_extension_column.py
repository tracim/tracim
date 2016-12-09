"""add_content_file_extension_column

Revision ID: e31ddc009b37
Revises: 2cd20ff3d23a
Create Date: 2016-11-25 10:43:23.700867

"""

# revision identifiers, used by Alembic.
revision = 'e31ddc009b37'
down_revision = '2cd20ff3d23a'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column(
        'content_revisions',
        sa.Column(
            'file_extension',
            sa.Unicode(length=255),
            server_default='',
            nullable=False,
        )
    )


def downgrade():
    op.drop_column(
        'content_revisions',
        'file_extension',
    )
