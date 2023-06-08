"""add user_call events

Revision ID: f44c6e2a7700
Revises: 4a9a9c4890de
Create Date: 2021-09-21 14:32:00.652450

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f44c6e2a7700"
down_revision = "4a9a9c4890de"

enum_name = "entitytype"
old_entity_type_enum_values = (
    "USER",
    "WORKSPACE",
    "WORKSPACE_MEMBER",
    "WORKSPACE_SUBSCRIPTION",
    "CONTENT",
    "MENTION",
    "REACTION",
    "TAG",
    "CONTENT_TAG",
)
old_entity_type_enum = sa.Enum(*old_entity_type_enum_values, name=enum_name)
new_entity_type_enum = sa.Enum(*(old_entity_type_enum_values + ("USER_CALL",)), name=enum_name)


def upgrade():
    op.replace_enum(
        table_name="events",
        column_name="entity_type",
        from_enum=old_entity_type_enum,
        to_enum=new_entity_type_enum,
    )


def downgrade():
    op.replace_enum(
        table_name="events",
        column_name="entity_type",
        from_enum=new_entity_type_enum,
        to_enum=old_entity_type_enum,
    )
