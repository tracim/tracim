import importlib
import typing

from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.utils import find_direct_submodule_path

# TODO - G.M - 2020-01-17 - remove these slug (no need anymore to do app_lib.exist(SLUG)
# when event mechanism will be fully implemented, see https://github.com/tracim/tracim/issues/1487
AGENDA__APP_SLUG = "agenda"
COLLABORATIVE_DOCUMENT_EDITION__APP_SLUG = "collaborative_document_edition"


def load_apps() -> typing.Dict[str, TracimApplication]:
    """
    Load all availables applications of Tracim.

    this will find all direct submodules of tracim_backend.applications to
    run all "tracim_backend.applications.<application_name>.application.create_app" functions
    to obtain a list of all TracimApplication available
    :warning: this obtain all available applications and do not filter between enabled/disabled applications
    :return: dict of loaded app, keys is app slug
    """
    import tracim_backend.applications as apps_modules

    tracim_apps = {}
    for app_config_path in find_direct_submodule_path(apps_modules):
        module = importlib.import_module("{}.application".format(app_config_path))
        app = module.create_app()
        tracim_apps[app.slug] = app
    return tracim_apps
