from time import sleep
from tracim.fixtures.ldap import ldap_test_server_fixtures
from gearbox.command import Command
from ldap_test import LdapServer


class LDAPTestServerCommand(Command):
    def take_action(self, parsed_args):
        # TODO - B.S. - 20160210: paramètre argv pour preciser les fixtures
        server = LdapServer(ldap_test_server_fixtures)
        print("Starting LDAP server on localhost (port %d)" % ldap_test_server_fixtures.get('port'))
        print("Press CTRL+C to stop it")
        server.start()
        try:
            while True:
                sleep(1)
        except KeyboardInterrupt:
            pass
