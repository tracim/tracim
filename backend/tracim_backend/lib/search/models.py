from datetime import datetime
import typing

from dateutil.parser import parse
from elasticsearch_dsl import Search
from elasticsearch_dsl.response import Response


class ContentSearchResponse(object):
    """
    Response of search using LibSearch
    This is both an seriable content and a Custom Response object
    for elasticsearch search
    """

    def __init__(self, search: Search, response: Response):
        self._response = response
        self._search = search
        self.contents = []
        for hit in response["hits"]["hits"]:
            source = hit["_source"]
            content = SearchedContent(
                content_id=source["content_id"],
                parent_id=source.get("parent_id"),
                workspace_id=source["workspace_id"],
                label=source["label"],
                slug=source["slug"],
                status=source["status"],
                content_type=source["content_type"],
                sub_content_types=source["sub_content_types"],
                is_archived=source["is_archived"],
                is_deleted=source["is_deleted"],
                is_editable=source["is_editable"],
                show_in_ui=source["show_in_ui"],
                file_extension=source["file_extension"],
                filename=source["filename"],
                modified=parse(source["modified"]),
                created=parse(source["created"]),
                raw_content=source["raw_content"],
                score=hit["_score"],
            )
            self.contents.append(content)


class SearchedContent(object):
    """
    Content-Like object return by LibSearch.
    This class does not contain any logic, it's just needed to
    store data.
    """

    def __init__(
        self,
        content_id: int,
        parent_id: typing.Optional[int],
        workspace_id: int,
        label: str,
        slug: str,
        status: str,
        content_type: str,
        sub_content_types: typing.List[str],
        is_archived: bool,
        is_deleted: bool,
        is_editable: bool,
        show_in_ui: bool,
        file_extension: str,
        filename: str,
        modified: datetime,
        created: datetime,
        raw_content: str,
        score: float,
    ):
        self.content_id = content_id
        self.parent_id = parent_id
        self.workspace_id = workspace_id
        self.label = label
        self.slug = slug
        self.status = status
        self.content_type = content_type
        self.sub_content_types = sub_content_types
        self.is_archived = is_archived
        self.is_deleted = is_deleted
        self.is_editable = is_editable
        self.show_in_ui = show_in_ui
        self.file_extension = file_extension
        self.filename = filename
        self.modified = modified
        self.created = created
        self.raw_content = raw_content
        self.score = score
