from contextlib import contextmanager

from sqlalchemy.orm import Session


class TracimSession(Session):
    """
    Subclass of Sqlalchemy session to add tracim specific stuff
    """

    def __init__(self, **kwargs):
        Session.__init__(self, **kwargs)
        self.allow_revision_deletion = False


@contextmanager
def unsafe_tracim_session(session: TracimSession):
    """
    allow to bypass protection on tracim revisions
    """
    original_allow_revision_deletion = session.allow_revision_deletion
    session.allow_revision_deletion = True
    yield session
    session.allow_revision_deletion = original_allow_revision_deletion
