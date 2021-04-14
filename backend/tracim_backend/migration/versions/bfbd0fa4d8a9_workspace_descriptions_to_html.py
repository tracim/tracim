"""workspace_descriptions_to_html

Revision ID: bfbd0fa4d8a9
Revises: 208eda5a6a80
Create Date: 2021-04-14 14:31:00.007292

Note(RJ): This migration converts plain text descriptions to HTML
by replacing new lines to <br /> tags. This is done because previously,
the frontend did this transformation when displaying the descriptions.
Descriptions are now written using a WYSIWYG editor and we had to remove
this behavior to make this work.

Workspace descriptions need to always be sent as HTML code from now on.
"""
import html

from alembic import op
from bs4 import BeautifulSoup

from tracim_backend.models.meta import metadata

# revision identifiers, used by Alembic.
revision = "bfbd0fa4d8a9"
down_revision = "208eda5a6a80"


def nl2br(text: str):
    return text.replace("\n", "<br />")


def upgrade():
    connection = op.get_bind()
    workspaces_table = metadata.tables["workspaces"]
    workspaces = connection.execute(workspaces_table.select()).fetchall()
    for workspace in workspaces:
        description = workspace["description"]
        parsed_description = BeautifulSoup(description, "html.parser")
        text_content = parsed_description.get_text()
        if text_content == description:
            # if this condition is reached, the description is not in HTML
            # Otherwise, we have nothing to do
            converted_description = nl2br(html.escape(description, quote=False))
            query = (
                workspaces_table.update()
                .where(workspaces_table.c.workspace_id == workspace["workspace_id"])
                .values(description=converted_description)
            )
            connection.execute(query)


def downgrade():
    # RJ - Not doing anything for downgrade here is okay.
    #
    # The frontend will incorrectly add br tags in HTML codes, but there is
    # nothing clean we can really do. We could work around the issue by removing new
    # lines characters from HTML, but this will break description with <pre> tags.
    # We could carefully avoid removing new lines in <pre> tags, but it is also
    # possible to style elements to make them behave like <pre>, but suddently we
    # would need a CSS parser to handle the situation, which gets pretty complicated.
    #
    # It is safer not to touch descriptions here, so a future upgrade will
    # automatically fix them.
    # Administrators can always manually fix descriptions if they really need do.
    pass
