# -*- coding: utf-8 -*-
from datetime import datetime

from freezegun import freeze_time
import transaction
from tracim_backend.tests import BaseTest
from tracim_backend.models.auth import User


class TestUserModel(BaseTest):
    """
    Test for User model
    """
    def test_unit__create__ok__nominal_case(self):
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

        new_user = self.session.query(User).filter(User.display_name == name).one()  # nopep8

        assert new_user.display_name == name
        assert new_user.email == email
        assert new_user.email_address == email

    def test_unit__password__ok__nominal_case(self):
        """
        Check if password can be set and hashed password
        can be retrieve. Verify if hashed password is not
        same as password.
        """
        name = 'Damien'
        email = 'tracim@trac.im'
        password = 'my_secure_password'

        user = User()
        user.display_name = name
        user.email = email
        assert user._password is None
        user.password = password
        assert user._password is not None
        assert user._password != password
        assert user.password == user._password

    def test__unit__validate_password__ok__nominal_case(self):
        """
        Check if validate_password can correctly check if password i the correct
        one
        """

        name = 'Damien'
        email = 'tracim@trac.im'
        password = 'my_secure_password'

        user = User()
        user.display_name = name
        user.email = email
        user.password = password

        assert user.validate_password(password) is True

    def test_unit__validate_password__false__null_password(self):
        # Check bug #70 fixed
        # http://tracim.org/workspaces/4/folders/5/threads/70

        name = 'Damien'
        email = 'tracim@trac.im'

        user = User()
        user.display_name = name
        user.email = email

        assert user.validate_password('') is False

    def test_unit__validate_password__false__bad_password(self):
        """
        Check if validate_password can correctly check if password is
        an uncorrect correct one
        """
        name = 'Damien'
        email = 'tracim@trac.im'
        password = 'my_secure_password'

        user = User()
        user.display_name = name
        user.email = email
        user.password = password

        assert user.validate_password('uncorrect_password') is False

    def test_unit__validate_password__false__empty_password(self):
        """
        Check if validate_password failed if not password
        """
        name = 'Damien'
        email = 'tracim@trac.im'
        password = None

        user = User()
        user.display_name = name
        user.email = email
        user.password = password

        assert user.validate_password(password) is False
        assert user.validate_password('') is False


    def test_unit__repr__ok__nominal_case(self):
        name = 'Damien'
        email = 'tracim@trac.im'

        user = User()
        user.display_name = name
        user.email = email

        assert user.__repr__() == "<User: email='tracim@trac.im', display='Damien'>"  # nopep8

    def test_unit__unicode__ok__nominal_case(self):
        name = 'Damien'
        email = 'tracim@trac.im'

        user = User()
        user.display_name = name
        user.email = email

        assert user.__unicode__() == name

    def test__unit__unicode__ok__no_display_name(self):

        email = 'tracim@trac.im'

        user = User()
        user.email = email

        assert user.__unicode__() == email

    def test_unit__reset_token__ok__nominal_case(self):
        email = 'tracim@trac.im'

        user = User()
        user.email = email
        assert user.auth_token is None
        with freeze_time("1999-12-31 23:59:59"):
            user.ensure_auth_token(validity_seconds=5)
            assert user.auth_token
            assert user.auth_token_created == datetime.now()
            token = user.auth_token
            token_time = user.auth_token_created

        with freeze_time("2003-12-31 23:59:59"):
            user.reset_tokens()
            assert user.auth_token != token
            assert user.auth_token_created != token_time
            assert user.auth_token_created == datetime.now()
