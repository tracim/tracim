"""fix missing reaction in events

Revision ID: bf040d1a4922
Revises: bff384e7c14b
Create Date: 2021-03-22 11:51:43.301319

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "bf040d1a4922"
down_revision = "bff384e7c14b"

enum_name = "entitytype"
old_entity_type_enum_values = (
    "USER",
    "WORKSPACE",
    "WORKSPACE_MEMBER",
    "WORKSPACE_SUBSCRIPTION",
    "CONTENT",
    "MENTION",
)
old_entity_type_enum = sa.Enum(*old_entity_type_enum_values, name=enum_name)
new_entity_type_enum = sa.Enum(*(old_entity_type_enum_values + ("REACTION",)), name=enum_name)


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
