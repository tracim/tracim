"""fix_unicity_of_comment

Revision ID: 73d2df18ef96
Revises: f889c2b59759
Create Date: 2019-02-11 16:36:33.454042

"""
# revision identifiers, used by Alembic.
import transaction
from sqlalchemy.orm import Session
from tracim_backend.models.revision_protection import new_revision

revision = '73d2df18ef96'
down_revision = 'f889c2b59759'

from alembic import op
import sqlalchemy as sa

revisions = sa.Table(
    'content_revisions',
    sa.MetaData(),
    sa.Column('label', sa.Unicode(1024), unique=False, nullable=False),
    sa.Column('revision_id', sa.Integer, primary_key=True),
    sa.Column('type', sa.Unicode(32), unique=False, nullable=False),
    sa.Column('file_extension', sa.Unicode(255), unique=False, nullable=False, server_default=''),  # nopep8
    sa.Column('created', sa.DateTime, unique=False, nullable=False),
    sa.Column('owner_id', sa.Integer, nullable=True),
)

def upgrade():
    connection = op.get_bind()
    connection.execute(
        revisions.update()
        .where(
            revisions.c.type == 'comment'
        ).values(
            label=revisions.c.revision_id,
        )
    )

def downgrade():
    connection = op.get_bind()
    connection.execute(
        revisions.update()
        .where(
            revisions.c.type == 'comment'
        ).values(
            label='',
        )
    )

