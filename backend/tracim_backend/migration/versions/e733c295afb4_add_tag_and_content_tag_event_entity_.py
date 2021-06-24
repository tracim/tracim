"""add tag and content_tag event entity type

Revision ID: e733c295afb4
Revises: 92daba01d07a
Create Date: 2021-06-22 16:20:28.127433

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "e733c295afb4"
down_revision = "92daba01d07a"

old_enum_values = (
    "USER",
    "WORKSPACE",
    "WORKSPACE_MEMBER",
    "WORKSPACE_SUBSCRIPTION",
    "CONTENT",
    "MENTION",
    "REACTION",
)
old_enum = sa.Enum(*old_enum_values, name="entitytype")
new_enum = sa.Enum(*(old_enum_values + ("TAG", "CONTENT_TAG")), name="entitytype")


def upgrade():
    op.replace_enum("events", "entity_type", old_enum, new_enum, None)


def downgrade():
    op.replace_enum("events", "entity_type", new_enum, old_enum, None)
