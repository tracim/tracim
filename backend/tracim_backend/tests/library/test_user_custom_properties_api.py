import pytest

from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.user_custom_properties import UserCustomPropertiesApi
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestUserCustomPropertiesApi:
    def test__user_custom_properties_access_after_user_creation(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob", save_now=True)
        uapiconfig = UserCustomPropertiesApi(session=session, current_user=u)
        assert uapiconfig.get_all_params() == {}

    def test__user_custom_properties_add_parameters(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob", save_now=True)
        uapiconfig = UserCustomPropertiesApi(session=session, current_user=u)
        uapiconfig.set_params({"param1": 1, "param2": "two"})
        assert uapiconfig.get_all_params() == {"param1": 1, "param2": "two"}
        uapiconfig.set_params({"param2": 2, "param3": "hello"})
        assert uapiconfig.get_all_params() == {"param1": 1, "param2": 2, "param3": "hello"}
