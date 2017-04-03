# -*- coding: utf-8 -*-
import tg
from tg import require, predicates
from tracim.controllers import StandardController
from tracim.lib.content import ContentApi
from tracim.model.data import ContentType


class ReadController(StandardController):

    @classmethod
    def current_item_id_key_in_context(cls) -> str:
        pass

    @tg.expose()
    def index(self):
        return dict()

    @require(predicates.not_anonymous())
    @tg.expose()
    def all(self):
        print("read all")
        user = tg.tmpl_context.current_user
        content_api = ContentApi(user)
        itemset = content_api.get_last_unread(None, ContentType.Any, None)
        for item in itemset:
            content_api.mark_read(item)

        tg.redirect("/home")


