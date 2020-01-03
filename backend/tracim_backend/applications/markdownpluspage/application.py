from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG


def get_app(app_config: CFG) -> Application:
    # TODO - G.M - 2020-01-03 - remove this dummy app (not working now and not active), currently
    # needed for some tests
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
    return markdownpluspage
