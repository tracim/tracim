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
  route='/ui/workspaces/{workspace_id}/dashboard',
  hexcolor='#252525',
  fa_icon="signal",
)
all_content_menu_entry = WorkspaceMenuEntry(
  slug="contents/all",
  label="All Contents",
  route="/ui/workspaces/{workspace_id}/contents",
  hexcolor="#fdfdfd",
  fa_icon="th",
)