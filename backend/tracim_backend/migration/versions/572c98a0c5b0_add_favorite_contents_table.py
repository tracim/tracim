"""add favorite contents table

Revision ID: 572c98a0c5b0
Revises: bf040d1a4922
Create Date: 2021-03-22 11:11:05.196195

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "572c98a0c5b0"
down_revision = "bf040d1a4922"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "favorite_contents",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("content_id", sa.Integer(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["content.id"],
            name=op.f("fk_favorite_contents_content_id_content"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.user_id"], name=op.f("fk_favorite_contents_user_id_users")
        ),
        sa.PrimaryKeyConstraint("user_id", "content_id", name=op.f("pk_favorite_contents")),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("favorite_contents")
    # ### end Alembic commands ###
