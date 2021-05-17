"""add index for workspace_id

Revision ID: 44a268b2d39c
Revises: 35cfa7c2f8f9
Create Date: 2021-05-06 13:56:11.098421

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "44a268b2d39c"
down_revision = "35cfa7c2f8f9"


events = sa.Table(
    "events",
    sa.MetaData(),
    sa.Column("workspace_id", sa.Integer()),
    sa.Column("fields", sa.JSON()),
)


def upgrade():
    with op.batch_alter_table("events") as batch_op:
        batch_op.add_column(sa.Column("workspace_id", sa.Integer(), nullable=True))
    op.create_index(
        "ix__events__event_id__workspace_id", "events", ["event_id", "workspace_id"], unique=False
    )
    connection = op.get_bind()
    connection.execute(
        events.update()
        .where(
            sa.func.cast(events.c.fields["workspace"]["workspace_id"], sa.String)
            != sa.text("'null'"),
        )
        .values(workspace_id=events.c.fields["workspace"]["workspace_id"].as_integer())
    )


def downgrade():
    op.drop_index("ix__events__event_id__workspace_id", table_name="events")
    with op.batch_alter_table("events") as batch_op:
        batch_op.drop_column("workspace_id")
