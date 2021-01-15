import argparse
import json

from pyramid.scripting import AppEnvironment

from tracim_backend.command import AppContextCommand
from tracim_backend.config import CFG
from tracim_backend.config import ConfigParam
from tracim_backend.lib.core.live_messages import LiveMessagesLib
from tracim_backend.lib.core.user_custom_properties import UserCustomPropertiesApi


class ParametersListCommand(AppContextCommand):
    def get_description(self) -> str:
        return (
            "list of all parameters available for tracim (in DEFAULT section of config file) excluding"
            "radicale config"
        )

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--template",
            help="template used for parameters list print",
            dest="template",
            required=False,
            default="|{env_var_name: <30}|{config_file_name: <30}|{config_name: <30}|",
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]  # type: CFG
        print(
            parsed_args.template.format(
                config_name="<config_name>",
                config_file_name="<config_file_name>",
                env_var_name="<env_var_name>",
            )
        )
        for config in self._app_config.config_info:
            print(
                parsed_args.template.format(
                    config_name=config.config_name,
                    config_file_name=config.config_file_name,
                    env_var_name=config.env_var_name,
                )
            )


class ParametersValueCommand(AppContextCommand):
    def get_description(self) -> str:
        return "get applied value of parameter with current context"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-n",
            "--name",
            help="parameter name: env_var_name,config_file_name and config_name syntax allowed",
            dest="parameter_name",
            required=False,
        )
        parser.add_argument(
            "--template",
            help="template used for parameters value print, not compatible with raw mode",
            dest="template",
            required=False,
            default="|{config_name: <30}| {config_value: <50}|",
        )
        parser.add_argument(
            "-r",
            "--raw-mode",
            help="return only parameter name",
            dest="raw",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-f",
            "--full-information_mode",
            help="return most information possible, replace default template",
            dest="full",
            default=False,
            action="store_true",
        )

        parser.add_argument(
            "--show-deprecated",
            help="return also deprecated parameters",
            dest="show_deprecated",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "--show-secret",
            help="return secret value",
            dest="show_secret",
            default=False,
            action="store_true",
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]  # type: CFG
        if parsed_args.full:
            parsed_args.template = "|{config_name}|{config_value}|{default_value}|{secret}|{config_source}|{config_file_name}|{config_file_value}|{config_env_var_name}|{config_env_var_value}|{deprecated}|"
        if not parsed_args.raw:
            print(
                parsed_args.template.format(
                    config_name="<config_name>",
                    config_value="<config_value>",
                    default_value="<default_value>",
                    secret="<secret>",
                    config_source="<config_source>",
                    config_file_name="<config_file_name>",
                    config_file_value="<config_file_value>",
                    config_env_var_name="<config_env_var_name>",
                    config_env_var_value="<config_env_var_value>",
                    deprecated="<deprecated>",
                )
            )
        for config_param in self._app_config.config_info:
            # INFO - G.M - 2020-04-17 - filter deprecated parameters
            if config_param.deprecated and not parsed_args.show_deprecated:
                continue
            if parsed_args.show_secret:
                config_param.show_secret = True
            if parsed_args.parameter_name:
                if parsed_args.parameter_name in [
                    config_param.config_name,
                    config_param.config_file_name,
                    config_param.env_var_name,
                ]:
                    self.print_config_parameter(config_param=config_param, parsed_args=parsed_args)
            else:
                self.print_config_parameter(config_param=config_param, parsed_args=parsed_args)

    def print_config_parameter(self, parsed_args: argparse.Namespace, config_param: ConfigParam):
        if parsed_args.raw:
            print(config_param.config_value, end="")
        else:
            print(
                parsed_args.template.format(
                    config_name=config_param.config_name,
                    config_value=str(config_param.config_value),
                    default_value=str(config_param.default_value),
                    secret=str(config_param.secret),
                    config_source=config_param.config_source,
                    config_file_name=config_param.config_file_name,
                    config_file_value=str(config_param.config_file_value),
                    config_env_var_name=config_param.env_var_name,
                    config_env_var_value=str(config_param.env_var_value),
                    deprecated=config_param.deprecated,
                )
            )


class LiveMessageTesterCommand(AppContextCommand):
    def get_description(self) -> str:
        return "send test live messages for testing"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-u", "--user_id", help="id of the user to test", dest="user_id", required=True,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]  # type: CFG
        live_messages_lib = LiveMessagesLib(self._app_config)
        # TODO - G.M - 07-05-2020 - Should be a real tracim_message instead of dict
        test_message = {
            "event_id": -1,
            "event_type": "test",
        }
        live_messages_lib.publish_dict(
            "user_{}".format(parsed_args.user_id), message_as_dict=test_message
        )
        print("test message (id=-1) send to user {}".format(parsed_args.user_id))


class ExtractCustomPropertiesTranslationsCommand(AppContextCommand):
    """
    Tool to generate a json usable as template for translation of loaded user custom properties
    """

    def get_description(self) -> str:
        return "create translation template for user custom properties"

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]  # type: CFG
        custom_properties_api = UserCustomPropertiesApi(
            current_user=None, app_config=self._app_config, session=self._session
        )
        print(json.dumps(custom_properties_api.get_translation_template()))
