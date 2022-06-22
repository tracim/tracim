"""add todo

Revision ID: 8cd1d967d000
Revises: 81c3613b0b6e
Create Date: 2022-06-17 16:30:57.718991

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "8cd1d967d000"
down_revision = "81c3613b0b6e"


def upgrade():
    if op.get_context().dialect.name == "postgresql":
        op.execute("CREATE SEQUENCE seq__todo__todo_id ;")

    op.create_table(
        "todo",
        sa.Column(
            "todo_id",
            sa.Integer,
            sa.Sequence("seq__todo__todo_id"),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column("content_id", sa.Integer(), nullable=False),
        sa.Column("assignee_id", sa.Integer(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["assignee_id"], ["users.user_id"], name=op.f("fk_todo_assignee_id_users")
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["content.id"],
            name=op.f("fk_todo_content_id_content"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("todo_id", name=op.f("pk_todo")),
    )


def downgrade():
    op.drop_table("todo")
    if op.get_context().dialect.name == "postgresql":
        op.execute("DROP SEQUENCE seq__todo__todo_id ;")
