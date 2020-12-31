"""create user_followers table

Revision ID: 58ae85582ba0
Revises: 6653b1b4bb7b
Create Date: 2020-12-28 14:36:06.192174

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "58ae85582ba0"
down_revision = "6653b1b4bb7b"


def upgrade():
    op.create_table(
        "user_followers",
        sa.Column("follower_id", sa.Integer(), nullable=False),
        sa.Column("leader_id", sa.Integer(), nullable=False),
        sa.Column("created_date", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ("follower_id",), ["users.user_id"], name=op.f("fk_user_followers_follower_id_users")
        ),
        sa.ForeignKeyConstraint(
            ("leader_id",), ["users.user_id"], name=op.f("fk_user_followers_leader_id_users")
        ),
        sa.PrimaryKeyConstraint("follower_id", "leader_id", name=op.f("pk_user_followers")),
    )


def downgrade():
    op.drop_table("user_followers")
