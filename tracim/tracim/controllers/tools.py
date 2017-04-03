# -*- coding: utf-8 -*-

import tg
from tg.decorators import override_template
from tracim.controllers.read import ReadController
from tracim.lib.base import BaseController


class ToolsController(BaseController):
    """
    TODO Manage rights
    """

    read = ReadController()

    @classmethod
    def current_item_id_key_in_context(cls) -> str:
        pass

    @tg.expose()
    def index(self):
        return dict()
