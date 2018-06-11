# -*- coding: utf-8 -*-
import typing
from enum import Enum

from tracim.exceptions import ContentStatusNotExist, ContentTypeNotExist
from tracim.models.applications import htmlpage, file, thread, markdownpluspage


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
            icon: str,
            hexcolor: str,
    ):
        self.slug = slug
        self.global_status = global_status
        self.label = label
        self.icon = icon
        self.hexcolor = hexcolor


open_status = NewContentStatus(
    slug='open',
    global_status=GlobalStatus.OPEN.value,
    label='Open',
    icon='fa-square-o',
    hexcolor='#000FF',
)

closed_validated_status = NewContentStatus(
    slug='closed-validated',
    global_status=GlobalStatus.CLOSED.value,
    label='Validated',
    icon='fa-check-square-o',
    hexcolor='#000FF',
)

closed_unvalidated_status = NewContentStatus(
    slug='closed-unvalidated',
    global_status=GlobalStatus.CLOSED.value,
    label='Cancelled',
    icon='fa-close',
    hexcolor='#000FF',
)

closed_deprecated_status = NewContentStatus(
    slug='closed-deprecated',
    global_status=GlobalStatus.CLOSED.value,
    label='Deprecated',
    icon='fa-warning',
    hexcolor='#000FF',
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
                    icon=status.icon,
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
            icon: str,
            hexcolor: str,
            label: str,
            creation_label: str,
            available_statuses: typing.List[NewContentStatus],

    ):
        self.slug = slug
        self.icon = icon
        self.hexcolor = hexcolor
        self.label = label
        self.creation_label = creation_label
        self.available_statuses = available_statuses


thread_type = NewContentType(
    slug='thread',
    icon=thread.icon,
    hexcolor=thread.hexcolor,
    label='Thread',
    creation_label='Discuss about a topic',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

file_type = NewContentType(
    slug='file',
    icon=file.icon,
    hexcolor=file.hexcolor,
    label='File',
    creation_label='Upload a file',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

markdownpluspage_type = NewContentType(
    slug='markdownpage',
    icon=markdownpluspage.icon,
    hexcolor=markdownpluspage.hexcolor,
    label='Rich Markdown File',
    creation_label='Create a Markdown document',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

htmlpage_type = NewContentType(
    slug='page',
    icon=htmlpage.icon,
    hexcolor=htmlpage.hexcolor,
    label='Text Document',
    creation_label='Write a document',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

# TODO - G.M - 31-05-2018 - Set Better folder params
folder_type = NewContentType(
    slug='folder',
    icon=thread.icon,
    hexcolor=thread.hexcolor,
    label='Folder',
    creation_label='Create collection of any documents',
    available_statuses=CONTENT_DEFAULT_STATUS,
)

CONTENT_DEFAULT_TYPE = [
    thread_type,
    file_type,
    markdownpluspage_type,
    htmlpage_type,
    folder_type,
]


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
    Page = htmlpage_type.slug

    def __init__(self, slug: str):
        for content_type in CONTENT_DEFAULT_TYPE:
            if slug == content_type.slug:
                super(ContentTypeLegacy, self).__init__(
                    slug=content_type.slug,
                    icon=content_type.icon,
                    hexcolor=content_type.hexcolor,
                    label=content_type.label,
                    creation_label=content_type.creation_label,
                    available_statuses=content_type.available_statuses
                )
                return
        raise ContentTypeNotExist()

    @classmethod
    def all(cls) -> typing.List[str]:
        return cls.allowed_types()

    @classmethod
    def allowed_types(cls) -> typing.List[str]:
        contents_types = [status.slug for status in CONTENT_DEFAULT_TYPE]
        contents_types.extend([cls.Folder, cls.Event, cls.Comment])
        return contents_types

    @classmethod
    def allowed_types_for_folding(cls):
        # This method is used for showing only "main"
        # types in the left-side treeview
        contents_types = [status.slug for status in CONTENT_DEFAULT_TYPE]
        contents_types.extend([cls.Folder])
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
