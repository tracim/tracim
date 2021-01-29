from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import THREAD_TYPE
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.lib.core.mention import DescriptionMentionParser
from tracim_backend.lib.core.mention import MentionBuilder
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class ContentThreadApp(TracimApplication):
    def load_content_types(self) -> None:
        content_type = TracimContentType(
            slug=THREAD_TYPE,
            fa_icon=self.fa_icon,
            label="Thread",
            creation_label="Start a topic",
            available_statuses=content_status_list.get_all(),
            allow_sub_content=False,
            file_extension=".thread.html",
            minimal_role_content_creation=WorkspaceRoles.CONTRIBUTOR,
            app=self,
        )
        self.content_types.append(content_type)
        MentionBuilder.register_content_type_parser(THREAD_TYPE, DescriptionMentionParser())

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
        slug="contents/{}".format(THREAD_TYPE),
        fa_icon="comments",
        config={},
        main_route="",
    )
