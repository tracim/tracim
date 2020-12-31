import pytest

from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_frontend_enabled"}], indirect=True
)
class TestFrontendEnabled(object):
    def test_api__check_index_html_generated__ok_200__nominal_case(self, web_testapp):
        res = web_testapp.get("/", status=200)
        assert res.content_type == "text/html"


class TestContentSecurityPolicy:
    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_frontend_enabled"}], indirect=True
    )
    def test_api__csp_header__ok_200__nominal_case(self, web_testapp) -> None:
        res = web_testapp.get("/", status=200)
        assert res.headers["Content-Security-Policy"]
        content_security_policy = res.headers["Content-Security-Policy"]
        directives = content_security_policy.split(";")
        assert any(("script-src 'nonce-" in d) for d in directives)

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_csp_disabled"}], indirect=True
    )
    def test_api__csp_header__ok_200__csp_disabled(self, web_testapp):
        res = web_testapp.get("/", status=200)
        assert not res.headers.get("Content-Security-Policy")

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_csp_report_only"}], indirect=True
    )
    def test_api__csp_header__ok_200__report_only(self, web_testapp):
        res = web_testapp.get("/", status=200)
        csp = res.headers.get("Content-Security-Policy-Report-Only")
        assert "report-uri https://some.uri" in csp
        assert res.headers.get("Report-To") == "https://some.uri"

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_csp_additional_directives"}], indirect=True
    )
    def test_api__csp_header__ok_200__additional_directives(self, web_testapp):
        res = web_testapp.get("/", status=200)
        csp = res.headers.get("Content-Security-Policy")
        assert csp.endswith("frame-ancestors 'none'")


@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestFrontendDisabled(object):
    def test_api__check_index_html_not_generated__err_404__nominal_case(self, web_testapp):
        web_testapp.get("/", status=404)
