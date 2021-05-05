from hapic.ext.pyramid import PyramidContext
from mock import Mock
from pyramid.config import Configurator
import pytest

from tracim_backend import CFG
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.app_models.workspace_menu_entries import all_content_menu_entry
from tracim_backend.app_models.workspace_menu_entries import dashboard_menu_entry
from tracim_backend.app_models.workspace_menu_entries import publication_menu_entry
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class DummyApp(TracimApplication):
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
        pass

    def load_content_types(self) -> None:
        pass


class TestApplicationApi(object):
    def test_get_default_workspace_menu_entry__ok__nominal_case(self):
        """
        Show only enabled app
        """
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"

        thread = DummyApp(
            label="Threads", slug="contents/thread", fa_icon="comments-o", config={}, main_route="",
        )
        content_type = TracimContentType(
            slug="thread",
            fa_icon=thread.fa_icon,
            label="Thread",
            creation_label="Start a topic",
            available_statuses=content_status_list.get_all(),
            slug_aliases=["page"],
            file_extension=".thread.html",
            minimal_role_content_creation=WorkspaceRoles.CONTRIBUTOR,
            app=thread,
        )
        thread.content_types.append(content_type)

        markdownpluspage = DummyApp(
            label="Markdown Plus Documents",
            # TODO - G.M - 24-05-2018 - Check label
            slug="contents/markdownpluspage",
            fa_icon="file-code-o",
            config={},
            main_route="",
        )
        content_type = TracimContentType(
            slug="markdownpage",
            fa_icon=thread.fa_icon,
            label="Rich Markdown File",
            creation_label="Create a Markdown document",
            available_statuses=content_status_list.get_all(),
            file_extension=".md",
            minimal_role_content_creation=WorkspaceRoles.CONTRIBUTOR,
            app=thread,
        )
        markdownpluspage.content_types.append(content_type)
        thread.is_active = True
        markdownpluspage.is_active = False
        app_api = ApplicationApi(app_list=[thread, markdownpluspage], show_inactive=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.agenda_enabled = True
        default_workspace_menu_entry = app_api.get_default_workspace_menu_entry(
            workspace=workspace, app_config=app_config
        )
        assert len(default_workspace_menu_entry) == 3
        assert default_workspace_menu_entry[0].label == dashboard_menu_entry.label
        assert default_workspace_menu_entry[1].label == publication_menu_entry.label
        assert default_workspace_menu_entry[2].label == all_content_menu_entry.label

    def test_get_default_workspace_menu_entry__ok__folder_case(self):
        """
        main route for folder is empty, that why it should not be included
        in default_menu entry
        :return:
        """
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"

        folder = DummyApp(
            label="Folder", slug="contents/folder", fa_icon="folder-o", config={}, main_route=""
        )
        content_type = TracimContentType(
            slug="folder",
            fa_icon=folder.fa_icon,
            label="Folder",
            creation_label="Create a folder",
            available_statuses=content_status_list.get_all(),
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER,
            app=folder,
        )
        folder.content_types.append(content_type)
        folder.is_active = True
        app_api = ApplicationApi(app_list=[folder], show_inactive=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.agenda_enabled = True
        default_workspace_menu_entry = app_api.get_default_workspace_menu_entry(
            workspace=workspace, app_config=app_config
        )
        assert len(default_workspace_menu_entry) == 3
        assert default_workspace_menu_entry[0].label == dashboard_menu_entry.label
        assert default_workspace_menu_entry[1].label == publication_menu_entry.label
        assert default_workspace_menu_entry[2].label == all_content_menu_entry.label

    def test_get_default_workspace_menu_entry__ok__agenda_enabled_workspace_case(self):
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"

        agenda = DummyApp(
            label="Agenda",
            slug="agenda",
            fa_icon="calendar",
            config={},
            main_route="/ui/workspaces/{workspace_id}/agenda",
        )
        agenda.is_active = True
        app_api = ApplicationApi(app_list=[agenda], show_inactive=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.agenda_enabled = True
        default_workspace_menu_entry = app_api.get_default_workspace_menu_entry(
            workspace=workspace, app_config=app_config
        )
        assert len(default_workspace_menu_entry) == 4
        assert default_workspace_menu_entry[0].label == dashboard_menu_entry.label
        assert default_workspace_menu_entry[1].label == publication_menu_entry.label
        assert default_workspace_menu_entry[2].label == all_content_menu_entry.label
        assert default_workspace_menu_entry[3].label == agenda.label

    def test_get_default_workspace_menu_entry__ok__agenda_disabled_workspace_case(self):
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"

        agenda = DummyApp(
            label="Agenda",
            slug="agenda",
            fa_icon="calendar",
            config={},
            main_route="/ui/workspaces/{workspace_id}/agenda",
        )
        agenda.is_active = True
        app_api = ApplicationApi(app_list=[agenda], show_inactive=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.agenda_enabled = False
        default_workspace_menu_entry = app_api.get_default_workspace_menu_entry(
            workspace=workspace, app_config=app_config
        )
        assert len(default_workspace_menu_entry) == 3
        assert default_workspace_menu_entry[0].label == dashboard_menu_entry.label
        assert default_workspace_menu_entry[1].label == publication_menu_entry.label
        assert default_workspace_menu_entry[2].label == all_content_menu_entry.label

    def test_get_default_workspace_menu_entry__ok__publication_disabled_workspace_case(self):
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"

        app_api = ApplicationApi(app_list=[], show_inactive=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.publication_enabled = False
        menu_entries = app_api.get_default_workspace_menu_entry(
            workspace=workspace, app_config=app_config
        )
        with pytest.raises(StopIteration):
            next(entry for entry in menu_entries if entry.slug == publication_menu_entry.slug)
