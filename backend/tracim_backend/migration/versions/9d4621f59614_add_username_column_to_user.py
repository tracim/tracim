"""add username column to user

Revision ID: 9d4621f59614
Revises: a074395d3caf
Create Date: 2020-06-01 11:40:20.440426

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9d4621f59614"
down_revision = "a074395d3caf"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("username", sa.Unicode(length=255), nullable=True))
        batch_op.alter_column("email", existing_type=sa.VARCHAR(length=255), nullable=True)
        batch_op.create_unique_constraint(op.f("uq__users__username"), ["username"])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint(op.f("uq__users__username"), type_="unique")
        batch_op.alter_column("email", existing_type=sa.VARCHAR(length=255), nullable=False)
        batch_op.drop_column("username")
    # ### end Alembic commands ###
