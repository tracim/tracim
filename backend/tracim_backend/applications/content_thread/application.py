from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG


def get_app(app_config: CFG) -> Application:
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
    return thread
