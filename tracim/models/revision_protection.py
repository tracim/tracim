from sqlalchemy.orm import Session
from sqlalchemy import inspect
from sqlalchemy.orm.unitofwork import UOWTransaction
from transaction import TransactionManager
from contextlib import contextmanager

from tracim.exceptions import ContentRevisionDeleteError
from tracim.exceptions import ContentRevisionUpdateError
from tracim.exceptions import SameValueError

from .data import ContentRevisionRO
from .data import Content
from .meta import DeclarativeBase


def prevent_content_revision_delete(
        session: Session,
        flush_context: UOWTransaction,
        instances: [DeclarativeBase]
) -> None:
    for instance in session.deleted:
        if isinstance(instance, ContentRevisionRO) \
                and instance.revision_id is not None:
            raise ContentRevisionDeleteError(
                "ContentRevision is not deletable. " +
                "You must make a new revision with" +
                "is_deleted set to True. Look at " +
                "tracim.model.new_revision context " +
                "manager to make a new revision"
            )


class RevisionsIntegrity(object):
    """
    Simple static used class to manage a list with list of ContentRevisionRO
    who are allowed to be updated.

    When modify an already existing (understood have an identity in databse)
    ContentRevisionRO, if it's not in RevisionsIntegrity._updatable_revisions
    list, a ContentRevisionUpdateError thrown.

    This class is used by tracim.model.new_revision context manager.
    """
    _updatable_revisions = []

    @classmethod
    def add_to_updatable(cls, revision: 'ContentRevisionRO') -> None:
        if inspect(revision).has_identity:
            raise ContentRevisionUpdateError("ContentRevision is not updatable. %s already have identity." % revision)  # nopep8

        if revision not in cls._updatable_revisions:
            cls._updatable_revisions.append(revision)

    @classmethod
    def remove_from_updatable(cls, revision: 'ContentRevisionRO') -> None:
        if revision in cls._updatable_revisions:
            cls._updatable_revisions.remove(revision)

    @classmethod
    def is_updatable(cls, revision: 'ContentRevisionRO') -> bool:
        return revision in cls._updatable_revisions


@contextmanager
def new_revision(
        dbsession: Session,
        tm: TransactionManager,
        content: Content,
        force_create_new_revision: bool=False,
) -> Content:
    """
    Prepare context to update a Content. It will add a new updatable revision
    to the content.
    :param dbsession: Database session
    :param tm: TransactionManager
    :param content: Content instance to update
    :param force_create_new_revision: Decide if new_rev should or should not
    be forced.
    :return:
    """
    with dbsession.no_autoflush:
        try:
            if force_create_new_revision \
                    or inspect(content.revision).has_identity:
                content.new_revision()
            RevisionsIntegrity.add_to_updatable(content.revision)
            yield content
        except SameValueError or ValueError as e:
            # INFO - 20-03-2018 - renew transaction when error happened
            # This avoid bad session data like new "temporary" revision
            # to be add when problem happen.
            tm.abort()
            tm.begin()
            raise e
        finally:
            RevisionsIntegrity.remove_from_updatable(content.revision)
