"""rename_manager_group

Revision ID: 8957d4adbc77
Revises: c223cce1a413
Create Date: 2018-09-20 10:56:29.173246

"""
from datetime import datetime

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "8957d4adbc77"
down_revision = "c223cce1a413"


group = sa.Table(
    "groups",
    sa.MetaData(),
    sa.Column(
        "group_id",
        sa.Integer,
        sa.Sequence("seq__groups__group_id"),
        autoincrement=True,
        primary_key=True,
    ),
    sa.Column("group_name", sa.Unicode(16), unique=True, nullable=False),
    sa.Column("display_name", sa.Unicode(255)),
    sa.Column("created", sa.DateTime, default=datetime.utcnow),
)


def upgrade():
    connection = op.get_bind()
    connection.execute(
        group.update()
        .where(group.c.group_name == "managers")
        .values(group_name="trusted-users", display_name="Trusted Users")
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        group.update()
        .where(group.c.group_name == "trusted-users")
        .values(group_name="managers", display_name="Global Managers")
    )
    # ### end Alembic commands ###
