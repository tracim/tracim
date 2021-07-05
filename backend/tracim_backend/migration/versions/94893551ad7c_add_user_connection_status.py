"""add user connection status

Revision ID: 94893551ad7c
Revises: e733c295afb4
Create Date: 2021-07-05 10:11:44.414713

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "94893551ad7c"
down_revision = "e733c295afb4"


def upgrade():
    with op.batch_alter_table("users") as bop:
        bop.add_column(
            sa.Column(
                "connection_status",
                sa.Enum("ONLINE", "OFFLINE", name="userconnectionstatus"),
                nullable=True,
            )
        )


def downgrade():
    with op.batch_alter_table("users") as bop:
        bop.drop_column("connection_status")
