# coding: utf-8
import logging
import typing
import os
from configparser import ConfigParser

from radicale.config import load as load_radicale_config
from tracim_backend.config import CFG
from tracim_backend.lib.utils.logger import logger
from tracim_backend.exceptions import ConfigurationError

RADICALE_MAIN_SECTION = 'caldav'
RADICALE_SUBMAIN_SECTION = 'radicale'

class CaldavAppFactory(object):

    def __init__(self, **settings):
        logger.info(self, 'Add additional radicale config')
        self.radicale_config = load_radicale_config(())
        self.radicale_config = self._parse_additional_radicale_config(self.radicale_config, settings)
        self.app_config = CFG(settings)
        self.create_dir_tree(self.radicale_config, self.app_config)

    def create_dir_tree(self, radicale_config: ConfigParser, app_config: CFG):
        # FIXME - G.M - 2019-03-08 - create dir tree if not exist in order
        # to allow item creation without trouble in radicale
        storage_path = radicale_config.get('storage', 'filesystem_folder')
        sub_dir_storage_path = os.path.join(storage_path, 'collection-root')
        parent_folder = os.path.dirname(storage_path)
        if os.path.isdir(parent_folder):
            if not os.path.isdir(storage_path):
                os.mkdir(storage_path)
            if not os.path.isdir(sub_dir_storage_path):
                os.mkdir(sub_dir_storage_path)
            calendar_dir = os.path.join(sub_dir_storage_path, app_config.CALDAV_RADICALE_CALENDAR_DIR)
            if not os.path.isdir(calendar_dir):
                os.mkdir(calendar_dir)
            user_dir = os.path.join(sub_dir_storage_path, app_config.CALDAV_RADICALE_CALENDAR_DIR, app_config.CALDAV_RADICALE_USER_SUBDIR)
            if not os.path.isdir(user_dir):
                os.mkdir(user_dir)
            workspace_dir = os.path.join(sub_dir_storage_path, app_config.CALDAV_RADICALE_CALENDAR_DIR, app_config.CALDAV_RADICALE_WORKSPACE_SUBDIR)
            if not os.path.isdir(workspace_dir):
                os.mkdir(workspace_dir)
        else:
            raise ConfigurationError("{} is not a correct folder, can't set properly storage folder of radicale", parent_folder)


    def _sliced_dict(self, data: typing.Dict[str, any], beginning_key_string: str):
        """
        Get dict of all item beginning with beginning_key_string
        :param data:
        :param beginning_key_string:
        :return:
        """
        return {
            key: value for key, value in data.items()
            if key.startswith(beginning_key_string)
        }

    def _parse_additional_radicale_config(
            self,
            config: ConfigParser,
            settings: dict
    ) -> ConfigParser:
        """
        Add settings params beginning with
        "RADICALE_MAIN_SECTION.RADICALE_SUBMAIN_SECTION." to radicale config.
        """
        radicales_params = self._sliced_dict(
            data=settings,
            beginning_key_string='{}.{}.'.format(
                RADICALE_MAIN_SECTION,
                RADICALE_SUBMAIN_SECTION
                )
        )
        for param_name, value in radicales_params.items():
            param_name_elems = param_name.split('.')
            assert len(param_name_elems) == 4
            main_section, sub_main_section, radicale_section, radicale_param_config = param_name.split('.')
            assert main_section == 'caldav'
            assert sub_main_section == 'radicale'
            if not config.has_section(radicale_section):
                config.add_section(radicale_section)
            logger.debug(self, 'Override radicale config: {} : {}'.format(
                param_name,
                value
            ))
            config.set(radicale_section, radicale_param_config, value)
        return config

    def get_wsgi_app(self):
        logger = logging.getLogger('radicale')

        from radicale import Application as RadicaleApplication
        return RadicaleApplication(self.radicale_config, logger)
