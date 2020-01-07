from tracim_backend.app_models.applications import Application
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimAppFactory


class GalleryAppFactory(TracimAppFactory):
    def create_app(self, app_config: CFG) -> Application:
        return Application(
            label="Gallery",
            slug="gallery",
            fa_icon="picture-o",
            is_active=True,
            config={},
            main_route="/ui/workspaces/{workspace_id}/gallery",
            app_config=app_config,
        )
