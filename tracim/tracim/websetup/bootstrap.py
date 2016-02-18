# -*- coding: utf-8 -*-
"""Setup the tracim application"""
from __future__ import print_function

import transaction

from tracim.fixtures import FixturesLoader
from tracim.fixtures.users_and_groups import Base as BaseFixture


def bootstrap(command, conf, vars):
    """Place any commands to setup tracim here"""

    # <websetup.bootstrap.before.auth
    from sqlalchemy.exc import IntegrityError
    try:
        fixtures_loader = FixturesLoader()
        fixtures_loader.loads([BaseFixture])
    except IntegrityError:
        print('Warning, there was a problem adding your auth data, it may have already been added:')
        import traceback
        print(traceback.format_exc())
        transaction.abort()
        print('Continuing with bootstrapping...')

    # <websetup.bootstrap.after.auth>
