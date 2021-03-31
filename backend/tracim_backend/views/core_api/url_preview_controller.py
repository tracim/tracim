from http import HTTPStatus

from beaker.cache import cache_region
from pyramid.config import Configurator
from webpreview import WebpreviewException

from tracim_backend.extensions import hapic
from tracim_backend.lib.core.url_preview import URLPreview
from tracim_backend.lib.core.url_preview import URLPreviewLib
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import UrlPreviewSchema
from tracim_backend.views.core_api.schemas import UrlQuerySchema

SWAGGER_TAG_URL_PREVIEW_ENDPOINTS = "URL Preview"


class URLPreviewController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG_URL_PREVIEW_ENDPOINTS])
    @check_right(is_user)
    @hapic.handle_exception(WebpreviewException, HTTPStatus.BAD_GATEWAY)
    @hapic.input_query(UrlQuerySchema())
    @hapic.output_body(UrlPreviewSchema())
    def url_preview(self, context, request: TracimRequest, hapic_data=None) -> URLPreview:
        """
        Get url Preview
        """
        url_preview_lib = URLPreviewLib(request.app_config)

        @cache_region("url_preview")
        def get_cached_preview(url: str):
            logger.debug(self, "getting url preview of {}".format(url))
            return url_preview_lib.get_preview(url=url)

        return get_cached_preview(hapic_data.query.url)

    def bind(self, configurator: Configurator) -> None:
        configurator.add_route(
            "url_preview", "/url-preview", request_method="GET",  # noqa: W605
        )
        configurator.add_view(self.url_preview, route_name="url_preview")
