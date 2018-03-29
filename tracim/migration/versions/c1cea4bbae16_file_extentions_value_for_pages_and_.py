"""file_extentions value for Pages and Threads

Revision ID: c1cea4bbae16
Revises: 59fc98c3c965
Create Date: 2016-11-30 10:41:51.893531

"""

# revision identifiers, used by Alembic.

revision = 'c1cea4bbae16'
down_revision = '59fc98c3c965'

from alembic import op
import sqlalchemy as sa

content_revision_helper = sa.Table(
    'content_revisions',
    sa.MetaData(),
    sa.Column('revision_id', sa.Integer, primary_key=True),
    sa.Column('content_id', sa.ForeignKey(u'content.id'), nullable=False),
    sa.Column('owner_id', sa.ForeignKey(u'users.user_id'), index=True),
    sa.Column('label', sa.String(1024), nullable=False),
    sa.Column('description', sa.Text, nullable=False),
    sa.Column('file_extension', sa.String(255), nullable=False),
    sa.Column('file_mimetype', sa.String(255), nullable=False),
    sa.Column('file_content', sa.LargeBinary),
    sa.Column('properties', sa.Text, nullable=False),
    sa.Column('type', sa.String(32), nullable=False),
    sa.Column('status', sa.String(32), nullable=False),
    sa.Column('created', sa.DateTime, nullable=False),
    sa.Column('updated', sa.DateTime, nullable=False),
    sa.Column('is_deleted', sa.Boolean, nullable=False),
    sa.Column('is_archived', sa.Boolean, nullable=False),
    sa.Column('is_temporary', sa.Boolean, nullable=False),
    sa.Column('revision_type', sa.String(32), nullable=False),
    sa.Column('workspace_id', sa.ForeignKey(u'workspaces.workspace_id')),
    sa.Column('parent_id', sa.ForeignKey(u'content.id'), index=True),
)


def upgrade():
    connection = op.get_bind()

    for content_revision in connection.execute(
            content_revision_helper.select()
    ):
        if content_revision.type in ('page', 'thread'):
            # Update record
            connection.execute(
                content_revision_helper.update()
                    .where(
                        content_revision_helper.c.revision_id ==
                        content_revision.revision_id
                    ).values(
                        file_extension='.html',
                    )
                )


def downgrade():
    connection = op.get_bind()

    for content_revision in connection.execute(
            content_revision_helper.select()
    ):
        # On work with FILE
        if content_revision.type in ('page', 'thread'):
            # Update record
            connection.execute(
                content_revision_helper.update()
                    .where(
                        content_revision_helper.c.revision_id ==
                        content_revision.revision_id
                    ).values(
                        file_extension='',
                    )
                )
