from tracim_backend.app_models.applications import Application
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG


def get_app(app_config: CFG) -> Application:
    html_documents = Application(
        label="Text Documents",  # TODO - G.M - 24-05-2018 - Check label
        slug="contents/html-document",
        fa_icon="file-text-o",
        is_active=True,
        config={},
        main_route="/ui/workspaces/{workspace_id}/contents?type=html-document",
        app_config=app_config,
    )
    html_documents.add_content_type(
        slug="html-document",
        label="Text Document",
        creation_label="Write a document",
        available_statuses=content_status_list.get_all(),
        slug_alias=["page"],
        file_extension=".document.html",
    )
    return html_documents
