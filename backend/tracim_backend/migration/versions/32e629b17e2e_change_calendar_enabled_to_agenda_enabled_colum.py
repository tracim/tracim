"""change calendar enabled to agenda enabled column

Revision ID: 32e629b17e2e
Revises: f889c2b59759
Create Date: 2019-04-04 17:39:54.241996

"""
# revision identifiers, used by Alembic.
from alembic import op
from sqlalchemy import Boolean

revision = "32e629b17e2e"
down_revision = "f889c2b59759"


def rename_boolean_column(
    table_name: str, old_column_name: str, new_column_name: str, constraint_name: str
):
    """
    Utils to help rename a boolean column supporting:
    - postgresql
    - mysql 8.0+
    - mariadb 10.3+
    - sqlite
    """
    with op.batch_alter_table(table_name) as bop:
        if op.get_context().dialect.name == "mysql":
            if not op.get_context().dialect._is_mariadb:
                bop.drop_constraint(constraint_name, type_="check")
            bop.alter_column(
                old_column_name,
                new_column_name=new_column_name,
                type_=Boolean(create_constraint=False),
            )
            bop.alter_column(new_column_name, type_=Boolean(constraint_name))
        else:
            bop.alter_column(old_column_name, new_column_name=new_column_name)


def upgrade():
    rename_boolean_column("workspaces", "calendar_enabled", "agenda_enabled", "workspaces_chk_2")


def downgrade():
    rename_boolean_column("workspaces", "agenda_enabled", "calendar_enabled", "workspaces_chk_2")
