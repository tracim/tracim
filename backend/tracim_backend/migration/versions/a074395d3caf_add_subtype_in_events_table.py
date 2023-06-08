"""add subtype in events table

Revision ID: a074395d3caf
Revises: 3c92f57c52b2
Create Date: 2020-05-26 11:30:36.254925

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a074395d3caf"
down_revision = "3c92f57c52b2"


def upgrade():
    with op.batch_alter_table("events") as batch_op:
        batch_op.add_column(sa.Column("entity_subtype", sa.String(length=100), nullable=True))
    # NOTE SG 2020-05-26: subtype values are left to NULL as we do not have any production
    # database running with the events table.


def downgrade():
    with op.batch_alter_table("events") as batch_op:
        batch_op.drop_column("entity_subtype")
