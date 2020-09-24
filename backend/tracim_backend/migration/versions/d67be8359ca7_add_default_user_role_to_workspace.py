"""add default user role to workspace

Revision ID: d67be8359ca7
Revises: 37dfaf107e08
Create Date: 2020-09-18 13:38:08.007748

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "d67be8359ca7"
down_revision = "37dfaf107e08"


def upgrade():
    enum = sa.Enum(
        "NOT_APPLICABLE",
        "READER",
        "CONTRIBUTOR",
        "CONTENT_MANAGER",
        "WORKSPACE_MANAGER",
        name="workspaceroles",
    )
    enum.create(op.get_bind(), checkfirst=False)
    with op.batch_alter_table("workspaces") as batch_op:
        batch_op.add_column(
            sa.Column("default_user_role", enum, server_default="READER", nullable=False)
        )


def downgrade():
    with op.batch_alter_table("workspaces") as batch_op:
        batch_op.drop_column("default_user_role")
    sa.Enum(name="workspaceroles").drop(op.get_bind(), checkfirst=False)
