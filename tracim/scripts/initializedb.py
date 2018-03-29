# -*- coding: utf-8 -*-
import os
import sys
import transaction

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

from pyramid.scripts.common import parse_vars

from ..models.meta import DeclarativeBase
from ..models import (
    get_engine,
    get_session_factory,
    get_tm_session,
    )


def usage(argv):
    cmd = os.path.basename(argv[0])
    print('usage: %s <config_uri> [var=value]\n'
          '(example: "%s development.ini")' % (cmd, cmd))
    sys.exit(1)


def main(argv=sys.argv):
    if len(argv) < 2:
        usage(argv)
    config_uri = argv[1]
    options = parse_vars(argv[2:])
    setup_logging(config_uri)
    settings = get_appsettings(config_uri, options=options)

    engine = get_engine(settings)
    DeclarativeBase.metadata.create_all(engine)

    session_factory = get_session_factory(engine)
    # TODO - G.M - 28-03-2018 - [Cleanup] Remove code related to example
    with transaction.manager:
        pass
        # dbsession = get_tm_session(session_factory, transaction.manager)
        # model = MyModel(name='one', value=1)
        # dbsession.add(model)
        # Add global manager data, just for test
