from depot.fields.sqlalchemy import UploadedFileField
from sqlalchemy import types


class TracimUploadedFileField(UploadedFileField):
    """
    Modified version of UploadFileField to store as JSON instead of varchar(4000),
    This give use both a better storage type and overcome limitation of
    mysql database for real utf8 fields: 4000 char in utf8bm4 is too big for mysql.
    """

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(types.JSON)
