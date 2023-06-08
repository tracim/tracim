from tracim_backend.exceptions import WorkspacePublicUploadDisabledException
from tracim_backend.lib.utils.authorization import AuthorizationChecker
from tracim_backend.lib.utils.request import TracimContext


class HasPublicUploadEnabled(AuthorizationChecker):
    """
    Check if current workspace has public upload feature enabled
    """

    def __init__(self):
        pass

    def check(self, tracim_context: TracimContext) -> bool:
        if tracim_context.current_workspace.public_upload_enabled:
            return True
        raise WorkspacePublicUploadDisabledException(
            'Workspace "{}" has public '
            "upload feature disabled".format(tracim_context.current_workspace.workspace_id)
        )


has_public_upload_enabled = HasPublicUploadEnabled()
