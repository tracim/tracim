import typing

from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.models import SearchedContent
from tracim_backend.lib.search.models import SearchedDigestComment
from tracim_backend.lib.search.models import SearchedDigestContent
from tracim_backend.lib.search.models import SearchedDigestUser
from tracim_backend.lib.search.models import SearchedWorkspace
from tracim_backend.models.context_models import ContentInContext


class SimpleContentSearchResponse(ContentSearchResponse):

    DEFAULT_SCORE = 1

    def __init__(self, content_list: typing.List[ContentInContext], total_hits: int):
        contents = []
        for content in content_list:
            parent = None
            parents = []
            if content.parent:
                parent = SearchedDigestContent(
                    content_id=content.parent.content_id,
                    parent_id=content.parent.parent_id,
                    label=content.parent.label,
                    slug=content.parent.slug,
                    content_type=content.parent.content_type,
                )
                for parent_ in content.parents:
                    digest_parent = SearchedDigestContent(
                        content_id=parent_.content_id,
                        parent_id=parent_.parent_id,
                        label=parent_.label,
                        slug=parent_.slug,
                        content_type=parent_.content_type,
                    )
                    parents.append(digest_parent)
            comments = []
            for comment in content.comments:
                digest_comment = SearchedDigestComment(
                    content_id=comment.content_id, parent_id=comment.parent_id
                )
                comments.append(digest_comment)

            workspace = SearchedWorkspace(
                workspace_id=content.workspace.workspace_id, label=content.workspace.label
            )
            last_modifier = SearchedDigestUser(
                user_id=content.last_modifier.user_id, public_name=content.last_modifier.public_name
            )
            author = SearchedDigestUser(
                user_id=content.author.user_id, public_name=content.author.public_name
            )
            content = SearchedContent(
                content_id=content.content_id,
                label=content.label,
                slug=content.slug,
                status=content.status,
                content_type=content.content_type,
                workspace=workspace,
                workspace_id=content.workspace_id,
                parent=parent,
                parent_id=content.parent_id,
                parents=parents,
                comments=comments,
                author=author,
                last_modifier=last_modifier,
                sub_content_types=content.sub_content_types,
                is_archived=content.is_archived,
                is_deleted=content.is_deleted,
                is_editable=content.is_editable,
                is_active=content.is_active,
                show_in_ui=content.show_in_ui,
                file_extension=content.file_extension,
                filename=content.filename,
                modified=content.modified,
                created=content.created,
                score=self.DEFAULT_SCORE,
                current_revision_id=content.current_revision_id,
            )
            contents.append(content)
        super().__init__(contents=contents, total_hits=total_hits, is_total_hits_accurate=False)
