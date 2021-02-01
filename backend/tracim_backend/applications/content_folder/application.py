from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class ContentFolderApp(TracimApplication):
    def load_content_types(self) -> None:
        content_type = TracimContentType(
            slug="folder",
            fa_icon=self.fa_icon,
            label="Folder",
            creation_label="Create a folder",
            available_statuses=content_status_list.get_all(),
            allow_sub_content=True,
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER,
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
        from tracim_backend.applications.content_folder.controller import FolderController

        folder_controller = FolderController()
        configurator.include(folder_controller.bind, route_prefix=route_prefix)


def create_app() -> TracimApplication:
    return ContentFolderApp(
        label="Folder",
        slug="contents/folder",
        fa_icon="far fa-folder",
        config={},
        main_route=""
    )
