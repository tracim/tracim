"""add unknown value to auth_type

Revision ID: 1877d3571a8b
Revises: ab7c7f4bcbc5
Create Date: 2018-11-27 12:01:24.143020

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "1877d3571a8b"
down_revision = "ab7c7f4bcbc5"

previous_auth_type_list = ["INTERNAL", "LDAP"]
new_elements = ["UNKNOWN"]
new_auth_type_list = previous_auth_type_list + new_elements
default_type = "INTERNAL"

users = sa.Table("users", sa.MetaData(), sa.Column("auth_type"))


def upgrade():
    if op.get_context().dialect.name == "postgresql":
        # INFO - G.M - 2018-11-27 - TO modify type in postgresq, we should
        # create a new one set column type to this new one and remove old one
        op.execute("ALTER TYPE authtype RENAME TO authtype_old;")
        op.execute("ALTER TABLE users alter auth_type drop default;")
        enum = sa.Enum(*new_auth_type_list, name="authtype")
        enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column(
                "auth_type",
                type_=enum,
                postgresql_using="auth_type::text::authtype",
                server_default="INTERNAL",
            )
        op.execute("DROP TYPE authtype_old;")
    else:
        # INFO - G.M - 2018-11-27 - MYSQL case
        enum = sa.Enum(*new_auth_type_list, name="authtype")
        enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column("auth_type", type_=enum)


def downgrade():
    # INFO - G.M - 2018-11-27 - Set all unknown auth_type to internal
    # to avoid compatibility issue
    connection = op.get_bind()
    connection.execute(
        users.update().where(users.c.auth_type.in_(new_elements)).values(auth_type=default_type)
    )
    if op.get_context().dialect.name == "postgresql":
        # INFO - G.M - 2018-11-27 - TO modify type in postgresq, we should
        # create a new one set column type to this new one and remove old one
        op.execute("ALTER TYPE authtype RENAME TO authtype_old;")
        op.execute("ALTER TABLE users alter auth_type drop default;")
        enum = sa.Enum(*previous_auth_type_list, name="authtype")
        enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column(
                "auth_type",
                type_=enum,
                postgresql_using="auth_type::text::authtype",
                server_default="INTERNAL",
            )
        op.execute("DROP TYPE authtype_old;")
    else:
        # INFO - G.M - 2018-11-27 - MYSQL case
        enum = sa.Enum(*previous_auth_type_list, name="authtype")
        enum.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column("auth_type", type_=enum)
