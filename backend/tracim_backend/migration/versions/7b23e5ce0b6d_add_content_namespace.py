"""add content_namespace

Revision ID: 7b23e5ce0b6d
Revises: 5e43c0f32b48
Create Date: 2019-08-07 16:00:10.847256

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "7b23e5ce0b6d"
down_revision = "5e43c0f32b48"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    enum = sa.Enum("CONTENT", "UPLOAD", name="contentnamespaces")
    with op.batch_alter_table("content_revisions") as batch_op:
        batch_op.add_column(
            sa.Column("content_namespace", enum, server_default="CONTENT", nullable=False)
        )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("content_revisions") as batch_op:
        batch_op.drop_column("content_namespace")
    sa.Enum(name="contentnamespaces").drop(op.get_bind(), checkfirst=False)
    # ### end Alembic commands ###
