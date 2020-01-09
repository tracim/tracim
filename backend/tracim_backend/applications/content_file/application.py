from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_status_list
from tracim_backend.applications.content_file.file_controller import FileController
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication


class ContentFileApp(TracimApplication):
    def load_content_types(self) -> None:
        self.add_content_type(
            slug="file",
            label="File",
            creation_label="Upload a file",
            available_statuses=content_status_list.get_all(),
        )

    def load_config(self, app_config: CFG) -> None:
        pass

    def check_config(self, app_config: CFG) -> None:
        pass

    def import_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        file_controller = FileController()
        configurator.include(file_controller.bind, route_prefix=route_prefix)


application = ContentFileApp(
    label="Files",
    slug="contents/file",
    fa_icon="paperclip",
    is_active=True,
    config={},
    main_route="/ui/workspaces/{workspace_id}/contents?type=file",
)
