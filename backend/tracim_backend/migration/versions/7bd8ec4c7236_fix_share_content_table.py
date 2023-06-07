"""fix_share_content_table

Revision ID: 7bd8ec4c7236
Revises: eeac0cd986c1
Create Date: 2019-08-20 15:07:08.673577

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "7bd8ec4c7236"
down_revision = "eeac0cd986c1"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("content_shares") as batch_op:
        batch_op.alter_column(
            "password", existing_type=sa.VARCHAR(length=128), nullable=True
        )
        batch_op.alter_column(
            "enabled",
            existing_type=sa.Boolean,
            server_default=sa.sql.expression.literal(True),
        )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("content_shares") as batch_op:
        batch_op.alter_column(
            "password", existing_type=sa.VARCHAR(length=128), nullable=False
        )
        batch_op.alter_column("enabled", existing_type=sa.Boolean, server_default=None)
    # ### end Alembic commands ###
