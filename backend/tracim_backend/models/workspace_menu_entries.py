# coding=utf-8
import typing
from copy import copy

from tracim_backend.models.applications import applications
from tracim_backend.models.data import Workspace


class WorkspaceMenuEntry(object):
    """
    Application class with data needed for frontend
    """
    def __init__(
            self,
            label: str,
            slug: str,
            fa_icon: str,
            hexcolor: str,
            route: str,
    ) -> None:
        self.slug = slug
        self.label = label
        self.route = route
        self.hexcolor = hexcolor
        self.fa_icon = fa_icon

dashboard_menu_entry = WorkspaceMenuEntry(
  slug='dashboard',
  label='Dashboard',
  route='/#/workspaces/{workspace_id}/dashboard',
  hexcolor='#252525',
  fa_icon="signal",
)
all_content_menu_entry = WorkspaceMenuEntry(
  slug="contents/all",
  label="All Contents",
  route="/#/workspaces/{workspace_id}/contents",
  hexcolor="#fdfdfd",
  fa_icon="th",
)

# TODO - G.M - 08-06-2018 - This is hardcoded default menu entry,
#  of app, make this dynamic (and loaded from application system)
def default_workspace_menu_entry(
    workspace: Workspace,
)-> typing.List[WorkspaceMenuEntry]:
    """
    Get default menu entry for a workspace
    """
    menu_entries = [
        copy(dashboard_menu_entry),
        copy(all_content_menu_entry),
    ]
    for app in applications:
        if app.main_route:
            new_entry = WorkspaceMenuEntry(
                slug=app.slug,
                label=app.label,
                hexcolor=app.hexcolor,
                fa_icon=app.fa_icon,
                route=app.main_route
            )
            menu_entries.append(new_entry)

    for entry in menu_entries:
        entry.route = entry.route.replace(
            '{workspace_id}',
            str(workspace.workspace_id)
        )

    return menu_entries
