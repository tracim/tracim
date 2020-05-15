"""Added events and messages tables

Revision ID: 3c92f57c52b2
Revises: 96e812178cec
Create Date: 2020-05-14 09:08:10.278702

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "3c92f57c52b2"
down_revision = "96e812178cec"

operation_type_enum = sa.Enum("CREATED", "MODIFIED", "DELETED", name="operationtype")
entity_type_enum = sa.Enum("USER", "WORKSPACE", "WORKSPACE_USER_ROLE", "CONTENT", name="entitytype")


def upgrade():
    op.create_table(
        "events",
        sa.Column("event_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("operation", operation_type_enum, nullable=False,),
        sa.Column("entity_type", entity_type_enum, nullable=False,),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.Column("fields", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("event_id", name=op.f("pk_events")),
    )
    op.create_table(
        "messages",
        sa.Column("receiver_id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("sent", sa.DateTime(), nullable=True),
        sa.Column("read", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["event_id"], ["events.event_id"], name=op.f("fk_messages_event_id_events")
        ),
        sa.ForeignKeyConstraint(
            ["receiver_id"],
            ["users.user_id"],
            name=op.f("fk_messages_receiver_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("receiver_id", "event_id", name=op.f("pk_messages")),
    )
    with op.batch_alter_table("content_revisions") as batch_op:
        batch_op.alter_column("content_id", existing_type=sa.INTEGER(), nullable=True)
        batch_op.drop_constraint("fk_content_revisions_content_id_content", type_="foreignkey")
        batch_op.create_foreign_key(
            batch_op.f("fk_content_revisions_content_id_content"),
            "content",
            ["content_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade():
    with op.batch_alter_table("content_revisions") as batch_op:
        batch_op.drop_constraint(
            batch_op.f("fk_content_revisions_content_id_content"), type_="foreignkey",
        )
        batch_op.create_foreign_key(
            "fk_content_revisions_content_id_content", "content", ["content_id"], ["id"],
        )
        batch_op.alter_column("content_id", existing_type=sa.INTEGER(), nullable=False)
    op.drop_table("messages")
    op.drop_table("events")
    # We have to drop the enum declaration in PostgreSQL as it has a real implementation of it
    # (not with a CHECK() constraint like other RDBMS)
    if op.get_context().dialect.name == "postgresql":
        operation_type_enum.drop(bind=op.get_bind())
        entity_type_enum.drop(bind=op.get_bind())
