# -*- coding: utf-8 -*-
from urllib.parse import urlencode

import pytest
import responses

from tracim_backend.tests.fixtures import *  # noqa: F403,F40

# INFO - G.M - 30-03-2021 Opengraph protocol example,
# taken from https://en.wikipedia.org/wiki/Facebook_Platform#Open_Graph_protocol
simple_opengraph_html = """
<html>
<header>
<meta property="og:title" content="Example title of article">
<meta property="og:site_name" content="example.invalid website">
<meta property="og:type" content="article">
<meta property="og:url" content="http://example.invalid/example-title-of-article">
<meta property="og:image" content="http://example.invalid/article_thumbnail.jpg">
<meta property="og:image" content="http://example.invalid/website_logo.png">
<meta property="og:description" content="This example article is an example of OpenGraph protocol.">
</header>
<body>
</body>
</html>
"""

simple_opengraph_html_result_endpoint = {
    "title": "Example title of article",
    "description": "This example article is an example of OpenGraph protocol.",
    "image": "http://example.invalid/article_thumbnail.jpg",
}


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test"}], indirect=True,
)
class TestUrlPreview(object):
    @responses.activate
    @pytest.mark.parametrize(
        "link_name, link_content, endpoint_result",
        (
            pytest.param(
                "http://example.invalid/example-title-of-article",
                simple_opengraph_html,
                simple_opengraph_html_result_endpoint,
                id="simple link example",
            ),
        ),
    )
    def test_api__url_preview__ok_200__nominal_case(
        self, link_name, link_content, endpoint_result, web_testapp,
    ):
        responses.add(
            responses.GET,
            link_name,
            body=link_content,
            status=200,
            content_type="text/html",
            stream=True,
        )
        params = {"url": link_name}
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/url-preview?{params}".format(params=urlencode(params)), status=200,
        )
        assert res.json_body == endpoint_result

    @responses.activate
    @pytest.mark.parametrize(
        "link_name, link_content, endpoint_result",
        (
            pytest.param(
                "http://empty.invalid",
                "",
                {"title": None, "description": None, "image": None},
                id="empty page",
            ),
        ),
    )
    def test_api__url_preview__ok_200__no_preview(
        self, link_name, link_content, endpoint_result, web_testapp,
    ):
        responses.add(
            responses.GET,
            link_name,
            body=link_content,
            status=200,
            content_type="text/html",
            stream=True,
        )
        params = {"url": link_name}
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/url-preview?{params}".format(params=urlencode(params)), status=200,
        )
        assert res.json_body == endpoint_result

    @responses.activate
    def test_api__url_preview__err_502__do_not_exist(
        self, web_testapp,
    ):
        params = {"url": "http://thisurldoesnotexist.invalid"}
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.get(
            "/api/url-preview?{params}".format(params=urlencode(params)), status=502,
        )
