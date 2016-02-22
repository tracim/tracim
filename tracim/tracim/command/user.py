# -*- coding: utf-8 -*-
import transaction
from sqlalchemy.exc import IntegrityError
from tg import config

from tracim.command import AppContextCommand, Extender
from tracim.lib.auth.ldap import LDAPAuth
from tracim.lib.exception import AlreadyExistError, CommandAbortedError
from tracim.lib.group import GroupApi
from tracim.lib.user import UserApi
from tracim.model import DBSession, User


class UserCommand(AppContextCommand):

    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'

    action = NotImplemented

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._session = DBSession
        self._transaction = transaction
        self._user_api = UserApi(None)
        self._group_api = GroupApi(None)

    def get_description(self):
        return '''Create or update user.'''

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)

        parser.add_argument(
            "-l",
            "--login",
            help='User login (email)',
            dest='login',
            required=True
        )

        parser.add_argument(
            "-p",
            "--password",
            help='User password',
            dest='password',
            required=False,
            default=None
        )

        parser.add_argument(
            "-g",
            "--add-to-group",
            help='Add user to group',
            dest='add_to_group',
            nargs='*',
            action=Extender,
            default=[],
        )

        parser.add_argument(
            "-rmg",
            "--remove-from-group",
            help='Remove user from group',
            dest='remove_from_group',
            nargs='*',
            action=Extender,
            default=[],
        )

        return parser

    def _user_exist(self, login):
        return self._user_api.user_with_email_exists(login)

    def _get_group(self, name):
        return self._group_api.get_one_with_name(name)

    def _add_user_to_named_group(self, user, group_name):
        group = self._get_group(group_name)
        if user not in group.users:
            group.users.append(user)
        self._session.flush()

    def _remove_user_from_named_group(self, user, group_name):
        group = self._get_group(group_name)
        if user in group.users:
            group.users.remove(user)
        self._session.flush()

    def _create_user(self, login, password, **kwargs):
        if not password:
            if self._password_required():
                raise CommandAbortedError("You must provide -p/--password parameter")
            password = ''

        try:
            user = User(email=login, password=password, **kwargs)
            self._session.add(user)
            self._session.flush()
        except IntegrityError:
            self._session.rollback()
            raise AlreadyExistError()

        return user

    def _update_password_for_login(self, login, password):
        user = self._user_api.get_one_by_email(login)
        user.password = password
        self._session.flush()
        transaction.commit()

    def take_action(self, parsed_args):
        super().take_action(parsed_args)

        user = self._proceed_user(parsed_args)
        self._proceed_groups(user, parsed_args)

        print("User created/updated")

    def _proceed_user(self, parsed_args):
        self._check_context(parsed_args)

        if self.action == self.ACTION_CREATE:
            try:
                user = self._create_user(login=parsed_args.login, password=parsed_args.password)
            except AlreadyExistError:
                raise CommandAbortedError("Error: User already exist (use `user update` command instead)")
        else:
            if parsed_args.password:
                self._update_password_for_login(login=parsed_args.login, password=parsed_args.password)
            user = self._user_api.get_one_by_email(parsed_args.login)

        return user

    def _proceed_groups(self, user, parsed_args):
        # User always in "users" group
        self._add_user_to_named_group(user, 'users')

        for group_name in parsed_args.add_to_group:
            self._add_user_to_named_group(user, group_name)

        for group_name in parsed_args.remove_from_group:
            self._remove_user_from_named_group(user, group_name)

    def _password_required(self):
        if config.get('auth_type') == LDAPAuth.name:
            return False
        return True

    def _check_context(self, parsed_args):
        if config.get('auth_type') == LDAPAuth.name:
            auth_instance = config.get('auth_instance')
            if not auth_instance.ldap_auth.user_exist(parsed_args.login):
                raise LDAPUserUnknown(
                    "LDAP is enabled and user with login/email \"%s\" not found in LDAP" % parsed_args.login
                )


class CreateUserCommand(UserCommand):
    action = UserCommand.ACTION_CREATE


class UpdateUserCommand(UserCommand):
    action = UserCommand.ACTION_UPDATE


class LDAPUserUnknown(CommandAbortedError):
    pass
