import typing

import marshmallow
from marshmallow import post_load

from tracim_backend.app_models.validator import all_content_types_validator
from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import StrippedString


class SearchFilterQuery(object):
    def __init__(self, search_string: str = ""):
        self.search_string = search_string


class SearchFilterQuerySchema(marshmallow.Schema):
    search_string = StrippedString(
        example="test", description="just a search string", required=False
    )

    @post_load
    def make_search_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
        return SearchFilterQuery(**data)


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


class ContentSearchResultSchema(marshmallow.Schema):
    contents = marshmallow.fields.Nested(ContentSearchSchema, many=True)
