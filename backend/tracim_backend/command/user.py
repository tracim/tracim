# -*- coding: utf-8 -*-
import argparse

import transaction
from pyramid.scripting import AppEnvironment
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.config import CFG
from tracim_backend.command import AppContextCommand
from tracim_backend.command import Extender
from tracim_backend.exceptions import BadCommandError
from tracim_backend.exceptions import GroupDoesNotExist
from tracim_backend.exceptions import \
    NotificationDisabledCantCreateUserWithInvitation
from tracim_backend.exceptions import NotificationSendingFailed
from tracim_backend.exceptions import UserAlreadyExistError
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.auth import Group
from tracim_backend.models.auth import User


class UserCommand(AppContextCommand):

    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'

    action = NotImplemented

    def get_description(self) -> str:
        return '''Create or update user.'''

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
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

        parser.add_argument(
            "--send-email",
            help='Send mail to user',
            dest='send_email',
            required=False,
            action='store_true',
            default=False,
        )

        return parser

    def _user_exist(self, login: str) -> User:
        return self._user_api.user_with_email_exists(login)

    def _get_group(self, name: str) -> Group:
        groups_availables = [group.group_name
                             for group in self._group_api.get_all()]
        if name not in groups_availables:
            msg = "Group '{}' does not exist, choose a group name in : ".format(name)  # nopep8
            for group in groups_availables:
                msg+= "'{}',".format(group)
            self._session.rollback()
            raise GroupDoesNotExist(msg)
        return self._group_api.get_one_with_name(name)

    def _add_user_to_named_group(
            self,
            user: str,
            group_name: str
    ) -> None:

        group = self._get_group(group_name)
        if user not in group.users:
            group.users.append(user)
        self._session.flush()

    def _remove_user_from_named_group(
            self,
            user: User,
            group_name: str
    ) -> None:
        group = self._get_group(group_name)
        if user in group.users:
            group.users.remove(user)
        self._session.flush()

    def _create_user(
            self,
            login: str,
            password: str,
            do_notify: bool,
            **kwargs
    ) -> User:
        if not password:
            if self._password_required():
                raise BadCommandError(
                    "You must provide -p/--password parameter"
                )
            password = ''
        if self._user_api.check_email_already_in_db(login):
            raise UserAlreadyExistError()
        try:
            user = self._user_api.create_user(
                email=login,
                password=password,
                do_save=True,
                do_notify=do_notify,
            )
            # TODO - G.M - 04-04-2018 - [Caldav] Check this code
            # # We need to enable radicale if it not already done
            # daemons = DaemonsManager()
            # daemons.run('radicale', RadicaleDaemon)
            self._user_api.execute_created_user_actions(user)
        except IntegrityError as exception:
            self._session.rollback()
            raise UserAlreadyExistError() from exception
        except (NotificationSendingFailed, NotificationDisabledCantCreateUserWithInvitation) as exception:
            self._session.rollback()
            raise exception from exception
        return user

    def _update_password_for_login(self, login: str, password: str) -> None:
        user = self._user_api.get_one_by_email(login)
        self._user_api._check_password_modification_allowed(user)
        user.password = password
        self._session.flush()
        transaction.commit()

    def take_app_action(
            self,
            parsed_args: argparse.Namespace,
            app_context: AppEnvironment
    ) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context['request'].dbsession
        self._app_config = app_context['registry'].settings['CFG']
        self._user_api = UserApi(
            current_user=None,
            session=self._session,
            config=self._app_config,
        )
        self._group_api = GroupApi(
            current_user=None,
            session=self._session,
            config=self._app_config,
        )
        user = self._proceed_user(parsed_args)
        self._proceed_groups(user, parsed_args)

        print("User created/updated")

    def _proceed_user(self, parsed_args: argparse.Namespace) -> User:
        self._check_context(parsed_args)

        if self.action == self.ACTION_CREATE:
            try:
                user = self._create_user(
                    login=parsed_args.login,
                    password=parsed_args.password,
                    do_notify=parsed_args.send_email,
                )
            except UserAlreadyExistError as exc:
                raise UserAlreadyExistError("Error: User already exist (use `user update` command instead)") from exc # nopep8
            except NotificationSendingFailed as exc:
                raise NotificationSendingFailed("Error: Cannot send email notification due to error, user not created.") from exc  # nopep8
            except NotificationDisabledCantCreateUserWithInvitation as exc:
                raise NotificationDisabledCantCreateUserWithInvitation("Error: Email notification disabled but notification required, user not created.") from exc  # nopep8
        else:
            if parsed_args.password:
                self._update_password_for_login(
                    login=parsed_args.login,
                    password=parsed_args.password
                )
            user = self._user_api.get_one_by_email(parsed_args.login)

        return user

    def _proceed_groups(
            self,
            user: User,
            parsed_args: argparse.Namespace
    ) -> None:
        # User always in "users" group
        self._add_user_to_named_group(user, 'users')

        for group_name in parsed_args.add_to_group:
            self._add_user_to_named_group(user, group_name)

        for group_name in parsed_args.remove_from_group:
            self._remove_user_from_named_group(user, group_name)

    def _password_required(self) -> bool:
        # TODO - G.M - 04-04-2018 - [LDAP] Check this code
        # if config.get('auth_type') == LDAPAuth.name:
        #     return False
        return True

    def _check_context(self, parsed_args: argparse.Namespace) -> None:
        # TODO - G.M - 04-04-2018 - [LDAP] Check this code
        # if config.get('auth_type') == LDAPAuth.name:
        #     auth_instance = config.get('auth_instance')
        #     if not auth_instance.ldap_auth.user_exist(parsed_args.login):
        #         raise LDAPUserUnknown(
        #             "LDAP is enabled and user with login/email \"%s\" not found in LDAP" % parsed_args.login
        #         )
        pass


class CreateUserCommand(UserCommand):
    action = UserCommand.ACTION_CREATE


class UpdateUserCommand(UserCommand):
    action = UserCommand.ACTION_UPDATE


class LDAPUserUnknown(BadCommandError):
    pass
