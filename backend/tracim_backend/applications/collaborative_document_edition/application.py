from hapic.ext.pyramid import PyramidContext
from paste.deploy.converters import asbool
from pyramid.config import Configurator

from tracim_backend.app_models.applications import TracimApplicationInContext
from tracim_backend.applications.collaborative_document_edition.collaboration_document_edition_factory import (
    CollaborativeDocumentEditionFactory,
)
from tracim_backend.applications.collaborative_document_edition.data import (
    COLLABORA_DOCUMENT_EDITION_SLUG,
)
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.views import BASE_API_V2


class CollaborativeDocumentEditionApp(TracimApplication):
    def get_application_in_context(self, app_config: CFG) -> TracimApplicationInContext:
        return TracimApplicationInContext(app_config=app_config, app=self)

    def load_config(self, app_config: CFG) -> CFG:
        app_config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED = asbool(
            app_config.get_raw_config("collaborative_document_edition.activated", "false")
        )
        app_config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE = app_config.get_raw_config(
            "collaborative_document_edition.software"
        )
        app_config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL = app_config.get_raw_config(
            "collaborative_document_edition.collabora.base_url"
        )
        app_config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR = app_config.get_raw_config(
            "collaborative_document_edition.file_template_dir"
        )
        return app_config

    def check_config(self, app_config: CFG) -> CFG:
        if app_config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED:
            if (
                app_config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE
                == COLLABORA_DOCUMENT_EDITION_SLUG
            ):
                app_config.check_mandatory_param(
                    "COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL",
                    app_config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL,
                    when_str="if collabora feature is activated",
                )
        return app_config

    def import_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> Configurator:
        if app_config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED:
            # TODO - G.M - 2019-07-17 - check if possible to avoid this import here,
            # import is here because import WOPI of Collabora controller without adding it to
            # pyramid make trouble in hapic which try to get view related
            # to controller but failed.
            from tracim_backend.applications.collaborative_document_edition.wopi.controller import (
                WOPIController,
            )

            wopi_controller = WOPIController()
            configurator.include(wopi_controller.bind, route_prefix=BASE_API_V2)
            collaborative_document_edition_controller = CollaborativeDocumentEditionFactory().get_controller(
                app_config
            )
            configurator.include(
                collaborative_document_edition_controller.bind, route_prefix=BASE_API_V2
            )
        return configurator


application = CollaborativeDocumentEditionApp(
    label="Collaborative Document Edition",
    slug="collaborative_document_edition",
    fa_icon="file-o",
    is_active=True,
    config={},
    main_route="",
)
