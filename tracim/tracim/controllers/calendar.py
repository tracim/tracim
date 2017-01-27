# -*- coding: utf-8 -*-
import re
import tg
from tg import tmpl_context
from tg.predicates import not_anonymous

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
    @tg.require(not_anonymous())
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
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()

        # TODO BS 20160720: S'assurer d'être identifié !
        user = tmpl_context.identity.get('user')
        dictified_current_user = Context(CTX.CURRENT_USER).toDict(user)

        fake_api = DictLikeClass(
            current_user=dictified_current_user,
        )
        user_base_url = CalendarManager.get_user_base_url()
        workspace_base_url = CalendarManager.get_workspace_base_url()
        workspace_calendar_urls = CalendarManager\
            .get_workspace_readable_calendars_urls_for_user(user)
        base_href_url = \
            re.sub(r"^http[s]?://", '', cfg.RADICALE_CLIENT_BASE_URL_HOST)

        # Template will use User.auth_token, ensure it's validity
        user.ensure_auth_token()

        return DictLikeClass(
            fake_api=fake_api,
            user_base_url=user_base_url,
            workspace_base_url=workspace_base_url,
            workspace_clendar_urls=workspace_calendar_urls,
            auth_token=user.auth_token,
            base_href_url=base_href_url,
        )
