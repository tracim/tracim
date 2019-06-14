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
        # FIXME - G.M - 2019-06-12 - remove this hardcoded code when
        # index alias and index pattern template will be normals tracim parameters.
        # https://github.com/tracim/tracim/issues/1835
        print(
            parsed_args.template.format(
                config_name="SEARCH__ELASTICSEARCH__INDEX_ALIAS",
                config_file_name="N/A",
                env_var_name="TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS",
            )
        )
        print(
            parsed_args.template.format(
                config_name="SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE",
                config_file_name="N/A",
                env_var_name="TRACIM_SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE",
            )
        )
