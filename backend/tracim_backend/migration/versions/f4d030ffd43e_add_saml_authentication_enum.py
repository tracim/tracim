"""add SAML authentication enum

Revision ID: f4d030ffd43e
Revises: 27e6c43ac6e4
Create Date: 2023-09-08 14:53:33.760355

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f4d030ffd43e'
down_revision = '27e6c43ac6e4'

enum_name = "authtype"
old_auth_type_enum_values = (
    "INTERNAL",
    "LDAP",
    "UNKNOWN",
    "REMOTE",
)
old_auth_type_enum = sa.Enum(*old_auth_type_enum_values, name=enum_name)
new_auth_type_enum = sa.Enum(*(old_auth_type_enum_values + ("SAML",)), name=enum_name)

def upgrade():
    op.replace_enum(
        table_name="users",
        column_name="auth_type",
        from_enum=old_auth_type_enum,
        to_enum=new_auth_type_enum,
    )


def downgrade():
    op.replace_enum(
        table_name="users",
        column_name="auth_type",
        from_enum=new_auth_type_enum,
        to_enum=old_auth_type_enum,
    )
