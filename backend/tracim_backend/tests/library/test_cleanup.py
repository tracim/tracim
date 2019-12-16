import pytest

from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.lib.core.user import UserApi
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestCleanupLib(object):
    def test_unit__anonymise_user__ok__nominal_case(self, session, app_config) -> None:
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.display_name == "bob"
        assert u.email == "bob@bob"
        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.anonymise_user(u)
        assert u.display_name == "Lost Meerkat"
        assert u.email.endswith("@anonymous.local")

    def test_unit__anonymise_user__ok__explicit_name(self, session, app_config) -> None:
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.display_name == "bob"
        assert u.email == "bob@bob"
        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.anonymise_user(u, anonymised_user_display_name="anonymous")
        assert u.display_name == "anonymous"
        assert u.email.endswith("@anonymous.local")
