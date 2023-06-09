"""remove raw content from event

Revision ID: 6f36ee7d829e
Revises: 8382e5a19f0d
Create Date: 2022-05-23 12:09:17.112836

"""
# revision identifiers, used by Alembic.
from alembic import op
from copy import deepcopy
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import JSON
from sqlalchemy import MetaData
from sqlalchemy import Sequence
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

revision = "6f36ee7d829e"
down_revision = "8382e5a19f0d"

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq__%(table_name)s__%(column_0_name)s",  # Unique constrains
    # TODO - G.M - 28-03-2018 - [Database] Convert database to allow naming convention
    # for ck contraint.
    # "ck": "ck_%(table_name)s_%(column_0_N_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)
DeclarativeBase = declarative_base(metadata=metadata)


class TemporaryEvents(DeclarativeBase):
    """temporary sqlalchemy object to help migration"""

    __tablename__ = "events"
    event_id = Column(
        Integer, Sequence("seq__events__event_id"), autoincrement=True, primary_key=True
    )
    fields = Column(JSON, nullable=False)


def upgrade():
    connection = op.get_bind()
    session = Session(bind=connection)
    # check all revision with not empty content
    events = session.query(TemporaryEvents)

    for event in events:
        if "content" in event.fields:
            if "raw_content" in event.fields["content"]:
                new_event_field = deepcopy(event.fields)
                del new_event_field["content"]["raw_content"]
                event.fields = new_event_field
                session.add(event)
    session.commit()


def downgrade():
    # INFO - G.M - 23-05-2022 - We can't do a proper downgrade here
    connection = op.get_bind()
    session = Session(bind=connection)
    # check all revision with not empty content
    events = session.query(TemporaryEvents)

    for event in events:
        if "content" in event.fields:
            if "raw_content" not in event.fields["content"]:
                new_event_field = deepcopy(event.fields)
                new_event_field["content"]["raw_content"] = ""
                event.fields = new_event_field
                session.add(event)
    session.commit()
