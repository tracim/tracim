import typing

import marshmallow
from marshmallow import post_load
from tracim_backend.app_models.validator import regex_string_as_list_of_int
from tracim_backend.models.context_models import CalendarFilterQuery
from tracim_backend.models.context_models import Calendar
from tracim_backend.views.core_api.schemas import StrippedString

class CalendarSchema(marshmallow.Schema):
    calendar_url = StrippedString()
    with_credentials =  marshmallow.fields.Bool(
        example=False,
        description='true if auth with tracim is needed to access calendar, false'
                    'if there is no authentication needed',
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return Calendar(**data)

class CalendarFilterQuerySchema(marshmallow.Schema):
    workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="1,5",
        description='comma separated list of excluded user',
        default=''
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return CalendarFilterQuery(**data)