"""add content to new column

Revision ID: 6152079836c7
Revises: b9d4eb25ad3a
Create Date: 2019-02-11 17:07:30.164887

"""

# revision identifiers, used by Alembic.
from sqlalchemy import select, update

revision = '6152079836c7'
down_revision = 'b9d4eb25ad3a'

from sqlalchemy import text
from alembic import op
import sqlalchemy as sa

revisions = sa.Table(
    'content_revisions',
    sa.MetaData(),
    sa.Column('label', sa.Unicode(1024), unique=False, nullable=False),
    sa.Column('revision_id', sa.Integer, primary_key=True),
    sa.Column('content_id', sa.Integer, primary_key=True),
    sa.Column('type', sa.Unicode(32), unique=False, nullable=False),
    sa.Column('file_extension', sa.Unicode(255), unique=False, nullable=False, server_default=''),  # nopep8
    sa.Column('created', sa.DateTime, unique=False, nullable=False),
    sa.Column('owner_id', sa.Integer, nullable=True),
    sa.Column('workspace_id', sa.Integer, primary_key=True),
    sa.Column('parent_id', sa.Integer, primary_key=True),
)

contents = sa.Table(
    'content',
    sa.MetaData(),
    sa.Column('id', sa.Integer, nullable=True),
    sa.Column('label', sa.Unicode(1024), unique=False, nullable=False),
    sa.Column('revision_id', sa.Integer, primary_key=True),
    sa.Column('file_extension', sa.Unicode(255), unique=False, nullable=False, server_default=''),  # nopep8
    sa.Column('workspace_id', sa.Integer, primary_key=True),
    sa.Column('parent_id', sa.Integer, primary_key=True),
)


def upgrade():
    connection = op.get_bind()
    contents_ids_result = connection.execute(select([contents.c.id]))
    contents_ids = [item[0] for item in contents_ids_result]
    for content_id in contents_ids:
        last_revision_result = connection.execute(select([revisions.c.label, revisions.c.file_extension, revisions.c.workspace_id, revisions.c.parent_id]).where(revisions.c.content_id == content_id).order_by(revisions.c.revision_id.desc()).limit(1))
        last_revision = list(last_revision_result)[0]
        connection.execute(
            contents.update().where(
                contents.c.id == content_id
            ).values(
                label=last_revision[0],
                file_extension=last_revision[1],
                workspace_id=last_revision[2],
                parent_id=last_revision[3]
            )
        )

def downgrade():
    connection = op.get_bind()
    connection.execute(
        contents.update().values(
            label=None,
            file_extension=None,
            workspace_id=None,
            parent_id=None
        )
    )