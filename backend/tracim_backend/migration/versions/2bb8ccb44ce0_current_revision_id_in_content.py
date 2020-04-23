"""current_revision_id in content

Revision ID: 2bb8ccb44ce0
Revises: 511ce99e1baa
Create Date: 2020-03-24 16:42:32.943900

"""
# revision identifiers, used by Alembic.
from alembic import op
import sqlalchemy as sa

revision = "2bb8ccb44ce0"
down_revision = "4f72874ba193"

filling_current_revision_query = """
update content
set cached_revision_id = (select max(revision_id) from content_revisions where content_id = content.id)
"""


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("content") as batch_op:
        batch_op.add_column(sa.Column("cached_revision_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            constraint_name="fk_content_cached_revision_id_content_revisions",
            referent_table="content_revisions",
            local_cols=["cached_revision_id"],
            remote_cols=["revision_id"],
            ondelete="RESTRICT",
        )

    connection = op.get_bind()

    connection.execute(filling_current_revision_query)
    with op.batch_alter_table("content") as batch_op:
        batch_op.alter_column("cached_revision_id", existing_type=sa.Integer(), nullable=False)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("content") as batch_op:
        batch_op.drop_constraint(
            "fk_content_cached_revision_id_content_revisions", type_="foreignkey"
        )
        batch_op.drop_column("cached_revision_id")
    # ### end Alembic commands ###
