from datetime import datetime
from enum import Enum
import typing

import marshmallow

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.validator import bool_as_int_validator
from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.app_models.validator import regex_string_as_list_of_string
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.lib.utils.utils import DATETIME_FORMAT
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import ContentMinimalSchema
from tracim_backend.views.core_api.schemas import EnumField
from tracim_backend.views.core_api.schemas import RestrictedStringField
from tracim_backend.views.core_api.schemas import StringList
from tracim_backend.views.core_api.schemas import StrippedString
from tracim_backend.views.core_api.schemas import UserInfoContentAbstractSchema


class SearchContentField(Enum):
    LABEL = "label"
    RAW_CONTENT = "raw_content"
    COMMENT = "comment"
    DESCRIPTION = "description"


filterable_content_types = content_type_list.restricted_allowed_types_slug()


class ContentSearchQuery(object):
    def __init__(
        self,
        size: int = 10,
        page_nb: int = 1,
        search_string: str = "",
        content_types: typing.Optional[typing.List[str]] = None,
        show_deleted: int = 0,
        show_archived: int = 0,
        show_active: int = 1,
    ):
        self.search_string = search_string
        self.size = size
        self.page_nb = page_nb

        self.content_types = content_types or filterable_content_types

        self.show_deleted = bool(show_deleted)
        self.show_archived = bool(show_archived)
        self.show_active = bool(show_active)


class AdvancedContentSearchQuery(ContentSearchQuery):
    def __init__(
        self,
        workspace_names: typing.Optional[typing.List[str]] = None,
        author__public_names: typing.Optional[typing.List[str]] = None,
        last_modifier__public_names: typing.Optional[typing.List[str]] = None,
        file_extensions: typing.Optional[typing.List[str]] = None,
        search_fields: typing.Optional[typing.List[str]] = None,
        statuses: typing.Optional[typing.List[str]] = None,
        created_from: typing.Optional[datetime] = None,
        created_to: typing.Optional[datetime] = None,
        modified_from: typing.Optional[datetime] = None,
        modified_to: typing.Optional[datetime] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)

        self.workspace_names = workspace_names
        self.author__public_names = author__public_names
        self.last_modifier__public_names = last_modifier__public_names
        self.file_extensions = file_extensions
        self.search_fields = search_fields
        self.statuses = statuses
        self.created_from = created_from
        self.created_to = created_to
        self.modified_from = modified_from
        self.modified_to = modified_to


class ContentSearchQuerySchema(marshmallow.Schema):
    search_string = StrippedString(
        example="test", description="just a search string", required=False
    )
    size = marshmallow.fields.Int(
        required=False, default=10, validate=strictly_positive_int_validator
    )
    page_nb = marshmallow.fields.Int(
        required=False, default=1, validate=strictly_positive_int_validator
    )
    content_types = StringList(
        RestrictedStringField(filterable_content_types),
        required=False,
        description="content_types to show",
    )
    show_archived = marshmallow.fields.Int(
        example=0,
        default=0,
        description="if set to 1, then show archived contents."
        " Default is 0 - hide archived content",
        validate=bool_as_int_validator,
    )
    show_deleted = marshmallow.fields.Int(
        example=0,
        default=0,
        description="if set to 1, then show deleted contents."
        " Default is 0 - hide deleted content",
        validate=bool_as_int_validator,
    )
    show_active = marshmallow.fields.Int(
        example=1,
        default=1,
        description="if set to 1, then show active contents. "
        "Default is 1 - show active content."
        " Note: active content are content "
        "that is neither archived nor deleted. "
        "The reason for this parameter to exist is for example "
        "to allow to show only archived documents",
        validate=bool_as_int_validator,
    )


class AdvancedContentSearchQuerySchema(ContentSearchQuerySchema):
    search_fields = StringList(
        EnumField(SearchContentField), required=False, description="search within these fields"
    )
    workspace_names = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents in these workspaces",
    )
    author__public_names = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents by these authors",
    )
    last_modifier__public_names = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents by these authors",
    )
    file_extensions = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents with these file extensions",
    )
    statuses = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents with these statuses",
    )
    created_from = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)
    created_to = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)
    modified_from = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)
    modified_to = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)


class WorkspaceSearchSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)
    slug = StrippedString(example="intranet")
    label = StrippedString(example="Intranet")


class ContentSearchSchema(ContentDigestSchema, UserInfoContentAbstractSchema):
    score = marshmallow.fields.Float()
    workspace = marshmallow.fields.Nested(WorkspaceSearchSchema)
    path = marshmallow.fields.List(marshmallow.fields.Nested(ContentMinimalSchema))
    is_active = marshmallow.fields.Boolean()
    comment_count = marshmallow.fields.Integer(example=12, validate=positive_int_validator)
    content_size = marshmallow.fields.Integer(
        example=1200, description="Content size in bytes", validate=positive_int_validator
    )


class ContentSearchResultSchema(marshmallow.Schema):
    contents = marshmallow.fields.Nested(ContentSearchSchema, many=True)
    total_hits = marshmallow.fields.Integer()
    is_total_hits_accurate = marshmallow.fields.Boolean()


class FacetCountSchema(marshmallow.Schema):
    key = marshmallow.fields.String("The value of this field")
    count = marshmallow.fields.Int("The number of results matching this value")


class ContentSimpleFacetsSchema(marshmallow.Schema):
    search_fields = marshmallow.fields.List(
        marshmallow.fields.String(description="search was performed in these fields")
    )
    workspace_names = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(),
            description="search matches contents in these workspaces",
        )
    )
    author__public_names = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(),
            description="search matches contents which have authors with these public names",
        )
    )
    last_modifier__public_names = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(),
            description="search matches contents last modified by authors with these public names",
        )
    )
    file_extensions = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(),
            description="search matches contents with these file extensions",
        )
    )
    statuses = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(),
            description="search matches contents with these statuses",
        )
    )
    created_from = marshmallow.fields.DateTime(format=DATETIME_FORMAT, required=False, missing=None)
    created_to = marshmallow.fields.DateTime(format=DATETIME_FORMAT, required=False, missing=None)
    modified_from = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, required=False, missing=None
    )
    modified_to = marshmallow.fields.DateTime(format=DATETIME_FORMAT, required=False, missing=None)


class AdvancedContentSearchResultSchema(ContentSearchResultSchema):
    simple_facets = marshmallow.fields.Nested(
        ContentSimpleFacetsSchema(), description="search matched content with these characteristics"
    )
