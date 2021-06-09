"""migration label

Revision ID: 92daba01d07a
Revises: eb9b7e534b54
Create Date: 2021-05-31 15:51:34.580723

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import MetaData

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq__%(table_name)s__%(column_0_name)s",  # Unique constrains
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)


# revision identifiers, used by Alembic.
revision = "92daba01d07a"
down_revision = "eb9b7e534b54"


def upgrade():
    op.create_table(
        "tag",
        sa.Column(
            "tag_id",
            sa.Integer,
            sa.Sequence("seq__tag__tag_id"),
            autoincrement=True,
            primary_key=True,
        ),
        sa.Column(
            "workspace_id",
            sa.Integer,
            sa.ForeignKey("workspaces.workspace_id", onupdate="CASCADE", ondelete="CASCADE",),
            nullable=False,
        ),
        sa.Column("tag_name", sa.Unicode(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["author_id"], ["users.user_id"], name=op.f("fk_reaction_author_id_users")
        ),
        sa.PrimaryKeyConstraint("tag_id", name=op.f("pk_tag")),
        sa.UniqueConstraint("workspace_id", "tag_name"),
    )

    op.create_table(
        "content_tag",
        sa.Column(
            "id",
            sa.Integer,
            sa.Sequence("seq__content_tag__id"),
            autoincrement=True,
            primary_key=True,
        ),
        sa.Column("tag_id", sa.Integer, sa.Sequence("seq__tag__tag_id"),),
        sa.Column(
            "content_id",
            sa.Integer,
            sa.ForeignKey("content.id", onupdate="CASCADE", ondelete="CASCADE",),
            nullable=False,
        ),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["author_id"], ["users.user_id"], name=op.f("fk_reaction_author_id_users")
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["contents.content_id"],
            name=op.f("fk_content_tag_content_id_contents"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("tag_id", "content_id"),
    )


def downgrade():
    op.drop_table("content_tag")
    op.drop_table("tag")
