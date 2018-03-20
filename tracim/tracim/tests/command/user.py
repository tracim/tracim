from nose.tools import eq_
from nose.tools import ok_

from tracim.command.user import CreateUserCommand, UpdateUserCommand
from tracim.model import DBSession, Group
from tracim.model.auth import User
from tracim.tests import TestCommand


class TestUserCommand(TestCommand):

    def test_create(self):
        self._create_user('new-user@algoo.fr', 'toor')
        # Check webdav digest exist for this user
        user = DBSession.query(User)\
            .filter(User.email == 'new-user@algoo.fr').one()

    def test_update_password(self):
        self._create_user('new-user@algoo.fr', 'toor')

        # Grab webdav digest
        user = DBSession.query(User) \
            .filter(User.email == 'new-user@algoo.fr').one()

        self._execute_command(
            UpdateUserCommand,
            'gearbox user update',
            ['-l', 'new-user@algoo.fr', '-p', 'new_password']
        )
        user = DBSession.query(User).filter(User.email == 'new-user@algoo.fr').one()
        ok_(user.validate_password('new_password'))

        # Grab new webdav digest to compare it
        user = DBSession.query(User) \
            .filter(User.email == 'new-user@algoo.fr').one()

    def test_create_with_group(self):
        more_args = ['--add-to-group', 'managers', '--add-to-group', 'administrators']
        self._create_user('new-user@algoo.fr', 'toor', more_args=more_args)
        user = DBSession.query(User).filter(User.email == 'new-user@algoo.fr').one()
        group_managers = DBSession.query(Group).filter(Group.group_name == 'managers').one()
        group_administrators = DBSession.query(Group).filter(Group.group_name == 'administrators').one()

        ok_(user in group_managers.users)
        ok_(user in group_administrators.users)

    def test_change_groups(self):
        # create an user in managers group
        more_args = ['--add-to-group', 'managers']
        self._create_user('new-user@algoo.fr', 'toor', more_args=more_args)
        user = DBSession.query(User).filter(User.email == 'new-user@algoo.fr').one()
        group_managers = DBSession.query(Group).filter(Group.group_name == 'managers').one()
        group_administrators = DBSession.query(Group).filter(Group.group_name == 'administrators').one()

        ok_(user in group_managers.users)
        ok_(user not in group_administrators.users)

        # Update him and add to administrators group
        add_to_admins_argvs = ['-l', 'new-user@algoo.fr', '--add-to-group', 'administrators']
        self._execute_command(UpdateUserCommand, 'gearbox user update', add_to_admins_argvs)
        user = DBSession.query(User).filter(User.email == 'new-user@algoo.fr').one()
        group_managers = DBSession.query(Group).filter(Group.group_name == 'managers').one()
        group_administrators = DBSession.query(Group).filter(Group.group_name == 'administrators').one()

        ok_(user in group_managers.users)
        ok_(user in group_administrators.users)

        # remove him from administrators group
        remove_from_admins_argvs = ['-l', 'new-user@algoo.fr', '--remove-from-group', 'administrators']
        self._execute_command(UpdateUserCommand, 'gearbox user update', remove_from_admins_argvs)
        user = DBSession.query(User).filter(User.email == 'new-user@algoo.fr').one()
        group_managers = DBSession.query(Group).filter(Group.group_name == 'managers').one()
        group_administrators = DBSession.query(Group).filter(Group.group_name == 'administrators').one()

        ok_(user in group_managers.users)
        ok_(user not in group_administrators.users)

    def _create_user(self, email, password, more_args=[]):
        args = ['-l', email, '-p', password]
        args.extend(more_args)

        self._check_user_exist(email, exist=False)
        self._execute_command(CreateUserCommand, 'gearbox user create', args)
        self._check_user_exist(email, exist=True)

        user = DBSession.query(User).filter(User.email == email).one()
        user.validate_password(password)

    @staticmethod
    def _check_user_exist(email, exist=True):
        eq_(exist, bool(DBSession.query(User).filter(User.email == email).count()))

