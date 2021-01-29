from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication


class GalleryApp(TracimApplication):
    def load_content_types(self) -> None:
        pass

    def load_config(self, app_config: CFG) -> None:
        pass

    def check_config(self, app_config: CFG) -> None:
        pass

    def load_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        # INFO - G.M - 2020-01-03 - Dummy backend app
        pass


def create_app() -> TracimApplication:
    return GalleryApp(
        label="Gallery",
        slug="gallery",
        fa_icon="picture",
        config={},
        main_route="/ui/workspaces/{workspace_id}/gallery",
    )
