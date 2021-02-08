import typing

import marshmallow
from marshmallow import post_load

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.validator import all_content_types_validator
from tracim_backend.app_models.validator import bool_as_int_validator
from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.app_models.validator import regex_string_as_list_of_string
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.lib.utils.utils import string_to_list
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import StrippedString


class SearchFilterQuery(object):
    def __init__(
        self,
        size: int = 10,
        page_nb: int = 1,
        search_string: str = "",
        content_types: typing.Optional[str] = None,
        show_deleted: int = 0,
        show_archived: int = 0,
        show_active: int = 1,
    ):
        self.search_string = search_string
        self.size = size
        self.page_nb = page_nb
        if not content_types:
            self.content_types = content_type_list.restricted_allowed_types_slug()
        else:
            self.content_types = string_to_list(content_types, ",", str)
        self.show_deleted = bool(show_deleted)
        self.show_archived = bool(show_archived)
        self.show_active = bool(show_active)


class SearchFilterQuerySchema(marshmallow.Schema):
    search_string = StrippedString(
        example="test", description="just a search string", required=False
    )
    size = marshmallow.fields.Int(
        required=False, default=10, validate=strictly_positive_int_validator
    )
    page_nb = marshmallow.fields.Int(
        required=False, default=1, validate=strictly_positive_int_validator
    )
    content_types = StrippedString(
        required=False, validate=regex_string_as_list_of_string, description="content_types to show"
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

    @post_load
    def make_search_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
        return SearchFilterQuery(**data)


class AdvancedSearchFilterQuerySchema(SearchFilterQuerySchema):
    workspace_names = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents in these workspaces",
    )
    author_public_names = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents by these authors",
    )
    last_modifier_public_names = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents by these authors",
    )
    file_extensions = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents with these file extensions",
    )
    search_fields = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="search within these fields"
        # FIXME restrict to "label", "raw_content", "comments", "description",
    )
    statuses = StrippedString(
        required=False,
        validate=regex_string_as_list_of_string,
        description="select contents with these statuses",
    )
    created_from = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)
    created_to = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)
    updated_from = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)
    updated_to = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)


class WorkspaceSearchSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)
    slug = StrippedString(example="intranet")
    label = StrippedString(example="Intranet")


class ContentDigestSearchSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    slug = StrippedString(example="intervention-report-12")
    parent_id = marshmallow.fields.Int(
        example=34, allow_none=True, default=None, validate=positive_int_validator
    )
    workspace_id = marshmallow.fields.Int(example=19, validate=strictly_positive_int_validator)
    label = StrippedString(example="Intervention Report 12")
    content_type = StrippedString(example="html-document", validate=all_content_types_validator)


class ContentSearchSchema(ContentSchema):
    score = marshmallow.fields.Float()
    workspace = marshmallow.fields.Nested(WorkspaceSearchSchema)
    parents = marshmallow.fields.List(marshmallow.fields.Nested(ContentDigestSearchSchema))
    parent = marshmallow.fields.Nested(ContentDigestSearchSchema, allow_none=True)
    is_active = marshmallow.fields.Boolean()


class ContentSearchResultSchema(marshmallow.Schema):
    contents = marshmallow.fields.Nested(ContentSearchSchema, many=True)
    total_hits = marshmallow.fields.Integer()
    is_total_hits_accurate = marshmallow.fields.Boolean()
