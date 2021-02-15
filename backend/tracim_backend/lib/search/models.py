from abc import ABC
from datetime import datetime
import typing


class ContentSearchResponse(ABC):
    def __init__(
        self,
        contents: typing.List["SearchedContent"],
        total_hits: int = 0,
        is_total_hits_accurate=True,
    ):
        self.contents = contents
        self.total_hits = total_hits
        self.is_total_hits_accurate = is_total_hits_accurate


class EmptyContentSearchResponse(ContentSearchResponse):
    def __init__(self):
        super().__init__(contents=[], total_hits=0)


class SearchedDigestUser(object):
    def __init__(self, user_id: int, public_name: str, has_avatar: bool, has_cover: bool) -> None:
        self.user_id = user_id
        self.public_name = public_name
        self.has_avatar = has_avatar
        self.has_cover = has_cover


class SearchedWorkspace(object):
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
        workspace: SearchedWorkspace,
        path: typing.List[SearchedDigestContent],
        comments: typing.List[SearchedDigestComment],
        comments_count: int,
        author: SearchedDigestUser,
        last_modifier: SearchedDigestUser,
        sub_content_types: typing.List[str],
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
        parent_id: typing.Optional[int] = None,
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
        self.comments_count = comments_count
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
