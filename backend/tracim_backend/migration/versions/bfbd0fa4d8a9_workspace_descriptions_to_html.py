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
import sqlalchemy as sa
from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base

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

# revision identifiers, used by Alembic.
revision = "bfbd0fa4d8a9"
down_revision = "208eda5a6a80"


class TemporaryWorkspaces(DeclarativeBase):
    """ temporary sqlalchemy object to help migration"""

    __tablename__ = "workspaces"

    workspace_id = sa.Column(sa.Integer, primary_key=True)
    description = sa.Column(sa.Text(), unique=False, nullable=False, default="")


def newlines_to_html_br(text: str):
    return text.replace("\n", "<br />")


def upgrade():
    connection = op.get_bind()
    session = sa.orm.Session(bind=connection)
    workspaces = session.query(TemporaryWorkspaces)
    for workspace in workspaces:
        description = workspace.description
        parsed_description = BeautifulSoup(description, "html.parser")
        text_content = parsed_description.get_text()
        if text_content == description:
            # if this condition is reached, the description is not in HTML
            # Otherwise, we have nothing to do
            converted_description = newlines_to_html_br(html.escape(description, quote=False))
            workspace.description = converted_description
            session.add(workspace)
    session.commit()


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
