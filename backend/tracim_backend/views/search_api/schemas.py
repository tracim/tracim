from datetime import datetime
import typing

import marshmallow

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.validator import bool_as_int_validator
from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.lib.search.models import ContentSearchField
from tracim_backend.lib.search.models import UserSearchField
from tracim_backend.lib.search.models import WorkspaceSearchField
from tracim_backend.lib.utils.utils import DATETIME_FORMAT
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import ContentMinimalSchema
from tracim_backend.views.core_api.schemas import EnumField
from tracim_backend.views.core_api.schemas import StringList
from tracim_backend.views.core_api.schemas import StrippedString
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import UserInfoContentAbstractSchema
from tracim_backend.views.core_api.schemas import WorkspaceDigestSchema

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
        search_fields: typing.Optional[typing.List[ContentSearchField]] = None,
        statuses: typing.Optional[typing.List[str]] = None,
        created_from: typing.Optional[datetime] = None,
        created_to: typing.Optional[datetime] = None,
        modified_from: typing.Optional[datetime] = None,
        modified_to: typing.Optional[datetime] = None,
        **kwargs
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
        example="test",
        description="just a search string",
        required=False,
        allow_none=True,
        missing="",
        default_value="",
    )
    size = marshmallow.fields.Int(
        required=False, default=10, validate=strictly_positive_int_validator
    )
    page_nb = marshmallow.fields.Int(
        required=False, default=1, validate=strictly_positive_int_validator
    )

    # RJ - 2020-02-17 - TODO (#4186)
    # Ideally we would restrict strings allowed in content_types to known content types this way:
    #
    #   content_types = StringList(RestrictedStringField(filterable_content_types))
    #
    # However, in functional tests, since apps are not enabled, filterable_content_types is empty
    # and tests break.
    content_types = StringList(
        marshmallow.fields.String(), required=False, description="content_types to show",
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
        EnumField(ContentSearchField),
        required=False,
        allow_none=True,
        missing="",
        default_value="",
        description="search within these fields",
    )
    workspace_names = StringList(
        marshmallow.fields.String(),
        required=False,
        description="select contents in these workspaces",
    )
    author__public_names = StringList(
        marshmallow.fields.String(), required=False, description="select contents by these authors",
    )
    last_modifier__public_names = StringList(
        marshmallow.fields.String(), required=False, description="select contents by these authors",
    )
    file_extensions = StringList(
        marshmallow.fields.String(),
        required=False,
        description="select contents with these file extensions",
    )
    statuses = StringList(
        marshmallow.fields.String(),
        required=False,
        description="select contents with these statuses",
    )
    created_from = marshmallow.fields.DateTime(
        required=False, format=DATETIME_FORMAT, allow_none=True
    )
    created_to = marshmallow.fields.DateTime(
        required=False, format=DATETIME_FORMAT, allow_none=True
    )
    modified_from = marshmallow.fields.DateTime(
        required=False, format=DATETIME_FORMAT, allow_none=True
    )
    modified_to = marshmallow.fields.DateTime(
        required=False, format=DATETIME_FORMAT, allow_none=True
    )


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
    value = marshmallow.fields.String(description="The value of this field")
    count = marshmallow.fields.Int(description="The number of results matching this value")


class DateRangeSchema(marshmallow.Schema):
    date_from = marshmallow.fields.DateTime(
        load_from="from", dump_to="from", format=DATETIME_FORMAT, required=False, missing=None
    )
    date_to = marshmallow.fields.DateTime(
        load_from="to", dump_to="to", format=DATETIME_FORMAT, required=False, missing=None
    )


class ContentFacetsSchema(marshmallow.Schema):
    workspace_names = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(), description="search matches contents in these workspaces"
        )
    )
    author__public_names = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(),
            description="search matches contents which have authors with these public names",
        )
    )
    content_types = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(), description="search matches contents with these content types"
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
            FacetCountSchema(), description="search matches contents with these file extensions"
        )
    )
    statuses = marshmallow.fields.List(
        marshmallow.fields.Nested(
            FacetCountSchema(), description="search matches contents with these statuses"
        )
    )


class AdvancedContentSearchResultSchema(ContentSearchResultSchema):
    facets = marshmallow.fields.Nested(
        ContentFacetsSchema(),
        description="search matched content with these characteristics",
        required=False,
        missing=None,
    )
    created_range = marshmallow.fields.Nested(DateRangeSchema(), required=False, missing=None)
    modified_range = marshmallow.fields.Nested(DateRangeSchema(), required=False, missing=None)


class UserSearchQuerySchema(marshmallow.Schema):
    """Query filters for searching users."""

    search_string = marshmallow.fields.String(required=True)
    workspace_ids = StringList(
        marshmallow.fields.Int(),
        required=False,
        missing=None,
        description="if given only users members of the given workspace ids will be searched",
    )
    search_fields = StringList(
        EnumField(UserSearchField),
        required=False,
        missing=None,
        description="if given only search in the given user fields",
    )
    newest_authored_content_date_from = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, required=False, missing=None
    )
    newest_authored_content_date_to = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, required=False, missing=None
    )


class SearchedUserSchema(UserDigestSchema):
    """User object returned by a search."""

    newest_authored_content_date = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, allow_none=True
    )


class WorkspaceFacetSchema(marshmallow.Schema):
    count = marshmallow.fields.Integer()
    value = marshmallow.fields.Nested(WorkspaceDigestSchema())


class UserSearchFacets(marshmallow.Schema):
    workspaces = marshmallow.fields.List(marshmallow.fields.Nested(WorkspaceFacetSchema()))


class DateRangeSchema(marshmallow.Schema):
    from_ = marshmallow.fields.DateTime(format=DATETIME_FORMAT, dict_key="from")
    to = marshmallow.fields.DateTime(format=DATETIME_FORMAT)


class UserSearchResultSchema(marshmallow.Schema):
    users = marshmallow.fields.List(marshmallow.fields.Nested(SearchedUserSchema()))
    total_hits = marshmallow.fields.Integer()
    is_total_hits_accurate = marshmallow.fields.Boolean()
    facets = marshmallow.fields.Nested(UserSearchFacets())
    last_authored_content_revision_date_range = DateRangeSchema()


class WorkspaceSearchQuerySchema(marshmallow.Schema):
    """Query filters for searching workspaces."""

    search_string = marshmallow.fields.String(required=True)
    member_ids = StringList(
        marshmallow.fields.Int(),
        required=False,
        missing=None,
        description="if given only workspace having members in the list will be searched",
    )
    search_fields = StringList(
        EnumField(WorkspaceSearchField),
        required=False,
        missing=None,
        description="if given only search in the given workspace fields",
    )


class SearchedWorkspaceSchema(WorkspaceDigestSchema):
    """Workspace object returned by a search."""

    access_type = marshmallow.fields.String()
    member_count = marshmallow.fields.Integer()
    content_count = marshmallow.fields.Integer()


class UserFacetSchema(marshmallow.Schema):
    count = marshmallow.fields.Integer()
    value = marshmallow.fields.Nested(UserDigestSchema())


class WorkspaceSearchFacets(marshmallow.Schema):
    members = marshmallow.fields.List(marshmallow.fields.Nested(UserFacetSchema()))


class WorkspaceSearchResultSchema(marshmallow.Schema):
    workspaces = marshmallow.fields.List(marshmallow.fields.Nested(SearchedWorkspaceSchema()))
    total_hits = marshmallow.fields.Integer()
    is_total_hits_accurate = marshmallow.fields.Boolean()
    facets = marshmallow.fields.Nested(WorkspaceSearchFacets())
