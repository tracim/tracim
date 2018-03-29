"""Add User field for imported profiles

Revision ID: b73e57760b36
Revises: 43a323cc661
Create Date: 2016-02-09 11:00:22.694054

"""

# revision identifiers, used by Alembic.
revision = 'b73e57760b36'
down_revision = '43a323cc661'

import sqlalchemy as sa
from alembic import op


def upgrade():
    op.add_column('users', sa.Column('imported_from', sa.Unicode(length=32), nullable=True))


def downgrade():
    op.drop_column('users', 'imported_from')
