"""add copied and moved operation type

Revision ID: b7aa3b477519
Revises: a0e5b5895547
Create Date: 2022-12-16 09:55:25.274865

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "b7aa3b477519"
down_revision = "a0e5b5895547"

enum_name = "operationtype"
old_entity_type_enum_values = (
    "CREATED",
    "MODIFIED",
    "DELETED",
    "UNDELETED",
)
old_entity_type_enum = sa.Enum(*old_entity_type_enum_values, name=enum_name)
new_entity_type_enum = sa.Enum(
    *(old_entity_type_enum_values + ("COPIED",) + ("MOVED",)), name=enum_name
)


def upgrade():
    op.replace_enum(
        table_name="events",
        column_name="operation",
        from_enum=old_entity_type_enum,
        to_enum=new_entity_type_enum,
    )


def downgrade():
    op.replace_enum(
        table_name="events",
        column_name="operation",
        from_enum=new_entity_type_enum,
        to_enum=old_entity_type_enum,
    )
