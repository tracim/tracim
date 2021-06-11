"""add tag table

Revision ID: 0d0c9758426f
Revises: eb9b7e534b54
Create Date: 2021-06-11 09:48:53.035351

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0d0c9758426f"
down_revision = "eb9b7e534b54"


def upgrade():
    if op.get_context().dialect.name == "postgresql":
        op.execute("CREATE SEQUENCE seq__tag__tag_id ;")

    op.create_table(
        "tag",
        sa.Column(
            "tag_id",
            sa.Integer(),
            sa.Sequence("seq__tag__tag_id"),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("tag_name", sa.Unicode(length=255), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["author_id"], ["users.user_id"], name=op.f("fk_tag_author_id_users")
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.workspace_id"],
            name=op.f("fk_tag_workspace_id_workspaces"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("tag_id", name=op.f("pk_tag")),
        sa.UniqueConstraint("workspace_id", "tag_name", name=op.f("uq__tag__workspace_id")),
    )

    op.create_table(
        "content_tag",
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.Column("content_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["author_id"], ["users.user_id"], name=op.f("fk_content_tag_author_id_users")
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["content.id"],
            name=op.f("fk_content_tag_content_id_content"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"],
            ["tag.tag_id"],
            name=op.f("fk_content_tag_tag_id_tag"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("tag_id", "content_id", name=op.f("pk_content_tag")),
        sa.UniqueConstraint("tag_id", "content_id", name=op.f("uq__content_tag__tag_id")),
    )


def downgrade():
    op.drop_table("content_tag")
    op.drop_table("tag")
    if op.get_context().dialect.name == "postgresql":
        op.execute("DROP SEQUENCE seq__tag__tag_id ;")
