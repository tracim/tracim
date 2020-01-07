from tracim_backend.app_models.applications import Application
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimAppFactory


class ShareAppFactory(TracimAppFactory):
    def create_app(self, app_config: CFG) -> Application:
        return Application(
            label="Share Content",
            slug="share_content",
            fa_icon="share",
            is_active=True,
            config={},
            main_route="",
            app_config=app_config,
        )
