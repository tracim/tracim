from paste.deploy.converters import asbool

from tracim_backend import CFG
from tracim_backend.exceptions import ConfigurationError


def load_config(app_config: CFG) -> CFG:
    """
    load config for caldav related stuff
    """
    app_config.CALDAV__ENABLED = asbool(app_config.get_raw_config("caldav.enabled", "false"))
    app_config.CALDAV__RADICALE_PROXY__BASE_URL = app_config.get_raw_config(
        "caldav.radicale_proxy.base_url", None
    )
    app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER = app_config.get_raw_config(
        "caldav.radicale.storage.filesystem_folder"
    )
    app_config.CALDAV__RADICALE__AGENDA_DIR = "agenda"
    app_config.CALDAV__RADICALE__WORKSPACE_SUBDIR = "workspace"
    app_config.CALDAV__RADICALE__USER_SUBDIR = "user"
    app_config.CALDAV__RADICALE__BASE_PATH = "/{}/".format(app_config.CALDAV__RADICALE__AGENDA_DIR)
    app_config.CALDAV__RADICALE__USER_PATH = "/{}/{}/".format(
        app_config.CALDAV__RADICALE__AGENDA_DIR, app_config.CALDAV__RADICALE__USER_SUBDIR
    )
    app_config.CALDAV_RADICALE_WORKSPACE_PATH = "/{}/{}/".format(
        app_config.CALDAV__RADICALE__AGENDA_DIR, app_config.CALDAV__RADICALE__WORKSPACE_SUBDIR
    )
    return app_config


def check_config(app_config: CFG) -> CFG:
    """
    Check if config is correctly setted for caldav features
    """
    if app_config.CALDAV__ENABLED:
        app_config.check_mandatory_param(
            "CALDAV__RADICALE_PROXY__BASE_URL",
            app_config.CALDAV__RADICALE_PROXY__BASE_URL,
            when_str="when caldav feature is enabled",
        )
        # TODO - G.M - 2019-05-06 - convert "caldav.radicale.storage.filesystem_folder"
        # as tracim global parameter
        app_config.check_mandatory_param(
            "CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER",
            app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            when_str="if caldav feature is enabled",
        )
        app_config.check_directory_path_param(
            "CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER",
            app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
            writable=True,
        )
        radicale_storage_type = app_config.settings.get("caldav.radicale.storage.type")
        if radicale_storage_type != "multifilesystem":
            raise ConfigurationError(
                '"{}" should be set to "{}"'
                " (currently only valid value)"
                ' when "{}" is true'.format(
                    "caldav.radicale.storage.type", "multifilesystem", "caldav.enabled"
                )
            )
    return app_config
