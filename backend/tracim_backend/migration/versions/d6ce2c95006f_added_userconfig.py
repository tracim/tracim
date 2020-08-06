"""added_userconfig

Revision ID: d6ce2c95006f
Revises: 5d3331933ef3
Create Date: 2020-07-29 19:31:48.953180

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import MetaData

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq__%(table_name)s__%(column_0_name)s",  # Unique constrains
    # for ck contraint.
    # "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)

# revision identifiers, used by Alembic.
revision = "d6ce2c95006f"
down_revision = "5d3331933ef3"


def upgrade():
    user_configs_table = op.create_table(
        "user_configs",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("fields", sa.JSON(), nullable=False, default={}),
        sa.PrimaryKeyConstraint("user_id", name=op.f("pk_userconfig")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.user_id"],
            name=op.f("fk_userconfig_user_id_users"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
    )

    users_table = sa.Table("users", metadata, sa.Column("user_id", sa.Integer()))

    connection = op.get_bind()
    connection.execute(
        user_configs_table.insert().from_select(["user_id"], sa.select([users_table.c.user_id]))
    )


def downgrade():
    op.drop_table("user_configs")
