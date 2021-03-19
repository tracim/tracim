from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class ContentFileApp(TracimApplication):
    def load_content_types(self) -> None:
        content_type = TracimContentType(
            slug="file",
            fa_icon=self.fa_icon,
            label="File",
            creation_label="Upload files",
            available_statuses=content_status_list.get_all(),
            minimal_role_content_creation=WorkspaceRoles.CONTRIBUTOR,
            app=self,
        )
        self.content_types.append(content_type)

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
        from tracim_backend.applications.content_file.controller import FileController

        file_controller = FileController()
        configurator.include(file_controller.bind, route_prefix=route_prefix)


def create_app() -> TracimApplication:
    return ContentFileApp(
        label="Files", slug="contents/file", fa_icon="fas fa-paperclip", config={}, main_route="",
    )
