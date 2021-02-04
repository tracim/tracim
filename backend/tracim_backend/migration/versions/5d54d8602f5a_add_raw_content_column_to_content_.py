"""add raw_content column to content_revision

Revision ID: 5d54d8602f5a
Revises: 7c6641d4f934
Create Date: 2021-02-02 16:55:09.422323

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "5d54d8602f5a"
down_revision = "7c6641d4f934"

set_comment_html_document_raw_content = """
update content_revisions
set raw_content = description, description = ''
where type in ('html-document', 'comment', 'thread')
"""

unset_comment_html_document_raw_content = """
update content_revisions
set description = raw_content
where type in ('html-document', 'comment', 'thread')
"""


def upgrade():
    with op.batch_alter_table("content_revisions") as batch_op:
        batch_op.add_column(
            sa.Column("raw_content", sa.Text(), nullable=False, default="", server_default="")
        )
    connection = op.get_bind()
    connection.execute(set_comment_html_document_raw_content)


def downgrade():
    connection = op.get_bind()
    connection.execute(unset_comment_html_document_raw_content)
    with op.batch_alter_table("content_revisions") as batch_op:
        batch_op.drop_column("raw_content")
