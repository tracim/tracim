# -*- coding: utf-8 -*-
from abc import ABC
import argparse
import typing

from marshmallow import ValidationError
from marshmallow.validate import Validator
from pyramid.scripting import AppEnvironment

from tracim_backend.app_models.validator import user_email_validator
from tracim_backend.app_models.validator import user_lang_validator
from tracim_backend.app_models.validator import user_password_validator
from tracim_backend.app_models.validator import user_profile_validator
from tracim_backend.app_models.validator import user_public_name_validator
from tracim_backend.app_models.validator import user_timezone_validator
from tracim_backend.app_models.validator import user_username_validator
from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import TracimException
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import UserCreationType


class ValidatorType:
    def __init__(self, validator: Validator):
        self.validator = validator

    def __call__(self, arg: typing.Any):
        try:
            self.validator(arg)
        except ValidationError as exc:
            raise argparse.ArgumentTypeError(
                "{error_messages}".format(error_messages=" - ".join(exc.messages))
            )
        return arg


class UserCommand(AppContextCommand, ABC):
    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:

        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-e",
            "--email",
            help="set the user's email address",
            dest="email",
            required=False,
            default=None,
            type=ValidatorType(user_email_validator),
        )
        parser.add_argument(
            "-u",
            "--username",
            help="set the user's username",
            dest="username",
            required=False,
            default=None,
            type=ValidatorType(user_username_validator),
        )
        parser.add_argument(
            "--public-name",
            help="set the user's public name",
            dest="public_name",
            required=False,
            default=None,
            type=ValidatorType(user_public_name_validator),
        )
        parser.add_argument(
            "--allowed_space",
            help="set thes user's allowed space in bytes",
            dest="allowed_space",
            required=False,
            default=None,
            type=int,
        )
        parser.add_argument(
            "--lang",
            help="set the user's language (ISO 639 format)",
            dest="lang",
            required=False,
            default=None,
            type=ValidatorType(user_lang_validator),
        )
        parser.add_argument(
            "-p",
            "--password",
            help="set the user's password",
            dest="password",
            required=False,
            default=None,
            type=ValidatorType(user_password_validator),
        )
        parser.add_argument(
            "--profile",
            help="set the user's profile. Valid values: {}".format(
                ", ".join(Profile.get_all_valid_slugs())
            ),
            dest="profile",
            default=None,
            type=ValidatorType(user_profile_validator),
        )
        parser.add_argument(
            "--timezone",
            help="set the user's timezone",
            dest="timezone",
            default=None,
            type=ValidatorType(user_timezone_validator),
        )
        return parser


class CreateUserCommand(UserCommand):
    def get_description(self) -> str:
        return """Create a new user account"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--send-email",
            help="send an email to the created user (you need to configure EMAIL-NOTIFICATION part in config file to use this feature)",
            dest="send_email",
            required=False,
            action="store_true",
            default=False,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        if parsed_args.send_email and not parsed_args.email:
            print("Warning: No email provided, can not send email to user.")
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self._user_api = UserApi(current_user=None, session=self._session, config=self._app_config)
        profile = None
        if parsed_args.profile:
            profile = Profile.get_profile_from_slug(parsed_args.profile)
        if not parsed_args.password and parsed_args.send_email:
            parsed_args.password = password_generator()
        try:
            user = self._user_api.create_user(
                email=parsed_args.email,
                name=parsed_args.public_name,
                password=parsed_args.password,
                username=parsed_args.username,
                timezone=parsed_args.timezone,
                lang=parsed_args.lang,
                allowed_space=parsed_args.allowed_space,
                profile=profile,
                creation_type=UserCreationType.CLI,
                do_save=True,
                do_notify=parsed_args.send_email,
            )
            self._user_api.execute_created_user_actions(user)
        except TracimException as exc:
            self._session.rollback()
            print("Error: " + str(exc))
            print("User not created.")
            raise exc
        print("User created")


class UpdateUserCommand(UserCommand):
    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-l",
            "--login",
            help="the user's login (either the email address or the username)",
            dest="login",
            required=True,
        )
        return parser

    def get_description(self) -> str:
        return """Edit the account of a user"""

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self._user_api = UserApi(current_user=None, session=self._session, config=self._app_config)
        user = self._user_api.get_one_by_login(parsed_args.login)
        profile = None
        if parsed_args.profile:
            profile = Profile.get_profile_from_slug(parsed_args.profile)
        try:
            user = self._user_api.update(
                user=user,
                email=parsed_args.email,
                name=parsed_args.public_name,
                password=parsed_args.password,
                timezone=parsed_args.timezone,
                username=parsed_args.username,
                allowed_space=parsed_args.allowed_space,
                profile=profile,
                do_save=True,
            )
            self._user_api.execute_created_user_actions(user)
        except TracimException as exc:
            self._session.rollback()
            print("Error: " + str(exc))
            print("User not updated.")
            raise exc
        print("User updated")
