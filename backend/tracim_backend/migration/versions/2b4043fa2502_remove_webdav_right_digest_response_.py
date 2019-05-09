"""remove webdav_right_digest_response_hash from database

Revision ID: 2b4043fa2502
Revises: f3852e1349c4
Create Date: 2018-03-13 14:41:38.590375

"""
from alembic import op
from sqlalchemy import Column
from sqlalchemy import Unicode

# revision identifiers, used by Alembic.
revision = "2b4043fa2502"
down_revision = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("webdav_left_digest_response_hash")


def downgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(Column("webdav_left_digest_response_hash", Unicode(128)))
