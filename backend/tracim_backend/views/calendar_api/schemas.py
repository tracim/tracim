import typing
from enum import Enum

import marshmallow
from marshmallow import post_load

from tracim_backend.app_models.validator import calendar_type_validator
from tracim_backend.app_models.validator import regex_string_as_list_of_int
from tracim_backend.app_models.validator import regex_string_as_list_of_string
from tracim_backend.models.context_models import Calendar
from tracim_backend.models.context_models import CalendarFilterQuery
from tracim_backend.views.calendar_api.models import CalendarType
from tracim_backend.views.core_api.schemas import StrippedString




class CalendarSchema(marshmallow.Schema):
    calendar_url = StrippedString()
    with_credentials =  marshmallow.fields.Bool(
        example=False,
        description='true if auth with tracim is needed to access calendar, false'
                    'if there is no authentication needed',
    )
    calendar_type = StrippedString(
        validate=calendar_type_validator,
        example=CalendarType.workspace.value
    )
    workspace_id = marshmallow.fields.Int(
        example=4,
        description='Workspace id if calendar is link to a workspace',
        default=None,
        allow_none=True
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return Calendar(**data)

class CalendarFilterQuerySchema(marshmallow.Schema):
    workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="1,5",
        description='comma separated list of included workspace ids',
        default='',
        allow_none=True,
    )
    calendar_types = StrippedString(
        validate=regex_string_as_list_of_string,
        example="private,workspace",
        descriptions="comma separated list of types of calendar, can contain any value in {}".format([calendar_type.value for calendar_type in CalendarType]),
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return CalendarFilterQuery(**data)
