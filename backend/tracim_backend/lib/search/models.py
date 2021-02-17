from abc import ABC
from datetime import datetime
from typing import List
from typing import Optional


class FacetCount:
    def __init__(self, key: str, count: int) -> None:
        self.key = key
        self.count = count


class SimpleFacets:
    def __init__(
        self,
        workspace_names: Optional[List[str]],
        author__public_names: Optional[List[str]],
        last_modifier__public_names: Optional[List[str]],
        file_extensions: Optional[List[str]],
        statuses: Optional[List[str]],
        content_types: Optional[List[FacetCount]],
        created_from: Optional[datetime],
        created_to: Optional[datetime],
        modified_from: Optional[datetime],
        modified_to: Optional[datetime],
    ) -> None:
        self.workspace_names = workspace_names
        self.author__public_names = author__public_names
        self.last_modifier__public_names = last_modifier__public_names
        self.file_extensions = file_extensions
        self.statuses = statuses
        self.content_types = content_types
        self.created_from = created_from
        self.created_to = created_to
        self.modified_from = modified_from
        self.modified_to = modified_to


class ContentSearchResponse(ABC):
    def __init__(
        self,
        contents: List["SearchedContent"],
        total_hits: int = 0,
        is_total_hits_accurate: bool = True,
        simple_facets: Optional[List[str]] = None,
        search_fields: Optional[List[str]] = None,
    ):
        self.contents = contents
        self.total_hits = total_hits
        self.is_total_hits_accurate = is_total_hits_accurate
        self.simple_facets = simple_facets
        self.search_fields = search_fields


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
