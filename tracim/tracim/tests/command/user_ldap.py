from nose.tools import eq_, raises
from nose.tools import ok_

from tracim.command.user import CreateUserCommand, LDAPUserUnknown
from tracim.fixtures.ldap import ldap_test_server_fixtures
from tracim.lib.exception import CommandAbortedError
from tracim.tests import TestCommand, LDAPTest


class TestLDAPUserCommand(LDAPTest, TestCommand):
    """
    Test LDAP user verification when execute command
    """
    application_under_test = 'ldap'
    ldap_server_data = ldap_test_server_fixtures

    @raises(LDAPUserUnknown)
    def test_user_not_in_ldap(self):
        self._execute_command(
            CreateUserCommand,
            'gearbox user create',
            ['-l', 'unknown-user@fsf.org', '-p', 'foo', '--raise']
        )

    def test_user_in_ldap(self):
        try:
            self._execute_command(
                CreateUserCommand,
                'gearbox user create',
                ['-l', 'richard-not-real-email@fsf.org', '-p', 'foo', '--raise']
            )
        except LDAPUserUnknown:
            ok_(False, "Command should not raise LDAPUserUnknown exception")
