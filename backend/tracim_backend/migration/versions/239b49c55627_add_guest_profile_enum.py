"""add GUEST profile enum

Revision ID: 239b49c55627
Revises: 38d2725ca92f
Create Date: 2025-06-11 09:41:09.231101

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "239b49c55627"
down_revision = "38d2725ca92f"


previous_auth_type_list = ["NOBODY", "USER", "TRUSTED_USER", "ADMIN"]
new_elements = ["NOBODY", "GUEST", "USER", "TRUSTED_USER", "ADMIN"]

enum_name = "authtype"
auth_type_enum_values = (
    "INTERNAL",
    "LDAP",
    "SAML",
    "UNKNOWN",
    "REMOTE",
)
auth_type_enum = sa.Enum(*(auth_type_enum_values), name=enum_name)

creation_type_enum = sa.Enum("ADMIN", "INVITATION", "REGISTER", "CLI", name="usercreationtype")

enum_userconnectionstatus = sa.Enum("ONLINE", "OFFLINE", name="userconnectionstatus")


def upgrade():
    if op.get_context().dialect.name == "postgresql":
        op.execute("COMMIT;")
        op.execute("ALTER TYPE profile ADD VALUE 'GUEST' BEFORE 'USER'")

    else:
        enum_profile = sa.Enum(*new_elements, name="profile")
        enum_profile.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column("profile", type_=enum_profile)
            batch_op.create_check_constraint(
                constraint_name="ck_users_username_email",
                condition="NOT (email IS NULL AND username IS NULL)",
            )
            batch_op.alter_column("auth_type", type_=auth_type_enum)
            batch_op.alter_column("creation_type", type_=creation_type_enum)
            batch_op.alter_column("connection_status", type_=enum_userconnectionstatus)


def downgrade():
    op.execute("UPDATE users SET profile = 'USER' WHERE profile = 'GUEST';")

    if op.get_context().dialect.name == "postgresql":
        op.execute("ALTER TABLE users ALTER COLUMN profile DROP DEFAULT")

        op.execute("CREATE TYPE profile_new AS ENUM ('NOBODY', 'USER', 'TRUSTED_USER', 'ADMIN')")
        op.execute(
            "ALTER TABLE users ALTER COLUMN profile TYPE profile_new USING profile::text::profile_new"
        )
        op.execute("DROP TYPE profile")
        op.execute("ALTER TYPE profile_new RENAME TO profile")

        op.execute("ALTER TABLE users ALTER COLUMN profile SET DEFAULT 'NOBODY'")

    else:
        enum_profile = sa.Enum(*previous_auth_type_list, name="profile")
        enum_profile.create(op.get_bind(), checkfirst=False)
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column("profile", type_=enum_profile)
            batch_op.create_check_constraint(
                constraint_name="ck_users_username_email",
                condition="NOT (email IS NULL AND username IS NULL)",
            )
            batch_op.alter_column("auth_type", type_=auth_type_enum)
            batch_op.alter_column("creation_type", type_=creation_type_enum)
            batch_op.alter_column("connection_status", type_=enum_userconnectionstatus)
