"""Remove the 'allowed_content' property from content revisions which are not folder/event.

! THIS IS A COPY OF migration ae30497b6168, as this cleaning code is one more time necessary
because copy feature was broken.

Removing this property ensures that the default value from the code will be used.
Done as we now want to allow any content child of any.

Folders (and events) are not updated as the allowed_content property can have been changed
by users for those content types.

Revision ID: 1af756c610d8
Revises: 622464216ab7
Create Date: 2022-06-24 12:06:28.706447

"""
from alembic import op
import json
import sqlalchemy as sa
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import MetaData
from sqlalchemy import Table
from sqlalchemy import Text
from sqlalchemy import Unicode

# revision identifiers, used by Alembic.
revision = "622464216ab7"
down_revision = "0c494b0934df"


metadata = MetaData()

content_revisions_table = Table(
    "content_revisions",
    metadata,
    Column("properties", Text(), unique=False, nullable=False, default=""),
    Column("type", Unicode()),
    Column("revision_id", Integer()),
)


def remove_allowed_content_property_in_all_but_folders_and_events():
    connection = op.get_bind()
    excluded_content_types = ("folder", "event")
    content_revisions = connection.execute(
        content_revisions_table.select().where(
            sa.and_(
                content_revisions_table.c.properties != None,  # noqa: E711
                content_revisions_table.c.properties != "",
                content_revisions_table.c.type.notin_(excluded_content_types),
            )
        )
    ).fetchall()
    for content_revision in content_revisions:
        properties_dict = json.loads(content_revision["properties"])
        properties_dict = {k: v for k, v in properties_dict.items() if k != "allowed_content"}
        properties_json = json.dumps(properties_dict)
        query = (
            content_revisions_table.update()
            .where(content_revisions_table.c.revision_id == content_revision["revision_id"])
            .values(properties=properties_json)
        )
        connection.execute(query)


def upgrade():
    remove_allowed_content_property_in_all_but_folders_and_events()


def downgrade():
    remove_allowed_content_property_in_all_but_folders_and_events()
