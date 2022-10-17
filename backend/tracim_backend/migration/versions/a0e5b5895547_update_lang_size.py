"""update lang size

Revision ID: a0e5b5895547
Revises: 1af756c610d8
Create Date: 2022-09-28 12:17:38.877017

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a0e5b5895547"
down_revision = "1af756c610d8"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("lang", type_=sa.Unicode(length=6))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("lang", type_=sa.Unicode(length=3))
    # ### end Alembic commands ###