from contextlib import contextmanager
from sqlalchemy import text
from sqlalchemy.orm import Session
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

        The lock is a PostgreSQL transaction-level advisory lock keyed on
        (content_id, revision_id): it is released automatically at the end of the
        current transaction (commit or rollback).

        Args:
            content_id (int): The identifier of the content.
            revision_id (int): The identifier of the revision of the content.

        Returns:
            bool: True if the lock was acquired, False if another transaction holds it.
            Always True with databases other than PostgreSQL, which do not support
            advisory locks.
        """
        if self.get_bind().dialect.name != "postgresql":
            return True
        return self.execute(
            text("SELECT pg_try_advisory_xact_lock(:content_id, :revision_id)"),
            {"content_id": content_id, "revision_id": revision_id},
        ).scalar()

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
