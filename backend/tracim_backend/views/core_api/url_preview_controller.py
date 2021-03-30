from pyramid.config import Configurator

from tracim_backend.extensions import hapic
from tracim_backend.lib.core.url_preview import URLPreview
from tracim_backend.lib.core.url_preview import URLPreviewLib
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import UrlPreviewSchema
from tracim_backend.views.core_api.schemas import UrlQuerySchema

SWAGGER_TAG_URL_PREVIEW_ENDPOINTS = "URL Preview"


class URLPreviewController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG_URL_PREVIEW_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_query(UrlQuerySchema())
    @hapic.output_body(UrlPreviewSchema())
    def url_preview(self, context, request: TracimRequest, hapic_data=None) -> URLPreview:
        """
        Get url Preview
        """
        url_preview_lib = URLPreviewLib(request.app_config)
        return url_preview_lib.get_preview(url=hapic_data.query.url)

    def bind(self, configurator: Configurator) -> None:
        configurator.add_route(
            "url_preview", "/url-preview", request_method="GET",  # noqa: W605
        )
        configurator.add_view(self.url_preview, route_name="url_preview")
