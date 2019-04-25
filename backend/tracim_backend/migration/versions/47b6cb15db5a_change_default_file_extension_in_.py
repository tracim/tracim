"""change default file_extension in database

Revision ID: 47b6cb15db5a
Revises: 8957d4adbc77
Create Date: 2018-10-10 16:50:35.902270

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.

revision = "47b6cb15db5a"
down_revision = "8957d4adbc77"

revisions = sa.Table(
    "content_revisions",
    sa.MetaData(),
    sa.Column("revision_id", sa.Integer, primary_key=True),
    sa.Column("type", sa.Unicode(32), unique=False, nullable=False),
    sa.Column("file_extension", sa.Unicode(255), unique=False, nullable=False, server_default=""),
)


def upgrade():
    connection = op.get_bind()
    connection.execute(
        revisions.update()
        .where(revisions.c.type == "html-document")
        .values(file_extension=".document.html")
    )
    connection.execute(
        revisions.update().where(revisions.c.type == "thread").values(file_extension=".thread.html")
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        revisions.update().where(revisions.c.type == "html-document").values(file_extension=".html")
    )
    connection.execute(
        revisions.update().where(revisions.c.type == "thread").values(file_extension=".html")
    )
