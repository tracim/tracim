import typing

import marshmallow
from marshmallow import post_load

from tracim_backend.views.core_api.schemas import ContentDigestSchema
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


class ContentSearchSchema(ContentDigestSchema):
    score = marshmallow.fields.Float()
    raw_content = marshmallow.fields.Str()


class ContentSearchResultSchema(marshmallow.Schema):
    contents = marshmallow.fields.Nested(ContentSearchSchema, many=True)
