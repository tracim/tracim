from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class ContentHTMLDocumentApp(TracimApplication):
    def load_content_types(self) -> None:
        content_type = TracimContentType(
            slug="html-document",
            fa_icon=self.fa_icon,
            label="Text Document",
            creation_label="Write a document",
            available_statuses=content_status_list.get_all(),
            slug_aliases=["page"],
            allow_sub_content=False,
            file_extension=".document.html",
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
        from tracim_backend.applications.content_html_document.controller import (
            HTMLDocumentController,
        )

        html_document_controller = HTMLDocumentController()
        configurator.include(html_document_controller.bind, route_prefix=route_prefix)


def create_app() -> TracimApplication:
    return ContentHTMLDocumentApp(
        label="Text Documents",  # TODO - G.M - 24-05-2018 - Check label
        slug="contents/html-document",
        fa_icon="file-text-o",
        config={},
        main_route="/ui/workspaces/{workspace_id}/contents?type=html-document",
    )
