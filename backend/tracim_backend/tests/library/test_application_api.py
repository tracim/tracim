from mock import Mock

from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.app_models.workspace_menu_entries import all_content_menu_entry
from tracim_backend.app_models.workspace_menu_entries import dashboard_menu_entry
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.tests import DefaultTest


class TestApplicationApi(DefaultTest):
    def test_get_default_workspace_menu_entry__ok__nominal_case(self):
        """
        Show only enabled app
        """
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"
        thread = Application(
            label="Threads",
            slug="contents/thread",
            fa_icon="comments-o",
            is_active=True,
            config={},
            main_route="/ui/workspaces/{workspace_id}/contents?type=thread",
            app_config=app_config,
        )
        thread.add_content_type(
            slug="thread",
            label="Thread",
            creation_label="Start a topic",
            available_statuses=content_status_list.get_all(),
            file_extension=".thread.html",
        )

        markdownpluspage = Application(
            label="Markdown Plus Documents",
            # TODO - G.M - 24-05-2018 - Check label
            slug="contents/markdownpluspage",
            fa_icon="file-code-o",
            is_active=False,
            config={},
            main_route="/ui/workspaces/{workspace_id}/contents?type=markdownpluspage",
            app_config=app_config,
        )
        markdownpluspage.add_content_type(
            slug="markdownpage",
            label="Rich Markdown File",
            creation_label="Create a Markdown document",
            available_statuses=content_status_list.get_all(),
        )
        app_api = ApplicationApi(app_list=[thread, markdownpluspage], show_all=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.agenda_enabled = True
        default_workspace_menu_entry = app_api.get_default_workspace_menu_entry(workspace=workspace)
        assert len(default_workspace_menu_entry) == 3
        assert default_workspace_menu_entry[0].label == dashboard_menu_entry.label
        assert default_workspace_menu_entry[1].label == all_content_menu_entry.label
        assert default_workspace_menu_entry[2].label == thread.label

    def test_get_default_workspace_menu_entry__ok__folder_case(self):
        """
        main route for folder is empty, that why it should not be included
        in default_menu entry
        :return:
        """
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"

        folder = Application(
            label="Folder",
            slug="contents/folder",
            fa_icon="folder-o",
            is_active=True,
            config={},
            main_route="",
            app_config=app_config,
        )
        folder.add_content_type(
            slug="folder",
            label="Folder",
            creation_label="Create a folder",
            available_statuses=content_status_list.get_all(),
            allow_sub_content=True,
            minimal_role_content_creation=WorkspaceRoles.CONTENT_MANAGER,
        )
        app_api = ApplicationApi(app_list=[folder], show_all=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.agenda_enabled = True
        default_workspace_menu_entry = app_api.get_default_workspace_menu_entry(workspace=workspace)
        assert len(default_workspace_menu_entry) == 2
        assert default_workspace_menu_entry[0].label == dashboard_menu_entry.label
        assert default_workspace_menu_entry[1].label == all_content_menu_entry.label

    def test_get_default_workspace_menu_entry__ok__agenda_enabled_workspace_case(self):
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"

        agenda = Application(
            label="Agenda",
            slug="agenda",
            fa_icon="calendar",
            is_active=True,
            config={},
            main_route="/ui/workspaces/{workspace_id}/agenda",
            app_config=app_config,
        )
        app_api = ApplicationApi(app_list=[agenda], show_all=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.agenda_enabled = True
        default_workspace_menu_entry = app_api.get_default_workspace_menu_entry(workspace=workspace)
        assert len(default_workspace_menu_entry) == 3
        assert default_workspace_menu_entry[0].label == dashboard_menu_entry.label
        assert default_workspace_menu_entry[1].label == all_content_menu_entry.label
        assert default_workspace_menu_entry[2].label == agenda.label

    def test_get_default_workspace_menu_entry__ok__agenda_disabled_workspace_case(self):
        app_config = Mock()
        app_config.APPS_COLORS = {}
        app_config.APPS_COLORS["primary"] = "#fff"

        agenda = Application(
            label="Agenda",
            slug="agenda",
            fa_icon="calendar",
            is_active=True,
            config={},
            main_route="/ui/workspaces/{workspace_id}/agenda",
            app_config=app_config,
        )
        app_api = ApplicationApi(app_list=[agenda], show_all=False)
        workspace = Mock()
        workspace.workspace_id = 12
        workspace.agenda_enabled = False
        default_workspace_menu_entry = app_api.get_default_workspace_menu_entry(workspace=workspace)
        assert len(default_workspace_menu_entry) == 2
        assert default_workspace_menu_entry[0].label == dashboard_menu_entry.label
        assert default_workspace_menu_entry[1].label == all_content_menu_entry.label
