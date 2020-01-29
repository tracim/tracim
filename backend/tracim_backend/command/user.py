# -*- coding: utf-8 -*-
import argparse

from pyramid.scripting import AppEnvironment
from sqlalchemy.exc import IntegrityError
import transaction

from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import BadCommandError
from tracim_backend.exceptions import NotificationDisabledCantCreateUserWithInvitation
from tracim_backend.exceptions import NotificationSendingFailed
from tracim_backend.exceptions import UserAlreadyExistError
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User


class UserCommand(AppContextCommand):

    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"

    action = NotImplemented

    def get_description(self) -> str:
        return """Create or update user."""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)

        parser.add_argument("-l", "--login", help="User login (email)", dest="login", required=True)

        parser.add_argument(
            "-p", "--password", help="User password", dest="password", required=False, default=None
        )

        parser.add_argument("--profile", help="set user profile", dest="profile", default=None)

        parser.add_argument(
            "--send-email",
            help="Send mail to user",
            dest="send_email",
            required=False,
            action="store_true",
            default=False,
        )

        return parser

    def _user_exist(self, login: str) -> User:
        return self._user_api.user_with_email_exists(login)

    def _create_user(self, login: str, password: str, do_notify: bool, **kwargs) -> User:
        if not password:
            if self._password_required():
                print("You must provide -p/--password parameter")
                raise BadCommandError("You must provide -p/--password parameter")
            password = ""
        if self._user_api.check_email_already_in_db(login):
            raise UserAlreadyExistError()
        try:
            user = self._user_api.create_user(
                email=login, password=password, do_save=True, do_notify=do_notify
            )
            # TODO - G.M - 04-04-2018 - [Caldav] Check this code
            # # We need to enable radicale if it not already done
            # daemons = DaemonsManager()
            # daemons.run('radicale', RadicaleDaemon)
            self._user_api.execute_created_user_actions(user)
        except IntegrityError as exception:
            self._session.rollback()
            raise UserAlreadyExistError() from exception
        except (
            NotificationSendingFailed,
            NotificationDisabledCantCreateUserWithInvitation,
        ) as exception:
            self._session.rollback()
            raise exception from exception
        return user

    def _update_password_for_login(self, login: str, password: str) -> None:
        user = self._user_api.get_one_by_email(login)
        self._user_api._check_password_modification_allowed(user)
        user.password = password
        self._session.flush()
        transaction.commit()

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self._user_api = UserApi(current_user=None, session=self._session, config=self._app_config)
        user = self._proceed_user(parsed_args)
        if parsed_args.profile:
            user.profile = Profile.get_profile_from_slug(parsed_args.profile)

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
                print("Error: User already exist (use `user update` command instead)")
                raise UserAlreadyExistError() from exc
            except NotificationSendingFailed as exc:
                print("Error: Cannot send email notification due to error, user not created.")
                raise NotificationSendingFailed() from exc
            except NotificationDisabledCantCreateUserWithInvitation as exc:
                print(
                    "Error: Email notification disabled but notification required, user not created."
                )
                raise NotificationDisabledCantCreateUserWithInvitation() from exc
        else:
            if parsed_args.password:
                self._update_password_for_login(
                    login=parsed_args.login, password=parsed_args.password
                )
            user = self._user_api.get_one_by_email(parsed_args.login)

        return user

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
