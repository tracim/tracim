import pytest

from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.parametrize("config_section", ["functional_test_frontend_enabled"])
class TestFrontendEnabled(object):
    config_section = "functional_test_frontend_enabled"

    def test_api__check_index_html_generated__ok_200__nominal_case(self, web_testapp):
        res = web_testapp.get("/", status=200)
        assert res.content_type == "text/html"


@pytest.mark.parametrize("config_section", ["functional_test"])
class TestFrontendDisabled(object):
    def test_api__check_index_html_generated__ok_200__nominal_case(self, web_testapp):
        web_testapp.get("/", status=404)
