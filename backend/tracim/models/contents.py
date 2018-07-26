# -*- coding: utf-8 -*-
import typing
from enum import Enum

from tracim.exceptions import ContentTypeNotExist
from tracim.exceptions import ContentStatusNotExist
from tracim.models.applications import html_documents
from tracim.models.applications import _file
from tracim.models.applications import thread
from tracim.models.applications import markdownpluspage


####
# Content Status


class GlobalStatus(Enum):
    OPEN = 'open'
    CLOSED = 'closed'


class NewContentStatus(object):
    """
    Future ContentStatus object class
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


open_status = NewContentStatus(
    slug='open',
    global_status=GlobalStatus.OPEN.value,
    label='Open',
    fa_icon='square-o',
    hexcolor='#3f52e3',
)

closed_validated_status = NewContentStatus(
    slug='closed-validated',
    global_status=GlobalStatus.CLOSED.value,
    label='Validated',
    fa_icon='check-square-o',
    hexcolor='#008000',
)

closed_unvalidated_status = NewContentStatus(
    slug='closed-unvalidated',
    global_status=GlobalStatus.CLOSED.value,
    label='Cancelled',
    fa_icon='close',
    hexcolor='#f63434',
)

closed_deprecated_status = NewContentStatus(
    slug='closed-deprecated',
    global_status=GlobalStatus.CLOSED.value,
    label='Deprecated',
    fa_icon='warning',
    hexcolor='#ababab',
)


CONTENT_DEFAULT_STATUS = [
    open_status,
    closed_validated_status,
    closed_unvalidated_status,
    closed_deprecated_status,
]


class ContentStatusLegacy(NewContentStatus):
    """
    Temporary remplacement object for Legacy ContentStatus Object
    """
    OPEN = open_status.slug
    CLOSED_VALIDATED = closed_validated_status.slug
    CLOSED_UNVALIDATED = closed_unvalidated_status.slug
    CLOSED_DEPRECATED = closed_deprecated_status.slug

    def __init__(self, slug: str):
        for status in CONTENT_DEFAULT_STATUS:
            if slug == status.slug:
                super(ContentStatusLegacy, self).__init__(
                    slug=status.slug,
                    global_status=status.global_status,
                    label=status.label,
                    fa_icon=status.fa_icon,
                    hexcolor=status.hexcolor,
                )
                return
        raise ContentStatusNotExist()

    @classmethod
    def all(cls, type='') -> ['NewContentStatus']:
        return CONTENT_DEFAULT_STATUS

    @classmethod
    def allowed_values(cls):
        return [status.slug for status in CONTENT_DEFAULT_STATUS]


####
# ContentType


class NewContentType(object):
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
            available_statuses: typing.List[NewContentStatus],

    ):
        self.slug = slug
        self.fa_icon = fa_icon
        self.hexcolor = hexcolor
        self.label = label
        self.creation_label = creation_label
        self.available_statuses = available_statuses


thread_type = NewContentType(
    slug='thread',
    fa_icon=thread.fa_icon,
    hexcolor=thread.hexcolor,
    label='Thread',
    creation_label='Discuss about a topic',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

file_type = NewContentType(
    slug='file',
    fa_icon=_file.fa_icon,
    hexcolor=_file.hexcolor,
    label='File',
    creation_label='Upload a file',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

markdownpluspage_type = NewContentType(
    slug='markdownpage',
    fa_icon=markdownpluspage.fa_icon,
    hexcolor=markdownpluspage.hexcolor,
    label='Rich Markdown File',
    creation_label='Create a Markdown document',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

html_documents_type = NewContentType(
    slug='html-documents',
    fa_icon=html_documents.fa_icon,
    hexcolor=html_documents.hexcolor,
    label='Text Document',
    creation_label='Write a document',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

# TODO - G.M - 31-05-2018 - Set Better folder params
folder_type = NewContentType(
    slug='folder',
    fa_icon=thread.fa_icon,
    hexcolor=thread.hexcolor,
    label='Folder',
    creation_label='Create collection of any documents',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

CONTENT_DEFAULT_TYPE = [
    thread_type,
    file_type,
    markdownpluspage_type,
    html_documents_type,
    folder_type,
]

# TODO - G.M - 31-05-2018 - Set Better Event params
event_type = NewContentType(
    slug='event',
    fa_icon=thread.fa_icon,
    hexcolor=thread.hexcolor,
    label='Event',
    creation_label='Event',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

# TODO - G.M - 31-05-2018 - Set Better Event params
comment_type = NewContentType(
    slug='comment',
    fa_icon=thread.fa_icon,
    hexcolor=thread.hexcolor,
    label='Comment',
    creation_label='Comment',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

CONTENT_DEFAULT_TYPE_SPECIAL = [
    event_type,
    comment_type,
]

ALL_CONTENTS_DEFAULT_TYPES = CONTENT_DEFAULT_TYPE + CONTENT_DEFAULT_TYPE_SPECIAL


class ContentTypeLegacy(NewContentType):
    """
    Temporary remplacement object for Legacy ContentType Object
    """

    # special type
    Any = 'any'
    Folder = 'folder'
    Event = 'event'
    Comment = 'comment'

    File = file_type.slug
    Thread = thread_type.slug
    Page = html_documents_type.slug
    PageLegacy = 'page'
    MarkdownPage = markdownpluspage_type.slug

    def __init__(self, slug: str):
        if slug == 'page':
            slug = ContentTypeLegacy.Page
        for content_type in ALL_CONTENTS_DEFAULT_TYPES:
            if slug == content_type.slug:
                super(ContentTypeLegacy, self).__init__(
                    slug=content_type.slug,
                    fa_icon=content_type.fa_icon,
                    hexcolor=content_type.hexcolor,
                    label=content_type.label,
                    creation_label=content_type.creation_label,
                    available_statuses=content_type.available_statuses
                )
                return
        raise ContentTypeNotExist()

    def get_slug_aliases(self) -> typing.List[str]:
        """
        Get all slug aliases of a content,
        useful for legacy code convertion
        """
        # TODO - G.M - 2018-07-05 - Remove this legacy compat code
        # when possible.
        page_alias = [self.Page, self.PageLegacy]
        if self.slug in page_alias:
            return page_alias
        else:
            return [self.slug]

    @classmethod
    def all(cls) -> typing.List[str]:
        return cls.allowed_types()

    @classmethod
    def allowed_types(cls) -> typing.List[str]:
        contents_types = [status.slug for status in ALL_CONTENTS_DEFAULT_TYPES]
        return contents_types

    @classmethod
    def allowed_type_values(cls) -> typing.List[str]:
        """
        All content type slug + special values like any
        """
        content_types = cls.allowed_types()
        content_types.append(ContentTypeLegacy.Any)
        return content_types

    @classmethod
    def allowed_types_for_folding(cls):
        # This method is used for showing only "main"
        # types in the left-side treeview
        contents_types = [status.slug for status in CONTENT_DEFAULT_TYPE]
        return contents_types

    # TODO - G.M - 30-05-2018 - This method don't do anything.
    @classmethod
    def sorted(cls, types: ['ContentType']) -> ['ContentType']:
        return types

    @property
    def id(self):
        return self.slug

    def toDict(self):
        raise NotImplementedError()
