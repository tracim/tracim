from tracim_backend.exceptions import WorkspacePublicDownloadDisabledException
from tracim_backend.lib.utils.authorization import AuthorizationChecker
from tracim_backend.lib.utils.request import TracimContext


class HasPublicDownloadEnabled(AuthorizationChecker):
    """
    Check if current workspace has public download feature enabled
    """

    def __init__(self):
        pass

    def check(self, tracim_context: TracimContext) -> bool:
        if tracim_context.current_workspace.public_download_enabled:
            return True
        raise WorkspacePublicDownloadDisabledException(
            'Workspace "{}" has public '
            "download feature disabled".format(tracim_context.current_workspace.workspace_id)
        )


has_public_download_enabled = HasPublicDownloadEnabled()
