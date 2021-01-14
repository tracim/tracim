"""add UNDELETE operation type in enum

Revision ID: fb2ae8c604ac
Revises: 9d4621f59614
Create Date: 2020-06-23 09:56:58.775491

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "fb2ae8c604ac"
down_revision = "9d4621f59614"

old_operation_type_enum = sa.Enum("CREATED", "MODIFIED", "DELETED", name="operationtype")
new_operation_type_enum = sa.Enum(
    "CREATED", "MODIFIED", "DELETED", "UNDELETED", name="operationtype"
)


def upgrade():
    if op.get_context().dialect.name == "postgresql":
        # INFO - G.M - 2018-11-27 - TO modify type in postgresql, we have
        # create a new type set column type to this new one and remove the old one
        op.execute("ALTER TYPE operationtype RENAME TO operationtype_old;")
        op.execute("ALTER TABLE events alter operation drop default;")
        new_operation_type_enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("events") as batch_op:
            batch_op.alter_column(
                "operation",
                type_=new_operation_type_enum,
                postgresql_using="operation::text::operationtype",
            )
        op.execute("DROP TYPE operationtype_old")
    else:
        new_operation_type_enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("events") as batch_op:
            batch_op.alter_column("operation", type_=new_operation_type_enum)


def downgrade():
    if op.get_context().dialect.name == "postgresql":
        # INFO - G.M - 2018-11-27 - TO modify type in postgresql, we have
        # create a new type set column type to this new one and remove the old one
        op.execute("ALTER TYPE operationtype RENAME TO operationtype_old;")
        op.execute("ALTER TABLE events alter operation drop default;")
        old_operation_type_enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("events") as batch_op:
            batch_op.alter_column(
                "operation",
                type_=old_operation_type_enum,
                postgresql_using="operation::text::operationtype",
            )
        op.execute("DROP TYPE operationtype_old")
    else:
        old_operation_type_enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("events") as batch_op:
            batch_op.alter_column("operation", type_=old_operation_type_enum)
