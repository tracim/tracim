import os
import uuid

from pluggy import PluginManager

from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.core.event import EventApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.data import Content
from tracim_backend.models.event import EntityType, OperationType, Event

# Envoi de la mention
# Rédaction d'un micro-tuto pour expliquer comment faire un plugin (markdown, hors de Tracim)

# --- CONFIG ---

MENTION_FIELD = "mention"

config = {
    # Message of the warning. Note that a mention to the file's author will be prepended.
    "message": "Oops, I sent an unsupported video format. I should've sent a mp4 or webm file.",
    # Username of the user that will comment the warning. Leave blank to use the author of the file.
    "username": "beep",
    # List of mimetypes that should bypass the blacklist.
    "whitelist": ["video/mp4", "video/webm"],
    # List of mimetypes that should trigger a warning
    "blacklist": ["video/", "image/gif", "image/webp"],
}

# --- UTILS---

MENTION_NODE_NAME = 'span'
MENTION_ID_PREFIX = 'mention-'
MENTION_CLASS = 'mention'


def wrap_in_mention_node(recipient: str, id_: str):
    if recipient == "":
        return ""
    return f'<{MENTION_NODE_NAME} id="{MENTION_ID_PREFIX}{id_}" class="{MENTION_CLASS}">' + \
        f'@{recipient}</{MENTION_NODE_NAME}>'


def is_content_supported(content: Content):
    return content.type == "file"


def is_content_whitelisted(content: Content):
    content_mimetype = content.file_mimetype.lower()

    for ok_mimetype in config["whitelist"]:
        if ok_mimetype.endswith("/") and content_mimetype.startswith(ok_mimetype):
            return True
        elif content_mimetype == ok_mimetype:
            return True
    return False


def is_content_blacklisted(content: Content):
    content_mimetype = content.file_mimetype.lower()

    for nok_mimetype in config["blacklist"]:
        if nok_mimetype.endswith("/") and content_mimetype.startswith(nok_mimetype):
            return True
        elif content_mimetype == nok_mimetype:
            return True
    return False


# --- MAIN ---

class VideoAlertPlugin:
    """
    This plugin adds a comment to video contents when created if they are not a mp4 file.

    Needs a registration using 'register_tracim_plugin' function.
    """

    @hookimpl
    def on_plugins_loaded(self) -> None:
        """
        This method is called when the plugin is loaded.
        """
        config["message"] = os.environ.get('TRACIM_VIDEO_ALERT_MESSAGE', config["message"])
        config["username"] = os.environ.get('TRACIM_VIDEO_ALERT_USERNAME', config["username"])

        whitelist = os.environ.get('TRACIM_VIDEO_ALERT_WHITELIST')
        if whitelist:
            config["whitelist"] = []
            for mimetype in whitelist.split(','):
                config["whitelist"].append(mimetype)

        blacklist = os.environ.get('TRACIM_VIDEO_ALERT_BLACKLIST')
        if blacklist:
            config["blacklist"] = []
            for mimetype in blacklist.split(','):
                config["blacklist"].append(mimetype)

        for key, value in config.items():
            logger.info(self, f"{key}: {value}")

    @hookimpl
    def on_content_modified(self, content: Content, context: TracimContext) -> None:
        """
        Add a comment to the content if it is a video and not a mp4 file.
        """

        if not is_content_supported(content):
            return

        if is_content_whitelisted(content) or not is_content_blacklisted(content):
            return

        username = config["username"]
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

        mention_id = str(uuid.uuid4())
        mention_recipient = content.author.username
        try:
            content_api = ContentApi(
                session=context.dbsession, current_user=current_user, config=context.app_config,
            )
            content_api.create_comment(
                workspace=workspace,
                parent=content,
                content=f"<p>{wrap_in_mention_node(mention_recipient, mention_id)} " +
                        f"- {config['message']}</p>",
                do_save=False,
                do_notify=False,
            )
        except Exception as e:
            logger.error(self, f"VIDEO_ALERT_PLUGIN w/ ContentApi {e}")
            return


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(VideoAlertPlugin())
