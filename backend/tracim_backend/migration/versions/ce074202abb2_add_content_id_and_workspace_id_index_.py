"""add content_id and workspace_id index in content_revision

Revision ID: ce074202abb2
Revises: 511ce99e1baa
Create Date: 2020-03-26 11:02:21.363465

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "ce074202abb2"
down_revision = "511ce99e1baa"


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    dialect = op.get_context().dialect
    # INFO G.M - 2020-03-30 - mysql create automatically index on foreign key, do not need to update index
    # and it's very complicated to drop/delete index in a working way to be sure getting the correct index name here.
    if dialect.name != "mysql":
        op.create_index(
            "idx__content_revisions__content_id", "content_revisions", ["content_id"], unique=False
        )
        op.create_index(
            "idx__content_revisions__workspace_id",
            "content_revisions",
            ["workspace_id"],
            unique=False,
        )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    dialect = op.get_context().dialect
    # INFO G.M - 2020-03-30 - mysql create automatically index on foreign key, do not need to update index
    # and it's very complicated to drop/delete index in a working way to be sure getting the correct index name here.
    if dialect.name != "mysql":
        op.drop_index("idx__content_revisions__workspace_id", table_name="content_revisions")
        op.drop_index("idx__content_revisions__content_id", table_name="content_revisions")
    # ### end Alembic commands ###
