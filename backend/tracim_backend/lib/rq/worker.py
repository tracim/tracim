import contextlib
import typing

from rq import SimpleWorker
from rq.local import LocalStack

from tracim_backend.config import CFG
from tracim_backend.lib.utils.daemon import initialize_config_from_environment
from tracim_backend.models.setup_models import get_engine
from tracim_backend.models.setup_models import get_session_factory
from tracim_backend.models.tracim_session import TracimSession

_engines = LocalStack()
_configs = LocalStack()


@contextlib.contextmanager
def worker_session() -> typing.Generator[TracimSession, None, None]:
    """Open a SQLAlchemy session and close it when context is exited.
    The session is created using the current DatabaseWorker's engine.

    This context manager MUST be used through a RQ job that is executed
    by a DatabaseWorker worker which can be started with:
        rq worker -w tracim_backend.lib.rq.worker.DatabaseWorker
    """
    engine = _engines.top
    assert engine, "Can only be called in a RQ job"
    session_factory = get_session_factory(_engines.top)
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
    finally:
        session.close()


def worker_app_config() -> CFG:
    """Return the current DatabaseWorker configuration object.

    This function MUST be used through a RQ job that is executed
    by a DatabaseWorker worker.
    """
    config = _configs.top
    assert config, "Can only be called in a RQ job"
    return config


class DatabaseWorker(SimpleWorker):
    """Custom RQ worker that provides access to Tracim:
      - SQL database through the worker_session() context manager.
      - Configuration object (CFG) through the worker_app_config() function.

    Work is performed in the main worker thread to avoid connection problems
    with SQLAlchemy.
    """

    def work(self, *args, **kwargs):
        app_config = initialize_config_from_environment()
        _engines.push(get_engine(app_config))
        _configs.push(app_config)
        try:
            super().work(*args, **kwargs)
        finally:
            _engines.pop()
            _configs.pop()
