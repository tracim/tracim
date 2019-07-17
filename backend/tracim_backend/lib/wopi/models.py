from datetime import datetime


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
