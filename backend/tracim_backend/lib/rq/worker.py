import contextlib
import typing

import pluggy
from rq import SimpleWorker
from rq.local import LocalStack
import transaction

from tracim_backend.config import CFG
from tracim_backend.lib.core.plugins import init_plugin_manager
from tracim_backend.lib.utils.daemon import initialize_config_from_environment
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.setup_models import create_dbsession_for_context
from tracim_backend.models.setup_models import get_engine
from tracim_backend.models.setup_models import get_session_factory
from tracim_backend.models.tracim_session import TracimSession

_engines = LocalStack()
_configs = LocalStack()


class RqWorkerTracimContext(TracimContext):
    def __init__(self, config: CFG) -> None:
        super().__init__()
        self._app_config = config
        self._dbsession = None
        self._plugin_manager = init_plugin_manager(config)

    @property
    def app_config(self) -> CFG:
        return self._app_config

    @property
    def current_user(self) -> None:
        return None

    @property
    def dbsession(self) -> TracimSession:
        assert self._dbsession
        return self._dbsession

    @property
    def plugin_manager(self) -> pluggy.PluginManager:
        return self._plugin_manager


@contextlib.contextmanager
def worker_context() -> typing.Generator[TracimContext, None, None]:
    """Create a tracim context with a db session.
    The session is created using the current DatabaseWorker's engine.

    This context manager MUST be used through a RQ job that is executed
    by a DatabaseWorker worker which can be started with:
        rq worker -w tracim_backend.lib.rq.worker.DatabaseWorker
    """
    engine = _engines.top
    config = _configs.top
    assert config and engine, "Can only be called in a RQ job"
    context = RqWorkerTracimContext(config=config)

    session_factory = get_session_factory(engine)
    session = create_dbsession_for_context(session_factory, transaction.manager, context)
    context._dbsession = session
    try:
        yield context
        transaction.commit()
    except Exception:
        transaction.abort()
        raise
    finally:
        context.cleanup()


class DatabaseWorker(SimpleWorker):
    """Custom RQ worker that provides access a TracimContext through worker_context().

    Work is performed in the main worker thread to avoid connection problems
    with SQLAlchemy.
    """

    def work(self, *args, **kwargs):
        try:
            app_config = kwargs.pop("app_config")
        except KeyError:
            app_config = initialize_config_from_environment()
        _engines.push(get_engine(app_config))
        _configs.push(app_config)
        try:
            super().work(*args, **kwargs)
        finally:
            _engines.pop()
            _configs.pop()
