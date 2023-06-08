"""fix call sequence naming

Revision ID: 4677d955d247
Revises: f44c6e2a7700
Create Date: 2021-10-01 10:22:23.968416

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "4677d955d247"
down_revision = "f44c6e2a7700"


def upgrade():
    if op.get_context().dialect.name == "postgresql":
        op.execute("ALTER SEQUENCE IF EXISTS user_calls_call_id_seq RENAME TO seq__usercall__id;")


def downgrade():
    if op.get_context().dialect.name == "postgresql":
        op.execute("ALTER SEQUENCE IF EXISTS seq__usercall__id RENAME TO user_calls_call_id_seq;")
