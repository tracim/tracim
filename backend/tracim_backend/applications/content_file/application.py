from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG


def get_app(app_config: CFG) -> Application:
    _file = Application(
        label="Files",
        slug="contents/file",
        fa_icon="paperclip",
        is_active=True,
        config={},
        main_route="/ui/workspaces/{workspace_id}/contents?type=file",
        app_config=app_config,
    )
    _file.add_content_type(
        slug="file",
        label="File",
        creation_label="Upload a file",
        available_statuses=content_status_list.get_all(),
    )
    return _file
