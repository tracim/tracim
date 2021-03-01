from datetime import datetime
from enum import Enum
from typing import List
from typing import Optional


class ContentSearchField(str, Enum):
    LABEL = "label"
    RAW_CONTENT = "raw_content"
    COMMENTS = "comments"
    DESCRIPTION = "description"


class UserSearchField(str, Enum):
    PUBLIC_NAME = "public_name"
    USERNAME = "username"
    CUSTOM_PROPERTIES = "custom_properties"


class WorkspaceSearchField(str, Enum):
    LABEL = "label"
    DESCRIPTION = "description"


class DateRange:
    def __init__(self, date_from: str, date_to: str):
        self.date_from = date_from
        self.date_to = date_to


class SearchedDigestUser(object):
    def __init__(self, user_id: int, public_name: str, has_avatar: bool, has_cover: bool) -> None:
        self.user_id = user_id
        self.public_name = public_name
        self.has_avatar = has_avatar
        self.has_cover = has_cover


class SearchedDigestWorkspace(object):
    def __init__(self, workspace_id: int, label: str) -> None:
        self.workspace_id = workspace_id
        self.label = label


class SearchedDigestContent(object):
    def __init__(self, content_id: int, label: str, slug: str, content_type: str) -> None:
        self.content_id = content_id
        self.label = label
        self.slug = slug
        self.content_type = content_type


class SearchedDigestComment(object):
    def __init__(self, content_id: int, parent_id: int) -> None:
        self.content_id = content_id
        self.parent_id = parent_id


class SearchedContent(object):
    """
    Content-Like object return by LibSearch.
    This class does not contain any logic, it's just needed to
    store data.
    """

    def __init__(
        self,
        content_namespace: str,
        content_id: int,
        label: str,
        slug: str,
        status: str,
        content_type: str,
        workspace: SearchedDigestWorkspace,
        path: List[SearchedDigestContent],
        comments: List[SearchedDigestComment],
        comment_count: int,
        author: SearchedDigestUser,
        last_modifier: SearchedDigestUser,
        sub_content_types: List[str],
        is_archived: bool,
        is_deleted: bool,
        is_editable: bool,
        show_in_ui: bool,
        file_extension: str,
        filename: str,
        modified: datetime,
        created: datetime,
        score: float,
        current_revision_id: int,
        current_revision_type: str,
        workspace_id: int,
        active_shares: int,
        content_size: int,
        parent_id: Optional[int] = None,
    ) -> None:
        self.current_revision_id = current_revision_id
        self.current_revision_type = current_revision_type
        self.content_namespace = content_namespace
        self.content_id = content_id
        self.label = label
        self.slug = slug
        self.status = status
        self.content_type = content_type
        self.workspace = workspace
        self.parent_id = parent_id
        self.workspace_id = workspace_id
        self.path = path
        self.comments = comments
        self.comment_count = comment_count
        self.author = author
        self.last_modifier = last_modifier
        self.sub_content_types = sub_content_types
        self.is_archived = is_archived
        self.is_deleted = is_deleted
        self.is_editable = is_editable
        self.show_in_ui = show_in_ui
        self.file_extension = file_extension
        self.filename = filename
        self.modified = modified
        self.created = created
        self.score = score
        self.active_shares = active_shares
        self.content_size = content_size


class ContentSearchResponse:
    def __init__(
        self,
        contents: Optional[List["SearchedContent"]] = None,
        total_hits: int = 0,
        is_total_hits_accurate: bool = True,
        facets: Optional[List[str]] = None,
        created_range: Optional[DateRange] = None,
        modified_range: Optional[DateRange] = None,
    ):
        self.contents = contents or []
        self.total_hits = total_hits
        self.is_total_hits_accurate = is_total_hits_accurate
        self.facets = facets
        self.created_range = created_range
        self.modified_range = modified_range


class SearchedUser:
    def __init__(
        self,
        user_id: int,
        public_name: str,
        is_deleted: bool,
        is_archived: bool,
        has_avatar: bool,
        has_cover: bool,
    ) -> None:
        self.user_id = user_id
        self.public_name = public_name
        self.is_deleted = is_deleted
        self.is_archived = is_archived
        self.has_avatar = has_avatar
        self.has_cover = has_cover
