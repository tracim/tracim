import pytest

from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_frontend_enabled"}], indirect=True
)
class TestFrontendEnabled(object):
    config_section = "functional_test_frontend_enabled"

    def test_api__check_index_html_generated__ok_200__nominal_case(self, web_testapp):
        res = web_testapp.get("/", status=200)
        assert res.content_type == "text/html"


@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestFrontendDisabled(object):
    def test_api__check_index_html_generated__ok_200__nominal_case(self, web_testapp):
        web_testapp.get("/", status=404)
