from tracim_backend.app_models.applications import Application
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimAppFactory


class CollaborativeDocumentEditionAppFactory(TracimAppFactory):
    def create_app(self, app_config: CFG) -> Application:
        return Application(
            label="Collaborative Document Edition",
            slug="collaborative_document_edition",
            fa_icon="file-o",
            is_active=app_config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED,
            config={},
            main_route="",
            app_config=app_config,
        )
