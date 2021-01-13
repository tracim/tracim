import pytest

from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.user_custom_properties import UserCustomPropertiesApi
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestUserCustomPropertiesApi:
    def test__user_custom_properties_access_after_user_creation(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob", save_now=True)
        custom_properties_api = UserCustomPropertiesApi(
            session=session, current_user=u, app_config=app_config
        )
        assert custom_properties_api.get_all_params() == {}

    def test__user_custom_properties_add_parameters(self, session, app_config):
        """
        PUT style mecanism, you remplace all the parameters visible by the user
        """
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob", save_now=True)
        custom_properties_api = UserCustomPropertiesApi(
            session=session, current_user=u, app_config=app_config
        )
        custom_properties_api.set_params({"param1": 1, "param2": "two"})
        assert custom_properties_api.get_all_params() == {"param1": 1, "param2": "two"}
        custom_properties_api.set_params({"param2": 2, "param3": "hello"})
        assert custom_properties_api.get_all_params() == {"param2": 2, "param3": "hello"}
