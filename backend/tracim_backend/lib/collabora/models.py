class CollaboraFileType(object):
    def __init__(self, mimetype, extension, associated_action, url_source):
        self.mimetype = mimetype
        self.extension = extension
        self.associated_action = associated_action
        self.url_source = url_source


class CollaboraEditableFileInfo(object):
    def __init__(self, is_collabora_editable, url_source, access_token, content_id, workspace_id):
        self.is_collabora_editable = is_collabora_editable
        self.url_source = url_source
        self.access_token = access_token
        self.content_id = content_id
        self.workspace_id = workspace_id
