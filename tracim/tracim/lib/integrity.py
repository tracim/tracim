# -*- coding: utf-8 -*-
import os

from sqlalchemy import func
from tg import tmpl_context
from tg.render import render
from tracim.lib.content import ContentApi
from tracim.lib.workspace import UnsafeWorkspaceApi
from tracim.model.data import Workspace
from tracim.model.data import Content
from tracim.model.serializers import DictLikeClass, Context, CTX


class PathValidationManager(object):
    def __init__(self, is_case_sensitive: bool=False):
        """
        :param is_case_sensitive: If True, consider name with different
        case as different.
        """
        self._is_case_sensitive = is_case_sensitive
        self._workspace_api = UnsafeWorkspaceApi(None)
        self._content_api = ContentApi(None)

    def workspace_label_is_free(self, workspace_name: str) -> bool:
        """
        :param workspace_name: Workspace name
        :return: True if workspace is available
        """
        query = self._workspace_api.get_base_query()

        label_filter = Workspace.label == workspace_name
        if not self._is_case_sensitive:
            label_filter = func.lower(Workspace.label) == \
                           func.lower(workspace_name)

        return not bool(query.filter(label_filter).count())

    def content_label_is_free(
            self,
            content_label_as_file,
            workspace: Workspace,
            parent: Content=None,
            exclude_content_id: int=None,
    ) -> bool:
        """
        :param content_label_as_file:
        :param workspace:
        :param parent:
        :return: True if content label is available
        """
        query = self._content_api.get_base_query(workspace)

        if parent:
            query = query.filter(Content.parent_id == parent.content_id)

        if exclude_content_id:
            query = query.filter(Content.content_id != exclude_content_id)

        query = query.filter(Content.workspace_id == workspace.workspace_id)

        return not \
            bool(
                self._content_api.filter_query_for_content_label_as_path(
                    query=query,
                    content_label_as_file=content_label_as_file,
                    is_case_sensitive=self._is_case_sensitive,
                ).count()
            )

    def validate_new_content(self, content: Content) -> bool:
        """
        :param content: Content with label to test
        :return: True if content label is not in conflict with existing
        resource
        """
        return self.content_label_is_free(
            content_label_as_file=content.get_label_as_file(),
            workspace=content.workspace,
            parent=content.parent,
            exclude_content_id=content.content_id,
        )


def render_invalid_integrity_chosen_path(invalid_label: str) -> str:
    """
    Return html page code of error about invalid label choice.
    :param invalid_label: the invalid label
    :return: html page code
    """
    user = tmpl_context.current_user
    fake_api_content = DictLikeClass(
        current_user=user,
    )
    fake_api = Context(CTX.USER).toDict(fake_api_content)

    return render(
        template_vars=dict(
            invalid_label=invalid_label,
            fake_api=fake_api,
        ),
        template_engine='mako',
        template_name='tracim.templates.errors.label_invalid_path',
    )
