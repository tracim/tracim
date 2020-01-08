from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication


class GalleryApp(TracimApplication):
    def load_config(self, app_config: CFG) -> CFG:
        return app_config

    def check_config(self, app_config: CFG) -> CFG:
        return app_config

    def import_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> Configurator:
        # INFO - G.M - 2020-01-03 - Dummy backend app
        return configurator


application = GalleryApp(
    label="Gallery",
    slug="gallery",
    fa_icon="picture-o",
    is_active=True,
    config={},
    main_route="/ui/workspaces/{workspace_id}/gallery",
)
