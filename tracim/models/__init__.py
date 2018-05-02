# -*- coding: utf-8 -*-
from sqlalchemy import engine_from_config
from sqlalchemy.event import listen
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import configure_mappers
import zope.sqlalchemy
from .meta import DeclarativeBase
from .revision_protection import prevent_content_revision_delete
# import or define all models here to ensure they are attached to the
# Base.metadata prior to any initialization routines
from tracim.models.auth import User, Group, Permission
from tracim.models.data import Content, ContentRevisionRO

# run configure_mappers after defining all of the models to ensure
# all relationships can be setup
configure_mappers()


def get_engine(settings, prefix='sqlalchemy.'):
    return engine_from_config(settings, prefix)


def get_session_factory(engine):
    factory = sessionmaker(expire_on_commit=False)
    factory.configure(bind=engine)
    return factory


def get_tm_session(session_factory, transaction_manager):
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
    # These problem happened because we use "commit" in our current code.
    # Understand what those params really mean and check if it can cause
    # troubles somewhere else.
    # see https://stackoverflow.com/questions/16152241/how-to-get-a-sqlalchemy-session-managed-by-zope-transaction-that-has-the-same-sc  # nopep8
    zope.sqlalchemy.register(
        dbsession,
        transaction_manager=transaction_manager,
        keep_session=True,
    )
    listen(dbsession, 'before_flush', prevent_content_revision_delete)
    return dbsession


def includeme(config):
    """
    Initialize the model for a Pyramid app.

    Activate this setup using ``config.include('tracim.models')``.

    """
    settings = config.get_settings()
    settings['tm.manager_hook'] = 'pyramid_tm.explicit_manager'

    # use pyramid_tm to hook the transaction lifecycle to the request
    config.include('pyramid_tm')

    # use pyramid_retry to retry a request when transient exceptions occur
    config.include('pyramid_retry')

    session_factory = get_session_factory(get_engine(settings))
    config.registry['dbsession_factory'] = session_factory

    # make request.dbsession available for use in Pyramid
    config.add_request_method(
        # r.tm is the transaction manager used by pyramid_tm
        lambda r: get_tm_session(session_factory, r.tm),
        'dbsession',
        reify=True
    )
