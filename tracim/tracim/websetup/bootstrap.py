# -*- coding: utf-8 -*-
"""Setup the tracim application"""
from __future__ import print_function

import logging
from tg import config
from tracim import model
import transaction

def bootstrap(command, conf, vars):
    """Place any commands to setup tracim here"""

    # <websetup.bootstrap.before.auth
    from sqlalchemy.exc import IntegrityError
    try:
        u = model.User()
        u.display_name = 'Global manager'
        u.email = 'admin@admin.admin'
        u.password = 'admin@admin.admin'
        model.DBSession.add(u)

        g1 = model.Group()
        g1.group_id = 1
        g1.group_name = 'users'
        g1.display_name = 'Users'
        g1.users.append(u)
        model.DBSession.add(g1)

        g2 = model.Group()
        g2.group_id = 2
        g2.group_name = 'managers'
        g2.display_name = 'Global Managers'
        g2.users.append(u)
        model.DBSession.add(g2)

        g3 = model.Group()
        g3.group_id = 3
        g3.group_name = 'administrators'
        g3.display_name = 'Administrators'
        g3.users.append(u)
        model.DBSession.add(g3)

        # TODO: - B.S. - 20160212: Following fixture is LDAP tests specific, should make an little fixture management
        # for tests
        lawrence = model.User()
        lawrence.display_name = 'Lawrence Lessig'
        lawrence.email = 'lawrence-not-real-email@fsf.org'
        lawrence.password = 'foobarbaz'
        model.DBSession.add(lawrence)
        g2.users.append(lawrence)

        model.DBSession.flush()
        transaction.commit()
        pass

    except IntegrityError:
        print('Warning, there was a problem adding your auth data, it may have already been added:')
        import traceback
        print(traceback.format_exc())
        transaction.abort()
        print('Continuing with bootstrapping...')

    # <websetup.bootstrap.after.auth>
