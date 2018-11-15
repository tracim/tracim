# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from sqlalchemy.orm.unitofwork import UOWTransaction
from transaction import TransactionManager
from contextlib import contextmanager

from tracim_backend.exceptions import ContentRevisionDeleteError
from tracim_backend.exceptions import ContentRevisionUpdateError
from tracim_backend.exceptions import SameValueError

from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import Content
from tracim_backend.models.meta import DeclarativeBase


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
        session: Session,
        tm: TransactionManager,
        content: Content,
        force_create_new_revision: bool=False,
) -> Content:
    """
    Prepare context to update a Content. It will add a new updatable revision
    to the content.
    :param session: Database _session
    :param tm: TransactionManager
    :param content: Content instance to update
    :param force_create_new_revision: Decide if new_rev should or should not
    be forced.
    :return:
    """
    with session.no_autoflush:
        try:
            if force_create_new_revision \
                    or inspect(content.revision).has_identity:
                content.new_revision()
            RevisionsIntegrity.add_to_updatable(content.revision)
            yield content
        except Exception as e:
            # INFO - GM - 14-11-2018 - rollback session and renew
            # transaction when error happened
            # This avoid bad _session data like new "temporary" revision
            # to be add when problem happen.
            session.rollback()
            tm.abort()
            tm.begin()
            raise e
        finally:
            RevisionsIntegrity.remove_from_updatable(content.revision)
