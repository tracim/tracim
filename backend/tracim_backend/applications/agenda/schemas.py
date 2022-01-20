import typing

import marshmallow
from marshmallow import post_load

from tracim_backend.app_models.validator import agenda_resource_type_validator
from tracim_backend.app_models.validator import agenda_type_validator
from tracim_backend.app_models.validator import regex_string_as_list_of_int
from tracim_backend.app_models.validator import regex_string_as_list_of_string
from tracim_backend.applications.agenda.models import AgendaResourceType
from tracim_backend.applications.agenda.models import AgendaType
from tracim_backend.models.context_models import Agenda
from tracim_backend.models.context_models import AgendaFilterQuery
from tracim_backend.views.core_api.schemas import StrippedString


class AgendaSchema(marshmallow.Schema):
    agenda_url = StrippedString()
    with_credentials = marshmallow.fields.Bool(
        example=False,
        description="true if auth with tracim is needed to access agenda, false"
        "if there is no authentication needed",
    )
    agenda_type = StrippedString(validate=agenda_type_validator, example=AgendaType.workspace.value)
    workspace_id = marshmallow.fields.Int(
        example=4,
        description="Workspace id if agenda is link to a workspace",
        default=None,
        allow_none=True,
    )
    resource_type = StrippedString(
        validate=agenda_resource_type_validator, example=AgendaResourceType.addressbook.value
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return Agenda(**data)


class AgendaFilterQuerySchema(marshmallow.Schema):
    workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="1,5",
        description="comma separated list of included workspace ids, "
        "setting this parameters will disable"
        "showing of user personals agenda",
        default="",
        allow_none=True,
    )
    agenda_types = StrippedString(
        validate=regex_string_as_list_of_string,
        example="private,workspace",
        description="comma separated list of types of agenda, can contain any value in {}".format(
            [agenda_type.value for agenda_type in AgendaType]
        ),
    )
    resource_types = StrippedString(
        validate=regex_string_as_list_of_string,
        example="private,workspace",
        description="comma separated list of resource type, can contain any value in {}".format(
            [resource_type.value for resource_type in AgendaResourceType]
        ),
        default="calendar",
        missing=None,
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return AgendaFilterQuery(**data)
