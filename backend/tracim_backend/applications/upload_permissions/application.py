from tracim_backend.app_models.applications import Application
from tracim_backend.config import CFG


def get_app(app_config: CFG):
    return Application(
        label="Upload permission",
        slug="upload_permission",
        fa_icon="cloud-upload",
        is_active=True,
        config={},
        main_route="",
        app_config=app_config,
    )
