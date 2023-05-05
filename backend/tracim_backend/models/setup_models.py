# import or define all models here to ensure they are attached to the
# Base.metadata prior to any initialization routines
import typing

from pyramid.config import Configurator
from sqlalchemy import engine_from_config
from sqlalchemy.engine import Engine
from sqlalchemy.event import listen
from sqlalchemy.orm import Session
from sqlalchemy.orm import configure_mappers
from sqlalchemy.orm import scoped_session
from sqlalchemy.orm import sessionmaker
import zope.sqlalchemy

from tracim_backend.applications.share.models import ContentShare  # noqa: F401
from tracim_backend.applications.upload_permissions.models import UploadPermission  # noqa: F401
from tracim_backend.lib.crud_hook.caller import DatabaseCrudHookCaller
from tracim_backend.lib.utils.utils import sliced_dict
from tracim_backend.models.auth import User  # noqa: F401
from tracim_backend.models.data import Content  # noqa: F401
from tracim_backend.models.data import ContentRevisionRO  # noqa: F401
from tracim_backend.models.favorites import FavoriteContent  # noqa: F401
from tracim_backend.models.meta import DeclarativeBase  # noqa: F401
from tracim_backend.models.reaction import Reaction  # noqa: F401
from tracim_backend.models.tracim_session import TracimSession

if typing.TYPE_CHECKING:
    # INFO - G.M - 2019-05-03 - import for type-checking only, setted here to
    # avoid circular import issue
    from tracim_backend.config import CFG
    from tracim_backend.lib.utils.request import TracimContext

# run configure_mappers after defining all of the models to ensure
# all relationships can be setup
configure_mappers()


def get_engine(app_config: "CFG", prefix="sqlalchemy.", **kwargs) -> Engine:
    sqlalchemy_params = sliced_dict(
        app_config.__dict__, beginning_key_string=prefix.upper().replace(".", "__")
    )
    # INFO - G.M - 2019-04-30 - get setting as default config for supporting custom sqlalchemy
    # parameter in config file only
    new_config = sliced_dict(app_config.settings, beginning_key_string=prefix)
    for key, value in sqlalchemy_params.items():
        new_key = key.lower().replace("__", ".")
        new_config[new_key] = value

    return engine_from_config(new_config, prefix=prefix, **kwargs)


def get_session_factory(engine) -> sessionmaker:
    factory = sessionmaker(expire_on_commit=False, class_=TracimSession)
    factory.configure(bind=engine)
    return factory


def get_scoped_session_factory(engine) -> scoped_session:
    factory = scoped_session(sessionmaker(expire_on_commit=False, class_=TracimSession))
    factory.configure(bind=engine)
    return factory


def get_tm_session(session_factory, transaction_manager) -> Session:
    """
    Get a ``sqlalchemy.orm.Session`` instance backed by a transaction.

    This function will hook the _session to the transaction manager which
    will take care of committing any changes.

    - When using pyramid_tm it will automatically be committed or aborted
      depending on whether an exception is raised.

    - When using scripts you should wrap the _session in a manager yourself.
      For example::

          import transaction

          engine = get_engine(settings)
          session_factory = get_session_factory(engine)
          with transaction.manager:
              dbsession = get_tm_session(session_factory, transaction.manager)

    """
    dbsession = session_factory()
    # FIXME - G.M - 02-05-2018 - Check Zope/Sqlalchemy session conf.
    # We use both keep_session=True for zope and
    # expire_on_commit=False for sessionmaker to keep session alive after
    # commit ( in order  to not have trouble like
    # https://github.com/tracim/tracim_backend/issues/52
    # or detached objects problems).
    # These problems happened because we use "commit" in our current code.
    # Understand what those params really mean and check if it can cause
    # troubles somewhere else.
    # see https://stackoverflow.com/questions/16152241/how-to-get-a-sqlalchemy-session-managed-by-zope-transaction-that-has-the-same-sc
    zope.sqlalchemy.register(dbsession, transaction_manager=transaction_manager, keep_session=True)
    from tracim_backend.models.revision_protection import prevent_content_revision_delete

    listen(dbsession, "before_flush", prevent_content_revision_delete)
    return dbsession


def create_dbsession_for_context(
    session_factory, transaction_manager, context: "TracimContext"
) -> Session:
    """Creates and initialize a sqlalchemy session for the given context"""
    dbsession = get_tm_session(session_factory, transaction_manager)
    dbsession.set_context(context)
    # Keep a reference on the crud hook caller for the session's lifetime
    dbsession.info["crud_hook_caller"] = DatabaseCrudHookCaller(dbsession, context.plugin_manager)
    context.plugin_manager.hook.on_context_session_created(db_session=dbsession, context=context)
    return dbsession


def init_models(configurator: Configurator, app_config: "CFG") -> None:
    """
    Initialize the model for a Pyramid app.
    """
    settings = configurator.get_settings()
    settings["tm.manager_hook"] = "pyramid_tm.explicit_manager"

    # use pyramid_tm to hook the transaction lifecycle to the request
    configurator.include("pyramid_tm")

    session_factory = get_session_factory(get_engine(app_config))
    configurator.registry["dbsession_factory"] = session_factory

    # make request.dbsession available for use in Pyramid
    configurator.add_request_method(
        # r.tm is the transaction manager used by pyramid_tm
        lambda r: create_dbsession_for_context(session_factory, r.tm, r),
        "dbsession",
        reify=True,
    )
