"""add publication namespace

Revision ID: 78a01733957f
Revises: 5d54d8602f5a
Create Date: 2021-03-10 17:24:12.238148

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "78a01733957f"
down_revision = "5d54d8602f5a"

old_enum_values = ("CONTENT", "UPLOAD")
old_enum = sa.Enum(*old_enum_values, name="contentnamespaces")
new_enum = sa.Enum(*(old_enum_values + ("PUBLICATION",)), name="contentnamespaces")


def upgrade() -> None:
    op.replace_enum("content_revisions", "content_namespace", old_enum, new_enum, None)


def downgrade() -> None:
    op.replace_enum("content_revisions", "content_namespace", new_enum, old_enum, None)
