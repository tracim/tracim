from contextlib import contextmanager
import typing

from sqlalchemy.orm import Session


class TracimSession(Session):
    """
    Subclass of Sqlalchemy session to add tracim specific stuff
    """

    def __init__(self, *arg, **kwargs) -> None:
        super().__init__(self, *arg, **kwargs)
        self._allow_revision_deletion = False  # type: bool

    def set_allowed_revision_deletion(self, value: bool) -> None:
        self._allow_revision_deletion = value

    def get_allowed_revision_deletion(self) -> bool:
        return self._allow_revision_deletion


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
