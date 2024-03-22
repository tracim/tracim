from pluggy import PluginManager
from pyramid.config import Configurator

from tracim_backend import sliced_dict
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.lib.utils.utils import string_to_unique_item_list
from tracim_backend.models.data import Content

# Envoi de la mention

# --- CONFIG ---

MENTION_FIELD = "mention"

config = {
    # Message of the warning. Note that a mention to the file's author will be prepended.
    "message": "Oops, I sent an unsupported video format. I should've sent a mp4 or webm file.",
    # Username of the user that will comment the warning. Leave blank to use the author of the file.
    "username": "",
    # List of mimetypes that should bypass the blacklist.
    "whitelist": ["video/mp4", "video/webm"],
    # List of mimetypes that should trigger a warning
    "blacklist": ["video/", "image/gif", "image/webp"],
}

# --- UTILS---

MENTION_NODE_NAME = "html-mention"
SETTINGS_KEY_PREFIX = "video_alert_plugin."


# --- MAIN ---


class VideoAlertPlugin:
    """
    This plugin adds a comment to video contents when created if they are not a mp4 file.

    Needs a registration using 'register_tracim_plugin' function.
    """

    def __init__(self):
        self.config = None

    @staticmethod
    def wrap_in_mention_node(recipient: str, id_: str) -> str:
        return (
            ""
            if recipient == ""
            else f'<{MENTION_NODE_NAME} userid="{id_}">@{recipient}</{MENTION_NODE_NAME}>'
        )

    @staticmethod
    def is_content_supported(content: Content):
        return content.type == "file"

    def is_content_whitelisted(self, content: Content) -> bool:
        content_mimetype = content.file_mimetype.lower()

        for ok_mimetype in self.config["whitelist"]:
            if ok_mimetype.endswith("/") and content_mimetype.startswith(ok_mimetype):
                return True
            elif content_mimetype == ok_mimetype:
                return True
        return False

    def is_content_blacklisted(self, content: Content) -> bool:
        content_mimetype = content.file_mimetype.lower()

        for nok_mimetype in self.config["blacklist"]:
            if nok_mimetype.endswith("/") and content_mimetype.startswith(nok_mimetype):
                return True
            elif content_mimetype == nok_mimetype:
                return True
        return False

    @hookimpl
    def on_plugins_loaded(self) -> None:
        """
        This method is called when the plugin is loaded.
        """

        from pyramid.threadlocal import get_current_registry

        registry = get_current_registry()
        configurator = Configurator(registry=registry)

        settings = configurator.get_settings()
        plugin_settings = sliced_dict(settings, beginning_key_string=SETTINGS_KEY_PREFIX)

        self.config = config
        self.config["message"] = plugin_settings.get(
            f"{SETTINGS_KEY_PREFIX}message", config["message"]
        )
        self.config["username"] = plugin_settings.get(
            f"{SETTINGS_KEY_PREFIX}username", config["username"]
        )

        whitelist = plugin_settings.get(f"{SETTINGS_KEY_PREFIX}whitelist")
        if whitelist:
            self.config["whitelist"] = string_to_unique_item_list(
                whitelist,
                separator=",",
                cast_func=str,
                do_strip=True,
            )
        else:
            self.config["whitelist"] = config.get("whitelist")

        blacklist = plugin_settings.get(f"{SETTINGS_KEY_PREFIX}blacklist")
        if blacklist:
            self.config["blacklist"] = string_to_unique_item_list(
                blacklist,
                separator=",",
                cast_func=str,
                do_strip=True,
            )
        else:
            self.config["blacklist"] = config.get("blacklist")

        for key, value in self.config.items():
            logger.info(self, f"{key}: {value}")

    @hookimpl
    def on_content_modified(self, content: Content, context: TracimContext) -> None:
        """
        Add a comment to the content if it is a video and not a mp4 file.
        """

        if not self.is_content_supported(content):
            return

        if self.is_content_whitelisted(content) or not self.is_content_blacklisted(content):
            return

        username = self.config["username"]
        if username == "":
            username = content.author.username

        try:
            current_user = UserApi(
                session=context.dbsession, config=context.app_config, current_user=None
            ).get_one_by_username(username)
        except Exception as e:
            logger.error(self, f"VIDEO_ALERT_PLUGIN w/ UserApi {e}")
            return

        try:
            workspace_api = WorkspaceApi(
                session=context.dbsession, config=context.app_config, current_user=current_user
            )
            workspace = workspace_api.get_one(content.workspace_id)
        except Exception as e:
            logger.error(self, f"VIDEO_ALERT_PLUGIN w/ WorkspaceApi {e}")
            return

        author_id = content.author.user_id
        mention_recipient = content.author.username
        try:
            content_api = ContentApi(
                session=context.dbsession,
                current_user=current_user,
                config=context.app_config,
            )
            content_api.create_comment(
                workspace=workspace,
                parent=content,
                content=f"<p>{self.wrap_in_mention_node(mention_recipient, str(author_id))} "
                + f"- {self.config['message']}</p>",
                do_save=False,
                do_notify=False,
            )
        except Exception as e:
            logger.error(self, f"VIDEO_ALERT_PLUGIN w/ ContentApi {e}")
            return


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(VideoAlertPlugin())
