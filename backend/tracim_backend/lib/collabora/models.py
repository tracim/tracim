from datetime import datetime


class CollaboraFileType(object):
    def __init__(self, extension, associated_action, url_source):
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


class WopiLastModifiedTime(object):
    def __init__(self, last_modified_time: datetime):
        self.last_modified_time = last_modified_time


class WopiCheckFileInfo(object):
    def __init__(
        self,
        last_modified_time: datetime,
        base_file_name: str,
        size: int,
        owner_id: int,
        user_id: int,
        user_friendly_name: str,
        user_can_write: bool,
        user_can_not_write_relative: bool,
        version: int,
    ):
        self.last_modified_time = last_modified_time
        self.base_file_name = base_file_name
        self.size = size
        self.owner_id = owner_id
        self.user_id = user_id
        self.user_friendly_name = user_friendly_name
        self.user_can_write = user_can_write
        self.last_modified_time = last_modified_time
        self.version = version
        self.user_can_not_write_relative = user_can_not_write_relative
