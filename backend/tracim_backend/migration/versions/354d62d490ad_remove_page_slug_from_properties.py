"""remove page slug from properties

Revision ID: 354d62d490ad
Revises: 182b9f7aa837
Create Date: 2019-01-22 15:27:12.462798

"""
import json

from alembic import op
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import MetaData
from sqlalchemy import Text
from sqlalchemy import Unicode
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

# revision identifiers, used by Alembic.
revision = "354d62d490ad"
down_revision = "182b9f7aa837"

OLD_SLUG = "page"
NEW_SLUG = "html-document"


NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq__%(table_name)s__%(column_0_name)s",  # Unique constrains
    # for ck contraint.
    # "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)
DeclarativeBase = declarative_base(metadata=metadata)


class TemporaryContentRevision(DeclarativeBase):
    """ temporary sqlalchemy object to help migration"""

    __tablename__ = "content_revisions"

    revision_id = Column(Integer, primary_key=True)
    properties = Column("properties", Text(), unique=False, nullable=False, default="")
    type = Column(Unicode(32), unique=False, nullable=False)


def upgrade():
    connection = op.get_bind()
    session = Session(bind=connection)
    # check all revision with not empty content
    revisions = session.query(TemporaryContentRevision).filter(
        TemporaryContentRevision.properties != ""
    )
    # for each revision go to json properties['allowed_content'] and search for
    # OLD_SLUG section
    for rev in revisions:
        if rev.properties:
            json_properties = json.loads(rev.properties)
            allowed_content_properties = json_properties.get("allowed_content")
            if allowed_content_properties:
                if OLD_SLUG in allowed_content_properties:
                    if NEW_SLUG not in allowed_content_properties:
                        # add old value to new slug
                        allowed_content_properties[NEW_SLUG] = allowed_content_properties[OLD_SLUG]
                    # remove old slug section
                    del allowed_content_properties[OLD_SLUG]
                    # convert to json and apply modification
                    new_properties = json.dumps(json_properties)
                    rev.properties = new_properties
                    session.add(rev)
    session.commit()


def downgrade():
    """ Downgrade is not able to retrieve content with old slug and content
    with new as both are valid before this. Stay with NEW_SLUG is better, so
    don't do anything
    """
    pass
