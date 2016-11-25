"""fill content file_extension column

Revision ID: 15305f71bfda
Revises: e31ddc009b37
Create Date: 2016-11-25 10:50:01.874820

"""

# revision identifiers, used by Alembic.
import os

revision = '15305f71bfda'
down_revision = 'e31ddc009b37'

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
    sa.Column('file_name', sa.String(255), nullable=False),
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
        # On work with FILE
        if content_revision.type == 'file':
            file_name, file_extension = \
                os.path.splitext(content_revision.file_name)

            # Don't touch label if already set
            if content_revision.label:
                new_label = content_revision.label
            # Label will be file name without extension
            else:
                new_label = file_name

            # Update record
            connection.execute(
                content_revision_helper.update()
                .where(
                    content_revision_helper.c.revision_id ==
                    content_revision.revision_id
                ).values(
                    label=new_label,
                    file_extension=file_extension,
                )
            )


def downgrade():
    pass
