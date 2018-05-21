# coding=utf-8


class WorkspaceMenuEntry(object):
    """
    Application class with data needed for frontend
    """
    def __init__(
            self,
            label: str,
            slug: str,
            icon: str,
            hexcolor: str,
            route: str,
    ) -> None:
        self.slug = slug
        self.label = label
        self.route = route
        self.hexcolor = hexcolor
        self.icon = icon


dashboard_menu_entry = WorkspaceMenuEntry(
  slug='dashboard',
  label='Dashboard',
  route='/#/workspaces/{workspace_id}/dashboard',
  hexcolor='#252525',
  icon="",
)
all_content_menu_entry = WorkspaceMenuEntry(
  slug="contents/all",
  label="Tous les contenus",
  route="/#/workspaces/{workspace_id}/contents",
  hexcolor="#fdfdfd",
  icon="",
)


