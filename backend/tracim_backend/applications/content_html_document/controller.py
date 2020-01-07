from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.applications.content_html_document.html_document_controller import (
    HTMLDocumentController,
)
from tracim_backend.config import CFG


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str, context: PyramidContext
) -> Configurator:
    html_document_controller = HTMLDocumentController()
    configurator.include(html_document_controller.bind, route_prefix=route_prefix)
    return configurator
