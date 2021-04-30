from copy import copy
import typing
from typing import List

from tracim_backend.app_models.workspace_menu_entries import WorkspaceMenuEntry
from tracim_backend.app_models.workspace_menu_entries import all_content_menu_entry
from tracim_backend.app_models.workspace_menu_entries import dashboard_menu_entry
from tracim_backend.app_models.workspace_menu_entries import publication_menu_entry
from tracim_backend.exceptions import AppDoesNotExist
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType

if typing.TYPE_CHECKING:
    from tracim_backend.models.data import Workspace
    from tracim_backend.config import CFG
    from tracim_backend.app_models.applications import TracimApplicationInContext  # noqa:F401
    from tracim_backend.app_models.contents import ContentTypeInContext  # noqa: F401


class ApplicationApi(object):
    def __init__(self, app_list: List["TracimApplication"], show_inactive: bool = False) -> None:
        """
        Lib to get information about applications in tracim.

        :param app_list: list of current applications.
        :param show_inactive: search or not in inactive app too.
        """
        self.apps = app_list
        self.show_inactive = show_inactive

    def exist(self, slug: str) -> bool:
        """ Check if app with this slug does exist according to applicationApi configuration"""
        try:
            self.get_one(slug)
            return True
        except AppDoesNotExist:
            return False

    def get_one(self, slug: str) -> TracimApplication:
        """ Get app with given slug if exist"""
        for app in self.apps:
            if app.slug == slug:
                if self.show_inactive or app.is_active:
                    return app
        raise AppDoesNotExist("Application {app} does not exist".format(app=slug))

    def get_application_in_context(
        self, app: TracimApplication, app_config: "CFG"
    ) -> "TracimApplicationInContext":
        # INFO - G.M - 2020-01-17 - import here to avoid circular import.
        from tracim_backend.app_models.applications import TracimApplicationInContext

        return TracimApplicationInContext(app=app, app_config=app_config)

    def get_all(self) -> List["TracimApplication"]:
        active_apps = []
        for app in self.apps:
            if self.show_inactive or app.is_active:
                active_apps.append(app)

        return active_apps

    def get_content_types(self) -> List[TracimContentType]:
        active_content_types = []
        for app in self.get_all():
            if app.content_types:
                for content_type in app.content_types:
                    active_content_types.append(content_type)
        return active_content_types

    def get_default_workspace_menu_entry(
        self, workspace: "Workspace", app_config: "CFG"
    ) -> typing.List[WorkspaceMenuEntry]:
        """
        Get default menu entry for a workspace
        """
        menu_entries = [copy(dashboard_menu_entry)]
        if workspace.publication_enabled:
            menu_entries.append(copy(publication_menu_entry))
        menu_entries.append(copy(all_content_menu_entry))

        applications_in_context = [
            self.get_application_in_context(app, app_config) for app in self.get_all()
        ]
        for app in applications_in_context:
            # FIXME - G.M - 2019-04-01 - temporary fix to avoid giving agenda
            # menu entry, menu entry should be added through hook in app itself
            # see issue #706, https://github.com/tracim/tracim/issues/706
            if app.slug == "agenda" and not workspace.agenda_enabled:
                continue

            if app.main_route:
                new_entry = WorkspaceMenuEntry(
                    slug=app.slug,
                    label=app.label,
                    hexcolor=app.hexcolor,
                    fa_icon=app.fa_icon,
                    route=app.main_route,
                )
                menu_entries.append(new_entry)

        for entry in menu_entries:
            entry.route = entry.route.replace("{workspace_id}", str(workspace.workspace_id))

        return menu_entries
