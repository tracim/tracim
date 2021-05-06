"""add creation_author and creation type

Revision ID: eb9b7e534b54
Revises: 35cfa7c2f8f9
Create Date: 2021-05-06 14:55:48.369529

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "eb9b7e534b54"
down_revision = "35cfa7c2f8f9"


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("creation_author_id", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "creation_type",
                sa.Enum("ADMIN", "INVITATION", "REGISTER", "CLI", name="usercreationtype"),
                nullable=True,
            )
        )
        batch_op.create_foreign_key(
            batch_op.f("fk_users_creation_author_id_users"),
            referent_table="users",
            local_cols=["creation_author_id"],
            remote_cols=["user_id"],
            ondelete="SET NULL",
        )


def downgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint(op.f("fk_users_creation_author_id_users"), type_="foreignkey")
        batch_op.drop_column("creation_type")
        batch_op.drop_column("creation_author_id")
