from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import ContentTypeSlug
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.lib.core.mention import DescriptionMentionParser
from tracim_backend.lib.core.mention import MentionBuilder
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class ContentLogbookEntryApp(TracimApplication):
    def load_content_types(self) -> None:
        content_type = TracimContentType(
            slug=ContentTypeSlug.LOGBOOK_ENTRY.value,
            fa_icon=self.fa_icon,
            label="Logbook entry",
            creation_label="Create a logbook entry",
            available_statuses=content_status_list.get_all(),
            slug_aliases=["entry"],
            file_extension=".logbook_entry",
            minimal_role_content_creation=WorkspaceRoles.CONTRIBUTOR,
            app=self,
        )
        self.content_types.append(content_type)
        MentionBuilder.register_content_type_parser(
            ContentTypeSlug.LOGBOOK_ENTRY.value, DescriptionMentionParser()
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
        # NOTE - M.L - 2024-02-21 - the LogbookEntry application requires content_file
        # As the frontend app relies on files API endpoints.
        pass


def create_app() -> TracimApplication:
    return ContentLogbookEntryApp(
        label="Logbook Entries",
        slug="contents/{}".format(ContentTypeSlug.LOGBOOK_ENTRY.value),
        fa_icon="fas fa-quote-left",
        config={},
        main_route="",
    )
