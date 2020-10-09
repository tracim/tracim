"""add workspace access type to workspace

Revision ID: 37dfaf107e08
Revises: 41449c86b94b
Create Date: 2020-09-15 10:36:52.407385

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "37dfaf107e08"
down_revision = "41449c86b94b"


def upgrade():
    enum = sa.Enum("CONFIDENTIAL", "ON_REQUEST", "OPEN", name="workspaceaccesstype")
    enum.create(op.get_bind(), checkfirst=False)
    with op.batch_alter_table("workspaces") as batch_op:
        batch_op.add_column(
            sa.Column("access_type", enum, server_default="CONFIDENTIAL", nullable=False)
        )


def downgrade():
    with op.batch_alter_table("workspaces") as batch_op:
        batch_op.drop_column("access_type")
    sa.Enum(name="workspaceaccesstype").drop(op.get_bind(), checkfirst=False)
