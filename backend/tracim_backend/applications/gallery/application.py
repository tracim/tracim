from tracim_backend.app_models.applications import Application
from tracim_backend.config import CFG


def get_app(app_config: CFG) -> Application:
    # INFO - G.M - 2020-01-03 - Dummy backend app
    return Application(
        label="Gallery",
        slug="gallery",
        fa_icon="picture-o",
        is_active=True,
        config={},
        main_route="/ui/workspaces/{workspace_id}/gallery",
        app_config=app_config,
    )
