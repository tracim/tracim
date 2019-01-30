# -*- coding: utf-8 -*-
import typing
from enum import Enum

from tracim_backend.exceptions import ContentStatusNotExist
from tracim_backend.exceptions import ContentTypeNotExist
from tracim_backend.extensions import app_list
####
# Content Status
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.utils.translation import translator_marker
from tracim_backend.models.roles import WorkspaceRoles

if typing.TYPE_CHECKING:
    from tracim_backend.app_models.applications import Application

class GlobalStatus(Enum):
    OPEN = 'open'
    CLOSED = 'closed'


class ContentStatus(object):
    """
    ContentStatus object class
    """
    def __init__(
            self,
            slug: str,
            global_status: str,
            label: str,
            fa_icon: str,
            hexcolor: str,
    ):
        self.slug = slug
        self.global_status = global_status
        self.label = label
        self.fa_icon = fa_icon
        self.hexcolor = hexcolor

    def is_editable(self):
        return self.global_status == GlobalStatus.OPEN.value

_ = translator_marker

open_status = ContentStatus(
    slug='open',
    global_status=GlobalStatus.OPEN.value,
    label=_('Open'),
    fa_icon='square-o',
    hexcolor='#3f52e3',
)

closed_validated_status = ContentStatus(
    slug='closed-validated',
    global_status=GlobalStatus.CLOSED.value,
    label=_('Validated'),
    fa_icon='check-square-o',
    hexcolor='#008000',
)

closed_unvalidated_status = ContentStatus(
    slug='closed-unvalidated',
    global_status=GlobalStatus.CLOSED.value,
    label=_('Cancelled'),
    fa_icon='close',
    hexcolor='#f63434',
)

closed_deprecated_status = ContentStatus(
    slug='closed-deprecated',
    global_status=GlobalStatus.CLOSED.value,
    label=_('Deprecated'),
    fa_icon='warning',
    hexcolor='#ababab',
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
        """ Get alls slugs"""
        return [item.slug for item in self._content_status]

    def get_all(self) -> typing.List[ContentStatus]:
        """ Get all status"""
        return [item for item in self._content_status]

    def get_default_status(self) -> ContentStatus:
        return self.OPEN


content_status_list = ContentStatusList(
    [
        closed_validated_status,
        closed_unvalidated_status,
        closed_deprecated_status,
    ]
)
####
# ContentType


class ContentType(object):
    """
    Future ContentType object class
    """
    def __init__(
            self,
            slug: str,
            fa_icon: str,
            hexcolor: str,
            label: str,
            creation_label: str,
            available_statuses: typing.List[ContentStatus],
            slug_alias: typing.List[str] = None,
            allow_sub_content: bool = False,
            file_extension: typing.Optional[str] = None,
            minimal_role_content_creation: WorkspaceRoles = WorkspaceRoles.CONTRIBUTOR
    ):
        self.slug = slug
        self.fa_icon = fa_icon
        self.hexcolor = hexcolor
        self.label = label
        self.creation_label = creation_label
        self.available_statuses = available_statuses
        self.slug_alias = slug_alias
        self.allow_sub_content = allow_sub_content
        self.file_extension = file_extension
        self.minimal_role_content_creation = minimal_role_content_creation


THREAD_TYPE = 'thread'
FILE_TYPE = 'file'
MARKDOWNPLUSPAGE_TYPE = 'markdownpage'
HTML_DOCUMENTS_TYPE = 'html-document'
FOLDER_TYPE = 'folder'

# TODO - G.M - 31-05-2018 - Set Better Event params
event_type = ContentType(
    slug='event',
    fa_icon='',
    hexcolor='',
    label='Event',
    creation_label='Event',
    available_statuses=content_status_list.get_all(),
)

# TODO - G.M - 31-05-2018 - Set Better Event params
comment_type = ContentType(
    slug='comment',
    fa_icon='',
    hexcolor='',
    label='Comment',
    creation_label='Comment',
    available_statuses=content_status_list.get_all(),
)


class ContentTypeList(object):
    """
    ContentType List
    """
    Any_SLUG = 'any'
    Comment = comment_type
    Event = event_type

    @property
    def Folder(self):
        return self.get_one_by_slug(FOLDER_TYPE)

    @property
    def File(self):
        return self.get_one_by_slug(FILE_TYPE)

    @property
    def Page(self):
        return self.get_one_by_slug(HTML_DOCUMENTS_TYPE)

    @property
    def Thread(self):
        return self.get_one_by_slug(THREAD_TYPE)

    def __init__(self, app_list: typing.List['Application']):
        self.app_list = app_list
        self._special_contents_types = [self.Comment]
        self._extra_slugs = [self.Any_SLUG]

    @property
    def _content_types(self):
        app_api = ApplicationApi(self.app_list)
        content_types = app_api.get_content_types()
        return content_types

    def get_one_by_slug(self, slug: str) -> ContentType:
        """
        Get ContentType object according to slug
        match for both slug and slug_alias
        """
        content_types = self._content_types.copy()
        content_types.extend(self._special_contents_types)
        content_types.append(self.Event)
        for item in content_types:
            if item.slug == slug or (item.slug_alias and slug in item.slug_alias):  # nopep8
                return item
        raise ContentTypeNotExist()

    def restricted_allowed_types_slug(self) -> typing.List[str]:
        """
        Return restricted list of content_type: don't return
        "any" slug, dont return content type slug alias , don't return event.
        Useful to restrict slug param in schema.
        """
        allowed_type_slug = [contents_type.slug for contents_type in self._content_types]  # nopep8
        return allowed_type_slug

    def endpoint_allowed_types(self) -> typing.List[ContentType]:
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
        allowed_type_slug = [contents_type.slug for contents_type in content_types]  # nopep8
        return allowed_type_slug

    def query_allowed_types_slugs(self) -> typing.List[str]:
        """
        Return alls allowed types slug : content_type slug + all alias, any
        and special content_type like comment. Do not return event.
        Usefull allowed value to perform query to database.
        """
        allowed_types_slug = []
        content_types = self._content_types
        content_types.extend(self._special_contents_types)
        for content_type in content_types:
            allowed_types_slug.append(content_type.slug)
            if content_type.slug_alias:
                allowed_types_slug.extend(content_type.slug_alias)
        allowed_types_slug.extend(self._extra_slugs)
        return allowed_types_slug

    def default_allowed_content_properties(self, slug) -> dict:
        content_type = self.get_one_by_slug(slug)
        if content_type.allow_sub_content:
            sub_content_allowed = self.endpoint_allowed_types_slug()
        else:
            sub_content_allowed = [self.Comment.slug]

        properties_dict = {}
        for elem in sub_content_allowed:
            properties_dict[elem] = True
        return properties_dict


content_type_list = ContentTypeList(app_list)
