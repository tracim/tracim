from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class ContentKanbanApp(TracimApplication):
    def load_content_types(self) -> None:
        self.content_types.append(
            TracimContentType(
                slug="kanban",
                fa_icon=self.fa_icon,
                label="Kanban",
                creation_label="Create a Kanban board",
                available_statuses=content_status_list.get_all(),
                minimal_role_content_creation=WorkspaceRoles.CONTRIBUTOR,
                file_extension=".kanban",
                app=self,
            )
        )

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
        # NOTE - S.G - 2021-11-22 - the kanban application requires content_file
        # As the frontend app relies of files API endpoints.
        pass


def create_app() -> TracimApplication:
    return ContentKanbanApp(
        label="Kanban boards",
        slug="contents/kanban",
        fa_icon="fas fa-columns",
        config={},
        main_route="",
    )
