# -*- coding: utf-8 -*-
"""The application's model objects"""
from decorator import contextmanager
from sqlalchemy import event, inspect, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker, Session
from sqlalchemy.orm.unitofwork import UOWTransaction
from zope.sqlalchemy import ZopeTransactionExtension

from tracim.lib.exception import ContentRevisionUpdateError, ContentRevisionDeleteError


class RevisionsIntegrity(object):
    """
    Simple static used class to manage a list with list of ContentRevisionRO who are allowed to be updated.

    When modify an already existing (understood have an identity in databse) ContentRevisionRO, if it's not in
    RevisionsIntegrity._updatable_revisions list, a ContentRevisionUpdateError thrown.

    This class is used by tracim.model.new_revision context manager.
    """
    _updatable_revisions = []

    @classmethod
    def add_to_updatable(cls, revision: 'ContentRevisionRO') -> None:
        if inspect(revision).has_identity:
            raise ContentRevisionUpdateError("ContentRevision is not updatable. %s already have identity." % revision)

        if revision not in cls._updatable_revisions:
            cls._updatable_revisions.append(revision)

    @classmethod
    def remove_from_updatable(cls, revision: 'ContentRevisionRO') -> None:
        cls._updatable_revisions.remove(revision)

    @classmethod
    def is_updatable(cls, revision: 'ContentRevisionRO') -> bool:
        return revision in cls._updatable_revisions

# Global session manager: DBSession() returns the Thread-local
# session object appropriate for the current web request.
maker = sessionmaker(autoflush=True, autocommit=False,
                     extension=ZopeTransactionExtension())
DBSession = scoped_session(maker)

# Base class for all of our model classes: By default, the data model is
# defined with SQLAlchemy's declarative extension, but if you need more
# control, you can switch to the traditional method.
convention = {
  "ix": 'ix__%(column_0_label)s',  # Indexes
  "uq": "uq__%(table_name)s__%(column_0_name)s",  # Unique constrains
  "ck": "ck__%(table_name)s__%(constraint_name)s",  # Other column constrains
  "fk": "fk__%(table_name)s__%(column_0_name)s__%(referred_table_name)s",  # Foreign keys
  "pk": "pk__%(table_name)s"  # Primary keys
}

metadata = MetaData(naming_convention=convention)
DeclarativeBase = declarative_base(metadata=metadata)

# There are two convenient ways for you to spare some typing.
# You can have a query property on all your model classes by doing this:
# DeclarativeBase.query = DBSession.query_property()
# Or you can use a session-aware mapper as it was used in TurboGears 1:
# DeclarativeBase = declarative_base(mapper=DBSession.mapper)

# Global metadata.
# The default metadata is the one from the declarative base.
metadata = DeclarativeBase.metadata

# If you have multiple databases with overlapping table names, you'll need a
# metadata for each database. Feel free to rename 'metadata2'.
#metadata2 = MetaData()

#####
# Generally you will not want to define your table's mappers, and data objects
# here in __init__ but will want to create modules them in the model directory
# and import them at the bottom of this file.
#
######


def init_model(engine):
    """Call me before using any of the tables or classes in the model."""
    DBSession.configure(bind=engine)

    # If you are using reflection to introspect your database and create
    # table objects for you, your tables must be defined and mapped inside
    # the init_model function, so that the engine is available if you
    # use the model outside tg2, you need to make sure this is called before
    # you use the model.

    #
    # See the following example:

    #global t_reflected

    #t_reflected = Table("Reflected", metadata,
    #    autoload=True, autoload_with=engine)

    #mapper(Reflected, t_reflected)

# Import your model modules here.
from tracim.model.auth import User, Group, Permission
from tracim.model.data import Content, ContentRevisionRO


@event.listens_for(DBSession, 'before_flush')
def prevent_content_revision_delete(session: Session, flush_context: UOWTransaction,
                                    instances: [DeclarativeBase]) -> None:
    for instance in session.deleted:
        if isinstance(instance, ContentRevisionRO) and instance.revision_id is not None:
            raise ContentRevisionDeleteError("ContentRevision is not deletable. You must make a new revision with" +
                                             "is_deleted set to True. Look at tracim.model.new_revision context " +
                                             "manager to make a new revision")


@contextmanager
def new_revision(content: Content) -> Content:
    """
    Prepare context to update a Content. It will add a new updatable revision to the content.
    :param content: Content instance to update
    :return:
    """
    with DBSession.no_autoflush:
        try:
            if inspect(content.revision).has_identity:
                content.new_revision()
            RevisionsIntegrity.add_to_updatable(content.revision)
            yield content
        finally:
            RevisionsIntegrity.remove_from_updatable(content.revision)