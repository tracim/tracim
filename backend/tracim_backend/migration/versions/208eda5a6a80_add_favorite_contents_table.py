"""add favorite contents table

Revision ID: 208eda5a6a80
Revises: bf040d1a4922
Create Date: 2021-03-24 16:55:51.130190

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "208eda5a6a80"
down_revision = "bf040d1a4922"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "favorite_contents",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("content_id", sa.Integer(), nullable=False),
        sa.Column("original_label", sa.Unicode(length=1024), nullable=False),
        sa.Column("original_type", sa.Unicode(length=32), nullable=False),
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
