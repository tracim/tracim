import transaction

from nose.tools import eq_
from nose.tools import ok_

from tracim.model import DBSession

from tracim.tests import TestStandard


from tracim.model.auth import User


class TestUserModel(TestStandard):

    def test_create(self):
        DBSession.flush()
        transaction.commit()
        name = 'Damien'
        email = 'damien@accorsi.info'

        user = User()
        user.display_name = name
        user.email = email

        DBSession.add(user)
        DBSession.flush()
        transaction.commit()

        new_user = DBSession.query(User).filter(User.display_name==name).one()

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
