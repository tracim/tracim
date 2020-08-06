from contextlib import contextmanager
import typing
import weakref

from sqlalchemy.orm import Session

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
