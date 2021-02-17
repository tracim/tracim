import typing

from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.models import SearchedContent
from tracim_backend.lib.search.models import SearchedDigestComment
from tracim_backend.lib.search.models import SearchedDigestContent
from tracim_backend.lib.search.models import SearchedDigestUser
from tracim_backend.lib.search.models import SearchedDigestWorkspace
from tracim_backend.models.context_models import ContentInContext


class SimpleContentSearchResponse(ContentSearchResponse):

    DEFAULT_SCORE = 1

    def __init__(self, content_list: typing.List[ContentInContext], total_hits: int):
        contents = []
        for content in content_list:
            path = [
                SearchedDigestContent(
                    content_id=component.content_id,
                    label=component.label,
                    slug=component.slug,
                    content_type=component.content_type,
                )
                for component in content.content_path
            ]

            comments = [
                SearchedDigestComment(content_id=comment.content_id, parent_id=comment.parent_id)
                for comment in content.comments
            ]

            workspace = SearchedDigestWorkspace(
                workspace_id=content.workspace.workspace_id, label=content.workspace.label
            )
            last_modifier = SearchedDigestUser(
                user_id=content.last_modifier.user_id,
                public_name=content.last_modifier.public_name,
                has_avatar=content.last_modifier.has_avatar,
                has_cover=content.last_modifier.has_cover,
            )
            author = SearchedDigestUser(
                user_id=content.author.user_id,
                public_name=content.author.public_name,
                has_avatar=content.author.has_avatar,
                has_cover=content.author.has_cover,
            )
            content = SearchedContent(
                content_namespace=content.content_namespace,
                content_id=content.content_id,
                label=content.label,
                slug=content.slug,
                status=content.status,
                content_type=content.content_type,
                workspace=workspace,
                path=path,
                comments=comments,
                comment_count=len(comments),
                author=author,
                last_modifier=last_modifier,
                sub_content_types=content.sub_content_types,
                is_archived=content.is_archived,
                is_deleted=content.is_deleted,
                is_editable=content.is_editable,
                show_in_ui=content.show_in_ui,
                file_extension=content.file_extension,
                filename=content.filename,
                modified=content.modified,
                created=content.created,
                score=self.DEFAULT_SCORE,
                current_revision_id=content.current_revision_id,
                current_revision_type=content.current_revision_type,
                workspace_id=content.workspace_id,
                active_shares=content.actives_shares,
                content_size=content.size,
                parent_id=content.parent_id,
            )
            contents.append(content)
        super().__init__(contents=contents, total_hits=total_hits, is_total_hits_accurate=False)
