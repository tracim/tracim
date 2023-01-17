from pluggy import PluginManager

from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.data import Content

from .utils import is_content_blacklisted
from .utils import is_content_supported
from .utils import is_content_whitelisted
from .utils import wrap_in_mention_node

# Envoi de la mention
# Check sur le mimetype (se plugger sur le hook de modification de contenu, mais pas trigger le rename)
# La config doit passer depuis l'env, avec des valeurs par défaut
# Lire un user depuis l'env, mettre un user par défaut sur l'auteur du fichier
# Tout remettre dans un seul fichier

# Rédaction d'un micro-tuto pour expliquer comment faire un plugin (markdown, hors de Tracim)

config = {
    # Message of the warning. Note that a mention to the file's author will be appended.
    "message": "Oops, I uploaded a video that is not a supported. I should send a mp4 or webm file instead.",
    # List of mimetypes that should bypass the blacklist.
    "ok_mimetypes": ["video/mp4", "video/webm"],
    # List of mimetypes that should trigger a warning
    "nok_mimetypes": ["video/", "image/gif", "image/webp"],
}


class VideoAlertPlugin:
    """
    This plugin adds a comment to video contents when created if they are not a mp4 file.

    Needs a registration using 'register_tracim_plugin' function.
    """

    @hookimpl
    def on_plugins_loaded(self, plugin_manager: PluginManager) -> None:
        """
        This method is called when the plugin is loaded.
        """

    @hookimpl
    def on_content_created(self, content: Content, context: TracimContext) -> None:
        """
        Add a comment to the content if it is a video and not a mp4 file.
        """

        if not is_content_supported(content) and is_content_whitelisted(content):
            return

        if not is_content_blacklisted(content):
            return

        try:
            """
            Not using the `current_user` since it is not required to work,
            however everything is in place for it to be used.
            """
            UserApi(
                session=context.dbsession, config=context.app_config, current_user=None
            ).get_one_by_username(config["username"])

            workspace = WorkspaceApi(
                session=context.dbsession, config=context.app_config, current_user=None
            ).get_one(content.workspace_id)

            ContentApi(
                session=context.dbsession, current_user=None, config=context.app_config,
            ).create_comment(
                workspace=workspace,
                parent=content,
                content=f"<p>{wrap_in_mention_node(content.author.username)} - \
                    {config['message']}</p>",
                do_save=True,
                do_notify=True,
            )

        except Exception as e:
            print(e)


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(VideoAlertPlugin())
