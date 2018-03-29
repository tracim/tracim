"""add hash column for digest authentication

Revision ID: b4b8d57b54e5
Revises: 534c4594ed29
Create Date: 2016-08-11 10:27:28.951506

"""

# revision identifiers, used by Alembic.
revision = 'b4b8d57b54e5'
down_revision = 'bdb195ed95bb'

from alembic import op
from sqlalchemy import Column, Unicode, Boolean


def upgrade():
    op.add_column('users', Column('webdav_left_digest_response_hash', Unicode(128)))
    op.add_column('content_revisions', Column('is_temporary', Boolean(), unique=False, nullable=True))
    op.execute('''
        UPDATE content_revisions
        SET is_temporary = FALSE
        ''')
    op.alter_column('content_revisions', 'is_temporary', nullable=False)

def downgrade():
    op.drop_column('users', 'webdav_left_digest_response_hash')
    op.drop_column('content_revisions', 'is_temporary')