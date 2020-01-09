from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_status_list
from tracim_backend.applications.content_thread.threads_controller import ThreadController
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication


class ContentThreadApp(TracimApplication):
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
        thread_controller = ThreadController()
        configurator.include(thread_controller.bind, route_prefix=route_prefix)


application = ContentThreadApp(
    label="Threads",
    slug="contents/thread",
    fa_icon="comments-o",
    is_active=True,
    config={},
    main_route="/ui/workspaces/{workspace_id}/contents?type=thread",
)
application.add_content_type(
    slug="thread",
    label="Thread",
    creation_label="Start a topic",
    available_statuses=content_status_list.get_all(),
    file_extension=".thread.html",
)
