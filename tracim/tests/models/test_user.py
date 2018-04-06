# -*- coding: utf-8 -*-
import transaction

from tracim.tests import eq_
from tracim.tests import BaseTest

from tracim.models.auth import User


class TestUserModel(BaseTest):

    def test_create(self):
        self.session.flush()
        transaction.commit()
        name = 'Damien'
        email = 'damien@accorsi.info'

        user = User()
        user.display_name = name
        user.email = email

        self.session.add(user)
        self.session.flush()
        transaction.commit()

        new_user = self.session.query(User).filter(User.display_name==name).one()

        eq_(new_user.display_name, name)
        eq_(new_user.email, email)
        eq_(new_user.email_address, email)

    def test_null_password(self):
        # Check bug #70 fixed
        # http://tracim.org/workspaces/4/folders/5/threads/70

        name = 'Damien'
        email = 'tracim@trac.im'

        user = User()
        user.display_name = name
        user.email = email

        eq_(False, user.validate_password(None))
