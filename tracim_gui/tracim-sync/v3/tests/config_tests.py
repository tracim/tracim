# coding utf-8

import pytest
from ..config import ConfigParser
from ..tracim_sync_exceptions import ConfigException

# class ConfigTest(object):

#     def test__conf_no_db__err(self, conf_file_no_db):
#         with pytest.raises(ConfigException):
#             ConfigParser.load_config_from_file(conf_file_no_db)

#     def test__conf_no_base_folder__err(self, conf_file_no_folder):
#         with pytest.raises(ConfigException):
#             ConfigParser.load_config_from_file(conf_file_no_folder)

#     def test__conf_no_instances__err(self, conf_file_no_instances):
#         with pytest.raises(ConfigException):
#             ConfigParser.load_config_from_file(conf_file_no_instances)

#     def test__valid_conf__ok(self, valid_conf):
#         config = ConfigParser.load_config_from_file(valid_conf)
#         assert config.INSTANCES not in (None, '', {}, [])
#         assert config.DB_PATH not in ('', None)
#         assert config.BASE_FOLDER not in ('', None)

