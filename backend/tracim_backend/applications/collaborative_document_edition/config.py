from paste.deploy.converters import asbool

from tracim_backend import CFG
from tracim_backend.applications.collaborative_document_edition.data import (
    COLLABORA_DOCUMENT_EDITION_SLUG,
)


def load_config(app_config: CFG) -> CFG:
    app_config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED = asbool(
        app_config.get_raw_config("collaborative_document_edition.activated", "false")
    )
    app_config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE = app_config.get_raw_config(
        "collaborative_document_edition.software"
    )
    app_config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL = app_config.get_raw_config(
        "collaborative_document_edition.collabora.base_url"
    )
    app_config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR = app_config.get_raw_config(
        "collaborative_document_edition.file_template_dir"
    )
    return app_config


def check_config(app_config: CFG) -> CFG:
    if app_config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED:
        if app_config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE == COLLABORA_DOCUMENT_EDITION_SLUG:
            app_config.check_mandatory_param(
                "COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL",
                app_config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL,
                when_str="if collabora feature is activated",
            )
    return app_config
