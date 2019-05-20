"""remove page slug from content_revision type

Revision ID: f889c2b59759
Revises: 354d62d490ad
Create Date: 2019-01-22 16:34:22.989215

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f889c2b59759"
down_revision = "354d62d490ad"


OLD_SLUG = "page"
NEW_SLUG = "html-document"
NEW_SLUG_FILE_EXTENSION = ".document.html"

content_revisions = sa.Table(
    "content_revisions", sa.MetaData(), sa.Column("type"), sa.Column("file_extension")
)


def upgrade():
    connection = op.get_bind()
    connection.execute(
        content_revisions.update()
        .where(content_revisions.c.type == OLD_SLUG)
        .values(type=NEW_SLUG, file_extension=NEW_SLUG_FILE_EXTENSION)
    )


def downgrade():
    """ Downgrade is not able to retrieve content with old slug and content
    with new as both are valid before this. Stay with NEW_SLUG is better, so
    don't do anything
    """
    pass

    # ### end Alembic commands ###
