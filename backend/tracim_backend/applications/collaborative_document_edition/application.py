import typing

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.applications.collaborative_document_edition.data import (
    COLLABORA_DOCUMENT_EDITION_SLUG,
)
from tracim_backend.applications.collaborative_document_edition.factory import (
    CollaborativeDocumentEditionFactory,
)
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.views import BASE_API


class CollaborativeDocumentEditionApp(TracimApplication):
    def load_content_types(self) -> None:
        pass

    def load_config(self, app_config: CFG) -> None:
        app_config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE = app_config.get_raw_config(
            "collaborative_document_edition.software"
        )
        app_config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL = app_config.get_raw_config(
            "collaborative_document_edition.collabora.base_url"
        )
        default_file_template_dir = app_config.here_macro_replace(
            "%(here)s/tracim_backend/templates/open_documents"
        )
        app_config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR = app_config.get_raw_config(
            "collaborative_document_edition.file_template_dir", default_file_template_dir
        )

    def check_config(self, app_config: CFG) -> None:
        if app_config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE == COLLABORA_DOCUMENT_EDITION_SLUG:
            app_config.check_mandatory_param(
                "COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL",
                app_config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL,
                when_str="if collabora feature is activated",
            )

    def load_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        # TODO - G.M - 2019-07-17 - check if possible to avoid this import here,
        # import is here because import WOPI of Collabora controller without adding it to
        # pyramid make trouble in hapic which try to get view related
        # to controller but failed.
        from tracim_backend.applications.collaborative_document_edition.wopi.controller import (
            WOPIController,
        )

        wopi_controller = WOPIController()
        configurator.include(wopi_controller.bind, route_prefix=BASE_API)
        collaborative_document_edition_controller = CollaborativeDocumentEditionFactory().get_controller(
            app_config
        )
        configurator.include(collaborative_document_edition_controller.bind, route_prefix=BASE_API)

    def get_content_security_policy_directives(
        self, app_config: CFG
    ) -> typing.Tuple[typing.Tuple[str, str], ...]:
        return (("frame-src", app_config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL),)


def create_app() -> TracimApplication:
    return CollaborativeDocumentEditionApp(
        label="Collaborative Document Edition",
        slug="collaborative_document_edition",
        fa_icon="file-o",
        config={},
        main_route="",
    )
