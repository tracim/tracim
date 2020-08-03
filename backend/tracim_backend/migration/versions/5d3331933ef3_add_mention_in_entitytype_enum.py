"""add MENTION in EntityType enum

Revision ID: 5d3331933ef3
Revises: fb2ae8c604ac
Create Date: 2020-07-30 09:03:37.687747

"""
import typing

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5d3331933ef3"
down_revision = "fb2ae8c604ac"

old_entity_types = ("USER", "WORKSPACE", "WORKSPACE_MEMBER", "CONTENT")
old_entity_type_enum = sa.Enum(*old_entity_types, name="entitytype")
new_entity_type_enum = sa.Enum(*(old_entity_types + ("MENTION",)), name="entitytype")


def replace_enum(
    table_name: str,
    column_name: str,
    from_enum: sa.Enum,
    to_enum: sa.Enum,
    default_value: typing.Any,
) -> None:
    if op.get_context().dialect.name == "postgresql":
        op.execute("ALTER TYPE {} RENAME TO {}_old".format(from_enum.name, from_enum.name))
        op.execute("ALTER TABLE {} alter {} drop default".format(table_name, column_name))
        to_enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.alter_column(
                column_name,
                type_=to_enum,
                postgresql_using="{}::text::{}".format(column_name, to_enum.name),
                server_default=default_value,
            )
        op.execute("DROP TYPE {}_old".format(from_enum.name))
    else:
        to_enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.alter_column(column_name, type_=to_enum)


def upgrade() -> None:
    replace_enum("events", "entity_type", old_entity_type_enum, new_entity_type_enum, None)


def downgrade() -> None:
    replace_enum(
        "events", "entity_type", new_entity_type_enum, old_entity_type_enum, None,
    )
