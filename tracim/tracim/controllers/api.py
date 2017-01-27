# -*- coding: utf-8 -*-
from tg import abort
from tg import expose
from tg import predicates
from tg import request
from tg import tmpl_context

from tracim.lib.base import BaseController
from tracim.lib.calendar import CalendarManager
from tracim.lib.utils import api_require
from tracim.lib.workspace import WorkspaceApi
from tracim.model.serializers import Context, CTX

"""
To raise an error, use:

```
abort(
    400,
    detail={
        'name': 'Parameter required'
    },
    comment='Missing data',
)
```

"""


class APIBaseController(BaseController):
    def _before(self, *args, **kw):
        # For be user friendly, we disable hard check of content_type
        # if request.content_type != 'application/json':
        #     abort(406, 'Only JSON requests are supported')

        super()._before(*args, **kw)


class WorkspaceController(APIBaseController):
    @expose('json')
    @api_require(predicates.not_anonymous())
    def index(self):
        # NOTE BS 20161025: I can't use tmpl_context.current_user,
        # I d'ont know why
        workspace_api = WorkspaceApi(tmpl_context.identity.get('user'))
        workspaces = workspace_api.get_all()
        serialized_workspaces = Context(CTX.API_WORKSPACE).toDict(workspaces)

        return {
            'value_list': serialized_workspaces
        }


class CalendarsController(APIBaseController):
    @expose('json')
    @api_require(predicates.not_anonymous())
    def index(self):
        # NOTE BS 20161025: I can't use tmpl_context.current_user,
        # I d'ont know why
        user = tmpl_context.identity.get('user')
        calendar_workspaces = CalendarManager\
            .get_workspace_readable_calendars_for_user(user)
        calendars = Context(CTX.API_CALENDAR_WORKSPACE)\
            .toDict(calendar_workspaces)

        # Manually add information about user calendar
        calendars.append(Context(CTX.API_CALENDAR_USER).toDict(user))

        return {
            'value_list': calendars
        }


class APIController(BaseController):
    workspaces = WorkspaceController()
    calendars = CalendarsController()
