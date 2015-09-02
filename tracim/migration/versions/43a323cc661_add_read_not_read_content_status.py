"""add read/not read content status

Revision ID: 43a323cc661
Revises: None
Create Date: 2015-08-26 11:23:03.466554

"""

# revision identifiers, used by Alembic.
revision = '43a323cc661'
down_revision = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'revision_read_status',
        sa.Column('revision_id', sa.Integer, sa.ForeignKey('content_revisions.revision_id', ondelete='CASCADE', onupdate='CASCADE'), primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id', ondelete='CASCADE', onupdate='CASCADE'), primary_key=True),
        sa.Column('view_datetime', sa.DateTime, server_default=sa.func.now(), unique=False, nullable=False)
    )


def downgrade():
    op.drop_table('revision_read_status')

