# -*- coding: utf-8 -*-

import tg
from tg import tmpl_context

from tracim.lib.base import BaseController
from tracim.lib.calendar import CalendarManager
from tracim.model.serializers import Context
from tracim.model.serializers import CTX
from tracim.model.serializers import DictLikeClass


class CalendarController(BaseController):
    """
    Calendar web tracim page.
    """

    @tg.expose('tracim.templates.calendar.iframe_container')
    def index(self):
        user = tmpl_context.identity.get('user')
        dictified_current_user = Context(CTX.CURRENT_USER).toDict(user)

        fake_api = DictLikeClass(
            current_user=dictified_current_user,
        )

        return DictLikeClass(fake_api=fake_api)


class CalendarConfigController(BaseController):
    """
    CalDavZap javascript config generation
    """

    @tg.expose('tracim.templates.calendar.config')
    def index(self):
        # TODO: S'assurer d'être identifié !
        user = tmpl_context.identity.get('user')
        dictified_current_user = Context(CTX.CURRENT_USER).toDict(user)

        fake_api = DictLikeClass(
            current_user=dictified_current_user,
        )
        calendar_urls = CalendarManager\
            .get_readable_calendars_urls_for_user(user)

        # Template will use User.auth_token, ensure it's validity
        user.ensure_auth_token()

        return DictLikeClass(
            fake_api=fake_api,
            clendar_urls=calendar_urls,
            auth_token=user.auth_token,
        )
