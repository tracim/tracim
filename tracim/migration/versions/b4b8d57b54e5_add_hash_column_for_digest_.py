"""add hash column for digest authentication

Revision ID: b4b8d57b54e5
Revises: 534c4594ed29
Create Date: 2016-08-11 10:27:28.951506

"""

# revision identifiers, used by Alembic.
revision = 'b4b8d57b54e5'
down_revision = '534c4594ed29'

from alembic import op
from sqlalchemy import Column, Unicode


def upgrade():
    op.add_column('users', Column('webdav_left_digest_response_hash', Unicode(128)))


def downgrade():
    op.drop_column('users', 'webdav_left_digest_response_hash')
