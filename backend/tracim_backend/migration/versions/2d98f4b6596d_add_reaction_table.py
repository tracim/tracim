"""add reaction table

Revision ID: 2d98f4b6596d
Revises: ae30497b6168
Create Date: 2021-03-10 12:03:05.198986

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "2d98f4b6596d"
down_revision = "ae30497b6168"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "reaction",
        sa.Column("reaction_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("content_id", sa.Integer(), nullable=False),
        sa.Column("value", sa.Unicode(length=255), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["author_id"], ["users.user_id"], name=op.f("fk_reaction_author_id_users")
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["content.id"],
            name=op.f("fk_reaction_content_id_content"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("reaction_id", name=op.f("pk_reaction")),
        sa.UniqueConstraint(
            "author_id", "content_id", "value", name=op.f("uq__reaction__author_id")
        ),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("reaction")
    # ### end Alembic commands ###
