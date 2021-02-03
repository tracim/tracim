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
    fa_icon="fas fa-tachometer-alt",
)
activity_menu_entry = WorkspaceMenuEntry(
    slug="activity",
    label="Activity feed",
    route="/ui/workspaces/{workspace_id}/activity-feed",
    hexcolor="#bbbbbb",
    fa_icon="far fa-newspaper",
)
all_content_menu_entry = WorkspaceMenuEntry(
    slug="contents/all",
    label="Contents",
    route="/ui/workspaces/{workspace_id}/contents",
    hexcolor="#bbbbbb",
    fa_icon="fas fa-th",
)
