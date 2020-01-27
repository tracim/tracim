import argparse

from pyramid.scripting import AppEnvironment

from tracim_backend.command import AppContextCommand
from tracim_backend.config import CFG


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
        for config in self._app_config.config_naming:
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
            required=True,
        )
        parser.add_argument(
            "--template",
            help="template used for parameters value print, not compatible with raw mode",
            dest="template",
            required=False,
            default="|{config_name: <30}| {value: <50}|",
        )
        parser.add_argument(
            "-r",
            "--raw-mode",
            help="return only parameter name",
            dest="raw",
            default=False,
            action="store_true",
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]  # type: CFG
        for config in self._app_config.config_naming:
            if parsed_args.parameter_name in [
                config.config_name,
                config.config_file_name,
                config.env_var_name,
            ]:
                config_value = str(getattr(self._app_config, config.config_name))
                if parsed_args.raw:
                    print(config_value, end="")
                else:
                    print(parsed_args.template.format(config_name="<config_name>", value="<value>"))
                    print(
                        parsed_args.template.format(
                            config_name=config.config_name, value=config_value
                        )
                    )
