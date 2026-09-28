from contextlib import contextmanager
import filelock
import os
from sqlalchemy import event
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.orm.session import SessionTransaction
import tempfile
import typing
import weakref

if typing.TYPE_CHECKING:
    from tracim_backend.lib.utils.request import TracimContext


class TracimSession(Session):
    """
    Subclass of Sqlalchemy session to add tracim specific stuff
    """

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._allow_revision_deletion = False  # type: bool
        self._context = None  # type: typing.Optional[weakref.CallableProxyType]
        self._results_cache = {}
        self.use_cache_hint = False

        # keep a reference of file locks (see _try_lock_for_content_filelock) so:
        # - it is kept during app transaction lifetime
        # - we can handle double lock call on same content in same session
        self._content_file_locks = {}  # type: typing.Dict[str, filelock.FileLock]

    @contextmanager
    def cache(self) -> typing.Iterator["TracimSession"]:
        self.use_cache_hint = True
        try:
            yield self
        finally:
            self._results_cache.clear()
            self.use_cache_hint = False

    def use_cache(
        self, key: str, fetch_from_db: typing.Callable[[], typing.Iterable[typing.Any]]
    ) -> typing.Iterable[typing.Any]:
        """Very simple caching mechanism.

        Results are cached only for the current session.
        """
        if not self.use_cache_hint:
            return fetch_from_db()
        try:
            results = self._results_cache[key]
        except KeyError:
            results = fetch_from_db()
            self._results_cache[key] = results
        return results

    # TODO S.G 2020-06-08: this is a temporary setup until #1834 is done
    @property
    def context(self) -> "TracimContext":
        assert self._context, "This session has no context"
        return self._context

    # TODO S.G 2020-06-08: this is a temporary setup until #1834 is done
    def set_context(self, tracim_context: "TracimContext") -> None:
        self._context = weakref.proxy(tracim_context)

    def set_allowed_revision_deletion(self, value: bool) -> None:
        self._allow_revision_deletion = value

    def get_allowed_revision_deletion(self) -> bool:
        return self._allow_revision_deletion

    def try_lock_for_content(self, content_id: int, revision_id: int) -> bool:
        """Try to lock the given revision of a content, without waiting.

        The lock is keyed on (content_id, revision_id) and is released automatically
        at the end of the current transaction (commit or rollback)

        Args:
            content_id (int): The identifier of the content.
            revision_id (int): The identifier of the revision of the content.

        Returns:
            bool: True if the lock was acquired (or is already held by this session),
            False if another transaction holds it.
        """
        dialect_name = self.get_bind().dialect.name
        if dialect_name == "postgresql":
            return self._try_lock_for_content_postgresql(content_id, revision_id)
        if dialect_name == "sqlite":
            return self._try_lock_for_content_filelock(content_id, revision_id)
        raise NotImplementedError(f"Content locks are not supported with {dialect_name}")

    def _try_lock_for_content_postgresql(self, content_id: int, revision_id: int) -> bool:
        """Uses PostgreSQL advisory lock functions, available since PG 9.1 (2011)

        See:
            - https://www.postgresql.org/docs/13/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS list of
              advisory lock functions
            - https://www.postgresql.org/docs/9.1/release-9-1.html v9.1 release notes, see "E.25.3.5. Utility Operations"
        """
        return self.execute(
            text("SELECT pg_try_advisory_xact_lock(:content_id, :revision_id)"),
            {"content_id": content_id, "revision_id": revision_id},
        ).scalar()

    def _try_lock_for_content_filelock(self, content_id: int, revision_id: int) -> bool:
        """Lock implementation for SQLite using Filelock lib
        Works on Linux and Windows

        Locks are released on app transaction end, see  :meth:`TracimSession._release_content_file_locks`

        WARNING:
            - only works on a single server
            - the lock files are NOT removed on Linux (FileLock use flock).
        """
        lock_file_path = os.path.join(
            tempfile.gettempdir(), f"tracim_content_{content_id}_{revision_id}.lock"
        )

        if lock_file_path in self._content_file_locks:
            # lock exists and is already ours => OK
            return True

        lock = filelock.FileLock(lock_file_path)
        try:
            lock.acquire(timeout=0)
        except filelock.Timeout:
            return False

        self._content_file_locks[lock_file_path] = lock

        return True

    def _release_content_file_locks(self) -> None:
        """Release file locks, see :meth:`TracimSession._try_lock_for_content_filelock`"""
        if self.get_bind().dialect.name != "sqlite":
            return

        for lock in self._content_file_locks.values():
            lock.release()
        self._content_file_locks.clear()

    def assert_event_mechanism(self) -> None:
        assert self.info["crud_hook_caller"], (
            "Entity crud hook caller not registered, "
            "session must be created through create_dbsession_for_context()"
        )
        assert self.context.plugin_manager.has_plugin("EventBuilder"), (
            "event builder not registered, you must register EventBuilder()"
            "on session's context plugin_manager"
        )
        assert self.context.plugin_manager.has_plugin("EventPublisher"), (
            "event publisher not registered, you must register EventPublisher()"
            "on session's context plugin_manager"
        )


@event.listens_for(TracimSession, "after_transaction_end")
def on_transaction_end(session: TracimSession, transaction: SessionTransaction) -> None:
    if transaction.parent is None:
        session._release_content_file_locks()


@contextmanager
def unprotected_content_revision(
    session: TracimSession,
) -> typing.Generator[TracimSession, None, None]:
    """
    allow to bypass protection on tracim revisions
    """
    original_allow_revision_deletion_status = session.get_allowed_revision_deletion()
    try:
        session.set_allowed_revision_deletion(True)
        yield session
    finally:
        session.set_allowed_revision_deletion(original_allow_revision_deletion_status)
