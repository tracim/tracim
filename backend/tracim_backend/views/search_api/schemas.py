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
from tracim_backend.views.core_api.schemas import StringList
from tracim_backend.views.core_api.schemas import StrippedString
from tracim_backend.views.core_api.schemas import UserInfoContentAbstractSchema

# from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import AdvancedContentSearchParameters


class SearchContentField(Enum):
    LABEL = "label"
    RAW_CONTENT = "raw_content"
    COMMENT = "comment"
    DESCRIPTION = "description"


class ContentSearchFilterQuery(object):
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

        if not content_types:
            self.content_types = content_type_list.restricted_allowed_types_slug()

        self.show_deleted = bool(show_deleted)
        self.show_archived = bool(show_archived)
        self.show_active = bool(show_active)


class ContentSearchFilterQuerySchema(marshmallow.Schema):
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

    # @post_load
    # def make_search_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
    # return ContentSearchFilterQuery(
    # search_string=data["search_string"],
    # size=data["size"],
    # page_nb=data["page_nb"],
    # content_types=data["content_types"],
    # show_archived=data["show_archived"],
    # show_deleted=data["show_deleted"],
    # show_active=data["show_active"],
    # )


class EnumField(marshmallow.fields.Field):
    def __init__(self, enum_cls: typing.Type[Enum], **kwargs):
        super().__init__(**kwargs)
        self._enum = enum_cls

    def _deserialize(self, value: str, *arg: typing.Any, **kwargs: typing.Any):
        for val in self._enum.__members__.values():
            if value == val.value:
                return val

        raise marshmallow.ValidationError("{} is not a valid value for this field".format(value))

    def _serialize(self, value: Enum, *arg: typing.Any, **kwargs: typing.Any) -> str:
        if value not in self._enum:
            raise marshmallow.ValidationError(
                "{} is not a valid value for this field".format(value)
            )

        return value.value


class AdvancedContentSearchFilterQuerySchema(ContentSearchFilterQuerySchema):
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
    updated_from = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)
    updated_to = marshmallow.fields.DateTime(required=False, format=DATETIME_FORMAT)

    # @post_load
    # def make_advanced_search_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
    # return AdvancedContentSearchParameters(
    # workspace_names=data["workspace_names"],
    # author__public_names=data["author__public_names"],
    # last_modifier__public_names=data["last_modifier__public_names"],
    # file_extensions=data["file_extensions"],
    # search_fields=data["search_fields"],
    # statuses=data["statuses"],
    # created_from=data["created_from"],
    # created_to=data["created_to"],
    # updated_from=data["updated_from"],
    # updated_to=data["updated_to"],
    # )


class WorkspaceSearchSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)
    slug = StrippedString(example="intranet")
    label = StrippedString(example="Intranet")


class ContentSearchSchema(ContentDigestSchema, UserInfoContentAbstractSchema):
    score = marshmallow.fields.Float()
    workspace = marshmallow.fields.Nested(WorkspaceSearchSchema)
    path = marshmallow.fields.List(marshmallow.fields.Nested(ContentMinimalSchema))
    is_active = marshmallow.fields.Boolean()
    comments_count = marshmallow.fields.Integer(example=12, validate=positive_int_validator)
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
            FacetCountSchema(), description="search matches contents in these workspaces",
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
            FacetCountSchema(), description="search matches contents with these file extensions",
        )
    )
    statuses = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(), description="search matches contents with these statuses",
        )
    )
    created_from = marshmallow.fields.DateTime(format=DATETIME_FORMAT)
    created_to = marshmallow.fields.DateTime(format=DATETIME_FORMAT)
    modified_from = marshmallow.fields.DateTime(format=DATETIME_FORMAT)
    modified_to = marshmallow.fields.DateTime(format=DATETIME_FORMAT)


class AdvancedContentSearchResultSchema(ContentSearchResultSchema):
    search_fields = marshmallow.fields.List(
        marshmallow.fields.String(), description="search was performed in these fields"
    )
    simple_facets = marshmallow.fields.Nested(
        ContentSimpleFacetsSchema(), description="search matched content with these characteristics"
    )
