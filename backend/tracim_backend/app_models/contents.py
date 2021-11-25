# -*- coding: utf-8 -*-
from enum import Enum
import typing
from typing import List

####
# Content Status
from tracim_backend.exceptions import ContentStatusNotExist
from tracim_backend.exceptions import ContentTypeNotExist
from tracim_backend.extensions import app_list
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.utils.app import TracimApplication  # noqa:F401
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.lib.utils.translation import translator_marker as _
from tracim_backend.models.roles import WorkspaceRoles

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG


class GlobalStatus(Enum):
    OPEN = "open"
    CLOSED = "closed"


class ContentStatus(object):
    """
    ContentStatus object class
    """

    def __init__(
        self, slug: str, global_status: str, label: str, fa_icon: str, hexcolor: str
    ) -> None:
        self.slug = slug
        self.global_status = global_status
        self.label = label
        self.fa_icon = fa_icon
        self.hexcolor = hexcolor

    def is_editable(self) -> bool:
        return self.global_status == GlobalStatus.OPEN.value


open_status = ContentStatus(
    slug="open",
    global_status=GlobalStatus.OPEN.value,
    label=_("Opened"),
    fa_icon="far fa-square",
    hexcolor="#3f52e3",
)

closed_validated_status = ContentStatus(
    slug="closed-validated",
    global_status=GlobalStatus.CLOSED.value,
    label=_("Validated"),
    fa_icon="far fa-check-square",
    hexcolor="#008000",
)

closed_unvalidated_status = ContentStatus(
    slug="closed-unvalidated",
    global_status=GlobalStatus.CLOSED.value,
    label=_("Cancelled"),
    fa_icon="fas fa-times",
    hexcolor="#f63434",
)

closed_deprecated_status = ContentStatus(
    slug="closed-deprecated",
    global_status=GlobalStatus.CLOSED.value,
    label=_("Deprecated"),
    fa_icon="fas fa-exclamation-triangle",
    hexcolor="#ababab",
)


class ContentStatusList(object):

    OPEN = open_status

    def __init__(self, extend_content_status: typing.List[ContentStatus]):
        self._content_status = [self.OPEN]
        self._content_status.extend(extend_content_status)

    def get_one_by_slug(self, slug: str) -> ContentStatus:
        for item in self._content_status:
            if item.slug == slug:
                return item
        raise ContentStatusNotExist()

    def get_all_slugs_values(self) -> typing.List[str]:
        """ Get all slugs"""
        return [item.slug for item in self._content_status]

    def get_all(self) -> typing.List[ContentStatus]:
        """ Get all status"""
        return [item for item in self._content_status]

    def get_default_status(self) -> ContentStatus:
        return self.OPEN


content_status_list = ContentStatusList(
    [closed_validated_status, closed_unvalidated_status, closed_deprecated_status]
)
####
# ContentType


class ContentTypeInContext(object):
    """
    Future ContentType object class
    """

    def __init__(self, app_config: "CFG", content_type: "TracimContentType") -> None:
        self.content_type = content_type
        self.app_config = app_config

    @property
    def label(self) -> str:
        return self.content_type.label

    @property
    def slug(self) -> str:
        return self.content_type.slug

    @property
    def fa_icon(self) -> str:
        return self.content_type.fa_icon

    @property
    def hexcolor(self) -> str:
        if self.content_type.app:
            app_api = ApplicationApi(app_list)
            return app_api.get_application_in_context(
                self.content_type.app, self.app_config
            ).hexcolor
        return ""

    @property
    def creation_label(self) -> str:
        return self.content_type.creation_label

    @property
    def available_statuses(self) -> typing.List[ContentStatus]:
        return self.content_type.available_statuses

    @property
    def slug_aliases(self) -> typing.List[str]:
        return self.content_type.slug_aliases

    @property
    def minimal_role_content_creation(self) -> WorkspaceRoles:
        return self.content_type.minimal_role_content_creation

    @property
    def file_extension(self) -> str:
        return self.content_type.file_extension


THREAD_TYPE = "thread"
FILE_TYPE = "file"
MARKDOWNPLUSPAGE_TYPE = "markdownpage"
HTML_DOCUMENTS_TYPE = "html-document"
FOLDER_TYPE = "folder"
COMMENT_TYPE = "comment"
KANBAN_TYPE = "kanban"


# TODO - G.M - 31-05-2018 - Set Better Comment params
comment_type = TracimContentType(
    slug=COMMENT_TYPE,
    fa_icon="",
    label="Comment",
    creation_label="Comment",
    available_statuses=content_status_list.get_all(),
)


class ContentTypeList(object):
    """
    ContentType List
    """

    Any_SLUG = "any"
    Comment = comment_type

    @property
    def Folder(self) -> TracimContentType:
        return self.get_one_by_slug(FOLDER_TYPE)

    @property
    def File(self) -> TracimContentType:
        return self.get_one_by_slug(FILE_TYPE)

    @property
    def Page(self) -> TracimContentType:
        return self.get_one_by_slug(HTML_DOCUMENTS_TYPE)

    @property
    def Thread(self) -> TracimContentType:
        return self.get_one_by_slug(THREAD_TYPE)

    def __init__(self, app_list: typing.List["TracimApplication"]):
        self.app_list = app_list
        self._special_contents_types = [self.Comment]
        self._extra_slugs = [self.Any_SLUG]

    @property
    def _content_types(self) -> List[TracimContentType]:
        app_api = ApplicationApi(self.app_list)
        content_types = app_api.get_content_types()
        return content_types

    def get_one_by_slug(self, slug: str) -> TracimContentType:
        """
        Get ContentType object according to slug
        match for both slug and slug_aliases
        """
        content_types = self._content_types.copy()
        content_types.extend(self._special_contents_types)
        for item in content_types:
            if item.slug == slug or (item.slug_aliases and slug in item.slug_aliases):
                return item
        raise ContentTypeNotExist("Content-type does not exist/is disabled: {}".format(slug))

    def restricted_allowed_types_slug(self) -> typing.List[str]:
        """
        Return restricted list of content_type: don't return
        "any" slug, dont return content type slug alias , don't return event.
        Useful to restrict slug param in schema.
        """
        allowed_type_slug = [contents_type.slug for contents_type in self._content_types]
        return allowed_type_slug

    def endpoint_allowed_types(self) -> typing.List[TracimContentType]:
        """
        Same as restricted_allowed_types_slug but return
        ContentType instead of str slug
        and add special content_type included like comments.
        """
        content_types = self._content_types
        content_types.extend(self._special_contents_types)
        return content_types

    def endpoint_allowed_types_slug(self) -> typing.List[str]:
        """
        same as endpoint_allowed_types but return str slug
        instead of ContentType
        """
        content_types = self.endpoint_allowed_types()
        allowed_type_slug = [contents_type.slug for contents_type in content_types]
        return allowed_type_slug

    def query_allowed_types_slugs(self) -> typing.List[str]:
        """
        Return all allowed types slug : content_type slug + all alias, any
        and special content_type like comment. Do not return event.
        Usefull allowed value to perform query to database.
        """
        allowed_types_slug = []
        content_types = self._content_types
        content_types.extend(self._special_contents_types)
        for content_type in content_types:
            allowed_types_slug.append(content_type.slug)
            if content_type.slug_aliases:
                allowed_types_slug.extend(content_type.slug_aliases)
        allowed_types_slug.extend(self._extra_slugs)
        return allowed_types_slug

    def default_allowed_content_properties(self, slug: str) -> dict:
        allowed_sub_contents = self.endpoint_allowed_types_slug()
        properties_dict = {}
        for elem in allowed_sub_contents:
            properties_dict[elem] = True
        return properties_dict

    def get_content_type_in_context(
        self, content_type: TracimContentType, app_config: "CFG"
    ) -> ContentTypeInContext:
        return ContentTypeInContext(content_type=content_type, app_config=app_config)


content_type_list = ContentTypeList(app_list)
