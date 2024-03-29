"""add workspace_subscription table

Revision ID: 69ab7c047577
Revises: d67be8359ca7
Create Date: 2020-09-29 14:32:00.155585

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "69ab7c047577"
down_revision = "d67be8359ca7"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    enum = sa.Enum("PENDING", "ACCEPTED", "REJECTED", name="workspacesubscriptionstate")
    op.create_table(
        "workspace_subscriptions",
        sa.Column(
            "state",
            enum,
            server_default="PENDING",
            nullable=False,
        ),
        sa.Column("created_date", sa.DateTime(), nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("evaluation_date", sa.DateTime(), nullable=True),
        sa.Column("evaluator_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.user_id"],
            name=op.f("fk_workspace_subscriptions_author_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["evaluator_id"],
            ["users.user_id"],
            name=op.f("fk_workspace_subscriptions_evaluator_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.workspace_id"],
            name=op.f("fk_workspace_subscriptions_workspace_id_workspaces"),
        ),
        sa.PrimaryKeyConstraint(
            "workspace_id", "author_id", name=op.f("pk_workspace_subscriptions")
        ),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("workspace_subscriptions")
    sa.Enum(name="workspacesubscriptionstate").drop(op.get_bind(), checkfirst=False)
    # ### end Alembic commands ###
