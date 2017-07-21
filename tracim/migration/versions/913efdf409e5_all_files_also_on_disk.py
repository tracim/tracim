"""all files also on disk.

Revision ID: 913efdf409e5
Revises: 69fb10c3d6f0
Create Date: 2017-07-12 15:44:20.568447

"""

import shutil

from alembic import op
from depot.fields.sqlalchemy import UploadedFileField
from depot.fields.upload import UploadedFile
from depot.io.utils import FileIntent
from depot.manager import DepotManager
import sqlalchemy as sa
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker

# revision identifiers, used by Alembic.
revision = '913efdf409e5'
down_revision = '69fb10c3d6f0'


# Session = sessionmaker()
# DeclarativeBase = declarative_base()

revision_helper = sa.Table(
    'content_revisions',
    sa.MetaData(),
    sa.Column('revision_id', sa.Integer, primary_key=True),
    sa.Column('label', sa.String(1024), nullable=False),
    sa.Column('file_extension', sa.String(255), nullable=False),
    sa.Column('file_mimetype', sa.String(255), nullable=False),
    sa.Column('file_content', sa.LargeBinary),
    sa.Column('depot_file', UploadedFileField, nullable=True),
    sa.Column('type', sa.String(32), nullable=False),
)


# class RevisionForMigration(DeclarativeBase):
#     """Revision of Content for this migration."""

#     __tablename__ = 'content_revisions'

#     revision_id = Column(Integer, primary_key=True)

#     label = Column(Unicode(1024), unique=False, nullable=False)
#     description = Column(Text(), unique=False, nullable=False, default='')
#     file_extension = Column(
#         Unicode(255),
#         unique=False,
#         nullable=False,
#         server_default='',
#     )
#     file_mimetype = Column(Unicode(255),  unique=False, nullable=False, default='')
#     file_content = deferred(Column(LargeBinary(), unique=False, nullable=True))
#     depot_file = Column(UploadedFileField, unique=False, nullable=True)
#     properties = Column('properties', Text(), unique=False, nullable=False, default='')
#     type = Column(Unicode(32), unique=False, nullable=False)
#     status = Column(Unicode(32), unique=False, nullable=False, default=ContentStatus.OPEN)
#     created = Column(DateTime, unique=False, nullable=False, default=datetime.utcnow)
#     updated = Column(DateTime, unique=False, nullable=False, default=datetime.utcnow)
#     is_deleted = Column(Boolean, unique=False, nullable=False, default=False)
#     is_archived = Column(Boolean, unique=False, nullable=False, default=False)
#     is_temporary = Column(Boolean, unique=False, nullable=False, default=False)
#     revision_type = Column(Unicode(32), unique=False, nullable=False, default='')

#     def file_name(self) -> str:
#         return '{0}{1}'.format(
#             self.revision.label,
#             self.revision.file_extension,
#         )


# def fill_depot_file_fields()
#     """fills depot file fields when they are null."""
#     connection = op.get_bind()
#     session = Session(bind=connection)

#     all_files_wo_depot = session.query(RevisionForMigration) \
#         .filter_by(type='file', depot_file=None) \
#         .all()
#     for one_file_wo_depot in all_files_wo_depot:
#         # with tempfile.TemporaryFile() as tmp_file:
#         #     tmp_file.write(one_file_wo_depot.content)
#         #     one_file_wo_depot.depot_file = tmp_file
#         one_file_wo_depot.depot_file = (
#             one_file_wo_depot.content,
#             one_file_wo_depot.file_name(),
#             one_file_wo_depot.file_mimetype,
#         )
#     session.commit()


def upgrade():
    """Sets depot file for file typed revisions."""
    import pudb; pu.db

    # fill_depot_file_fields()

    # Creates files depot used in this migration:
    # - 'default': depot used until now,
    DepotManager.configure(
        'default', {'depot.storage_path': 'depot/'},
    )
    depot = DepotManager.get('default')

    connection = op.get_bind()

    file_revision_query = revision_helper.select() \
        .where(revision_helper.c.type == 'file')
    all_file_revisions = connection.execute(file_revision_query)
    for one_revision in all_file_revisions:
        one_revision_filename = '{0}{1}'.format(
            one_revision.label,
            one_revision.file_extension,
        )
        if not one_revision.depot_file:
            depot_file_intent = FileIntent(
                one_revision.file_content,
                one_revision_filename,
                one_revision.file_mimetype,
            )
            depot_file_field = UploadedFile(depot_file_intent)
            one_revision_update = revision_helper.update() \
                .where(revision_helper.c.type == 'file') \
                .where(revision_helper.c.revision_id == one_revision.revision_id) \
                .values(depot_file=depot_file_field) \
                .return_defaults()
            result = connection.execute(one_revision_update)
        else:
            # TODO - A.P - makes the field in DB to be updated as well
            depot_file_uid = depot.replace(
                one_revision.depot_file.file_id,
                one_revision.file_content,
                one_revision_filename,
                one_revision.file_mimetype,
            )


def downgrade():
    """Resets depot file for file typed revisions."""
    connection = op.get_bind()
    file_revision_query = revision_helper.update() \
        .where(revision_helper.c.type == 'file') \
        .where(revision_helper.c.depot_file.isnot(None)) \
        .values(depot_file=None) \
        .return_defaults()
    result = connection.execute(file_revision_query)
    shutil.rmtree('depot/', ignore_errors=True)
