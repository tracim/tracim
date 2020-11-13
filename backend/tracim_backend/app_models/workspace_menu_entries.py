class WorkspaceMenuEntry(object):
    """
    Application class with data needed for frontend
    """

    def __init__(self, label: str, slug: str, fa_icon: str, hexcolor: str, route: str) -> None:
        self.slug = slug
        self.label = label
        self.route = route
        self.hexcolor = hexcolor
        self.fa_icon = fa_icon


dashboard_menu_entry = WorkspaceMenuEntry(
    slug="dashboard",
    label="Dashboard",
    route="/ui/workspaces/{workspace_id}/dashboard",
    hexcolor="#fdfdfd",
    fa_icon="home",
)
all_content_menu_entry = WorkspaceMenuEntry(
    slug="contents/all",
    label="All Contents",
    route="/ui/workspaces/{workspace_id}/contents",
    hexcolor="#bbbbbb",
    fa_icon="th",
)
activity_menu_entry = WorkspaceMenuEntry(
    slug="activity",
    label="Activity Feed",
    route="/ui/workspaces/{workspace_id}/activity",
    hexcolor="#bbbbbb",
    fa_icon="newspaper-o",
)
