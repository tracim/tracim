"""workspace parent_id index

Revision ID: 6653b1b4bb7b
Revises: b8090112ca95
Create Date: 2020-10-07 12:57:28.606238

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "6653b1b4bb7b"
down_revision = "b8090112ca95"


def upgrade():
    dialect = op.get_context().dialect
    # INFO G.M - 2020-10-07 - mysql create automatically index on foreign key, do not need to update index
    # and it's very complicated to drop/delete index in a working way to be sure getting the correct index name here.
    if dialect.name != "mysql":
        op.create_index("idx__workspaces__parent_id", "workspaces", ["parent_id"], unique=False)


def downgrade():
    dialect = op.get_context().dialect
    # INFO G.M - 2020-10-07 - mysql create automatically index on foreign key, do not need to update index
    # and it's very complicated to drop/delete index in a working way to be sure getting the correct index name here.
    if dialect.name != "mysql":
        op.drop_index("idx__workspaces__parent_id", table_name="workspaces")
