"""add column in content

Revision ID: b9d4eb25ad3a
Revises: 73d2df18ef96
Create Date: 2019-02-11 17:01:55.052984

"""

# revision identifiers, used by Alembic.
revision = 'b9d4eb25ad3a'
down_revision = '73d2df18ef96'

from alembic import op
import sqlalchemy as sa


def upgrade():
    with op.batch_alter_table('content') as batch_op:
            batch_op.add_column(sa.Column('file_extension', sa.Unicode(length=255), server_default='', nullable=True))
            batch_op.add_column(sa.Column('label', sa.Unicode(length=1024), nullable=True))
            batch_op.add_column(sa.Column('parent_id', sa.Integer(), nullable=True))
            batch_op.add_column(sa.Column('workspace_id', sa.Integer(), nullable=True))


def downgrade():
    with op.batch_alter_table('content') as batch_op:
            batch_op.drop_column('workspace_id')
            batch_op.drop_column('parent_id')
            batch_op.drop_column('label')
            batch_op.drop_column('file_extension')
