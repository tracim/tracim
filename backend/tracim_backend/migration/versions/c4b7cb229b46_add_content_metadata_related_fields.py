"""add content metadata related fields

Revision ID: c4b7cb229b46
Revises: 8382e5a19f0d
Create Date: 2021-11-25 09:45:53.414669

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c4b7cb229b46"
down_revision = "8382e5a19f0d"


def upgrade():
    op.add_column("content_revisions", sa.Column("content_metadata", sa.JSON(), nullable=True))
    op.add_column("content_revisions", sa.Column("metadata_schema_id", sa.Integer(), nullable=True))
    op.add_column(
        "content_revisions", sa.Column("metadata_schema_revision_id", sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        op.f("fk_content_revisions_metadata_schema_revision_id_content_revisions"),
        "content_revisions",
        "content_revisions",
        ["metadata_schema_revision_id"],
        ["revision_id"],
    )
    op.create_foreign_key(
        op.f("fk_content_revisions_metadata_schema_id_content"),
        "content_revisions",
        "content",
        ["metadata_schema_id"],
        ["id"],
    )
    op.add_column(
        "content_revisions",
        sa.Column("metadata_ui_schema_revision_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        op.f("fk_content_revisions_metadata_ui_schema_revision_id_content_revisions"),
        "content_revisions",
        "content_revisions",
        ["metadata_ui_schema_revision_id"],
        ["revision_id"],
    )
    op.create_foreign_key(
        op.f("fk_content_revisions_metadata_ui_schema_id_content"),
        "content_revisions",
        "content",
        ["metadata_ui_schema_id"],
        ["id"],
    )


def downgrade():
    op.drop_constraint(
        op.f("fk_content_revisions_metadata_schema_id_content"),
        "content_revisions",
        type_="foreignkey",
    )
    op.drop_constraint(
        op.f("fk_content_revisions_metadata_schema_revision_id_content_revisions"),
        "content_revisions",
        type_="foreignkey",
    )
    op.drop_constraint(
        op.f("fk_content_revisions_metadata_ui_schema_id_content"),
        "content_revisions",
        type_="foreignkey",
    )
    op.drop_constraint(
        op.f("fk_content_revisions_metadata_ui_schema_revision_id_content_revisions"),
        "content_revisions",
        type_="foreignkey",
    )
    op.drop_column("content_revisions", "metadata_schema_revision_id")
    op.drop_column("content_revisions", "metadata_schema_id")
    op.drop_column("content_revisions", "metadata_ui_schema_revision_id")
    op.drop_column("content_revisions", "metadata_ui_schema_id")
    op.drop_column("content_revisions", "content_metadata")
