"""remove workspace description from non workspace events

Revision ID: 35cfa7c2f8f9
Revises: 1f36b2979f89
Create Date: 2021-04-30 11:05:02.107826

"""
import copy

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "35cfa7c2f8f9"
down_revision = "1f36b2979f89"


events = sa.Table(
    "events",
    sa.MetaData(),
    sa.Column("event_id", sa.Integer),
    sa.Column("fields", sa.JSON),
    sa.Column(
        "entity_type",
        sa.Enum(
            "USER",
            "WORKSPACE",
            "WORKSPACE_MEMBER",
            "WORKSPACE_SUBSCRIPTION",
            "CONTENT",
            "MENTION",
            "REACTION",
        ),
    ),
)


def upgrade():
    connection = op.get_bind()
    for event in connection.execute(events.select().where(events.c.entity_type != "WORKSPACE")):
        try:
            fields = copy.deepcopy(event.fields)
            del fields["workspace"]["description"]
            connection.execute(
                events.update().where(events.c.event_id == event.event_id).values(fields=fields)
            )
        except KeyError:
            pass


def downgrade():
    # NOTE - SG - 2021-04-30
    # No downgrade needed (and even possible) as we remove unwanted data.
    pass
