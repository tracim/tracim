"""Added user_config entity type

Revision ID: 38d2725ca92f
Revises: 2cfb200caf44
Create Date: 2024-06-05 12:00:09.633340

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "38d2725ca92f"
down_revision = "2cfb200caf44"

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
    "USER_CALL",
)
user_config = "USER_CONFIG"

old_entity_type_enum = sa.Enum(*old_entity_type_enum_values, name=enum_name)
new_entity_type_enum = sa.Enum(*(old_entity_type_enum_values + (user_config,)), name=enum_name)


def upgrade():
    op.replace_enum(
        table_name="events",
        column_name="entity_type",
        from_enum=old_entity_type_enum,
        to_enum=new_entity_type_enum,
    )


def downgrade():
    op.execute('DELETE FROM events WHERE entity_type = "%s"' % user_config)
    op.replace_enum(
        table_name="events",
        column_name="entity_type",
        from_enum=new_entity_type_enum,
        to_enum=old_entity_type_enum,
    )
