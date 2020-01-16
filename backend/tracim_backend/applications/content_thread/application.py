from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class ContentThreadApp(TracimApplication):
    def load_content_types(self) -> None:
        content_type = TracimContentType(
            slug="thread",
            fa_icon=self.fa_icon,
            label="Thread",
            creation_label="Start a topic",
            available_statuses=content_status_list.get_all(),
            slug_aliases=["page"],
            allow_sub_content=False,
            file_extension=".thread.html",
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
        from tracim_backend.applications.content_thread.controller import ThreadController

        thread_controller = ThreadController()
        configurator.include(thread_controller.bind, route_prefix=route_prefix)


def create_app() -> TracimApplication:
    return ContentThreadApp(
        label="Threads",
        slug="contents/thread",
        fa_icon="comments-o",
        config={},
        main_route="/ui/workspaces/{workspace_id}/contents?type=thread",
    )
