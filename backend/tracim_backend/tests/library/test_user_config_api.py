import pytest

from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userconfig import UserConfigApi
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestConfigApi:
    def test__user_config_access_after_user_creation(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob", save_now=True)
        uapiconfig = UserConfigApi(session=session, current_user=u)
        assert uapiconfig.get_all_params() == {}

    def test__user_config_add_parameters(self, session, app_config):
        """
        PATCH style mecanism, you can add parameters, but you are unable to remove parameters
        """
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob", save_now=True)
        uapiconfig = UserConfigApi(session=session, current_user=u)
        uapiconfig.set_params({"param1": 1, "param2": "two"})
        assert uapiconfig.get_all_params() == {"param1": 1, "param2": "two"}
        uapiconfig.set_params({"param2": 2, "param3": "hello"})
        assert uapiconfig.get_all_params() == {"param1": 1, "param2": 2, "param3": "hello"}
