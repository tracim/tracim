from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.models.roles import WorkspaceRoles


def get_app(app_config: CFG) -> Application:
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
    return folder
