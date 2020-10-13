import pytest

from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestNotFound(object):
    def test_api__test_not_found_case__nominal_case(self, web_testapp):
        web_testapp.get("/api/this_endpoint_does_not_exist", status=404)
