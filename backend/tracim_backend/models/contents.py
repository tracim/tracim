# -*- coding: utf-8 -*-
import typing
from enum import Enum

from tracim_backend.exceptions import ContentTypeNotExist
from tracim_backend.exceptions import ContentStatusNotExist
from tracim_backend.models.applications import html_documents
from tracim_backend.models.applications import _file
from tracim_backend.models.applications import folder
from tracim_backend.models.applications import thread
from tracim_backend.models.applications import markdownpluspage


####
# Content Status


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


open_status = ContentStatus(
    slug='open',
    global_status=GlobalStatus.OPEN.value,
    label='Open',
    fa_icon='square-o',
    hexcolor='#3f52e3',
)

closed_validated_status = ContentStatus(
    slug='closed-validated',
    global_status=GlobalStatus.CLOSED.value,
    label='Validated',
    fa_icon='check-square-o',
    hexcolor='#008000',
)

closed_unvalidated_status = ContentStatus(
    slug='closed-unvalidated',
    global_status=GlobalStatus.CLOSED.value,
    label='Cancelled',
    fa_icon='close',
    hexcolor='#f63434',
)

closed_deprecated_status = ContentStatus(
    slug='closed-deprecated',
    global_status=GlobalStatus.CLOSED.value,
    label='Deprecated',
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


CONTENT_STATUS = ContentStatusList(
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
    ):
        self.slug = slug
        self.fa_icon = fa_icon
        self.hexcolor = hexcolor
        self.label = label
        self.creation_label = creation_label
        self.available_statuses = available_statuses
        self.slug_alias = slug_alias
        self.allow_sub_content = allow_sub_content


thread_type = ContentType(
    slug='thread',
    fa_icon=thread.fa_icon,
    hexcolor=thread.hexcolor,
    label='Thread',
    creation_label='Discuss about a topic',
    available_statuses=CONTENT_STATUS.get_all(),
)

file_type = ContentType(
    slug='file',
    fa_icon=_file.fa_icon,
    hexcolor=_file.hexcolor,
    label='File',
    creation_label='Upload a file',
    available_statuses=CONTENT_STATUS.get_all(),
)

markdownpluspage_type = ContentType(
    slug='markdownpage',
    fa_icon=markdownpluspage.fa_icon,
    hexcolor=markdownpluspage.hexcolor,
    label='Rich Markdown File',
    creation_label='Create a Markdown document',
    available_statuses=CONTENT_STATUS.get_all(),
)

html_documents_type = ContentType(
    slug='html-document',
    fa_icon=html_documents.fa_icon,
    hexcolor=html_documents.hexcolor,
    label='Text Document',
    creation_label='Write a document',
    available_statuses=CONTENT_STATUS.get_all(),
    slug_alias=['page']
)

# TODO - G.M - 31-05-2018 - Set Better folder params
folder_type = ContentType(
    slug='folder',
    fa_icon=folder.fa_icon,
    hexcolor=folder.hexcolor,
    label='Folder',
    creation_label='Create a folder',
    available_statuses=CONTENT_STATUS.get_all(),
    allow_sub_content=True,
)


# TODO - G.M - 31-05-2018 - Set Better Event params
event_type = ContentType(
    slug='event',
    fa_icon=thread.fa_icon,
    hexcolor=thread.hexcolor,
    label='Event',
    creation_label='Event',
    available_statuses=CONTENT_STATUS.get_all(),
)

# TODO - G.M - 31-05-2018 - Set Better Event params
comment_type = ContentType(
    slug='comment',
    fa_icon=thread.fa_icon,
    hexcolor=thread.hexcolor,
    label='Comment',
    creation_label='Comment',
    available_statuses=CONTENT_STATUS.get_all(),
)


class ContentTypeList(object):
    """
    ContentType List
    """
    Any_SLUG = 'any'
    Folder = folder_type
    Comment = comment_type
    Event = event_type
    File = file_type
    Page = html_documents_type
    Thread = thread_type

    def __init__(self, extend_content_status: typing.List[ContentType]):
        self._content_types = [self.Folder]
        self._content_types.extend(extend_content_status)
        self._special_contents_types = [self.Comment]
        self._extra_slugs = [self.Any_SLUG]

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

    def endpoint_allowed_types_slug(self) -> typing.List[str]:
        """
        Return restricted list of content_type:
        dont return special content_type like  comment, don't return
        "any" slug, dont return content type slug alias , don't return event.
        Useful to restrict slug param in schema.
        """
        allowed_type_slug = [contents_type.slug for contents_type in self._content_types]  # nopep8
        return allowed_type_slug

    def extended_endpoint_allowed_types_slug(self) -> typing.List[str]:
        allowed_types_slug = self.endpoint_allowed_types_slug().copy()
        for content_type in self._special_contents_types:
            allowed_types_slug.append(content_type.slug)
        return allowed_types_slug

    def query_allowed_types_slugs(self) -> typing.List[str]:
        """
        Return alls allowed types slug : content_type slug + all alias, any
        and special content_type like comment. Do not return event.
        Usefull allowed value to perform query to database.
        """
        allowed_types_slug = []
        for content_type in self._content_types:
            allowed_types_slug.append(content_type.slug)
            if content_type.slug_alias:
                allowed_types_slug.extend(content_type.slug_alias)
        for content_type in self._special_contents_types:
            allowed_types_slug.append(content_type.slug)
        allowed_types_slug.extend(self._extra_slugs)
        return allowed_types_slug

    def default_allowed_content_properties(self, slug) -> dict:
        content_type = self.get_one_by_slug(slug)
        if content_type.allow_sub_content:
            sub_content_allowed = self.extended_endpoint_allowed_types_slug()
        else:
            sub_content_allowed = [self.Comment.slug]

        properties_dict = {}
        for elem in sub_content_allowed:
            properties_dict[elem] = True
        return properties_dict


CONTENT_TYPES = ContentTypeList(
    [
        thread_type,
        file_type,
        # TODO - G.M - 2018-08-02 - Restore markdown page content
        #    markdownpluspage_type,
        html_documents_type,
    ]
)
