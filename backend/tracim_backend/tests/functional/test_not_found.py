import pytest

from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestNotFound(object):
    def test_api__test_not_found_case__nominal_case(self, web_testapp):
        res = web_testapp.get("/api/system/this_endpoint_does_not_exist", status=404)
        assert res.content_type == "application/json"
        assert res.json_body["code"] == 9999
