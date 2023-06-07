# """add share_content table
#
# Revision ID: 5e43c0f32b48
# Revises: d4ed9c6991ae
# Create Date: 2019-07-30 12:15:16.519364
#
# """
# revision identifiers, used by Alembic.
from alembic import op
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence

revision = "5e43c0f32b48"
down_revision = "d4ed9c6991ae"


def upgrade():
    enum = sa.Enum("EMAIL", "PUBLIC_LINK", name="contentsharetype")
    # ### commands auto generated by Alembic - please adjust! ###
    # ### end Alembic commands ###
    op.create_table(
        "content_shares",
        sa.Column(
            "share_id",
            sa.Integer,
            Sequence("seq__content_shares__share_id"),
            autoincrement=True,
            primary_key=True,
        ),
        sa.Column("content_id", sa.Integer(), ForeignKey("content.id"), nullable=False),
        sa.Column(
            "author_id", sa.Integer(), ForeignKey("users.user_id"), nullable=False
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("share_token", sa.Unicode(255), nullable=False),
        sa.Column("share_group_id", sa.Unicode(255), nullable=False),
        sa.Column("type", enum, nullable=False),
        sa.Column("password", sa.Unicode(128), nullable=False),
        sa.Column("enabled", sa.Boolean(), unique=False, nullable=False, default=None),
        sa.Column(
            "created",
            sa.DateTime(),
            unique=False,
            nullable=False,
            default=datetime.utcnow,
        ),
        sa.Column("disabled", sa.DateTime(), unique=False, nullable=True, default=None),
    )


def downgrade():
    op.drop_table("content_shares")
    sa.Enum(name="contentsharetype").drop(op.get_bind(), checkfirst=False)
