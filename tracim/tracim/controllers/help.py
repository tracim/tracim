# -*- coding: utf-8 -*-

import tg
from tg.decorators import override_template
from tracim.lib.base import BaseController

class HelpController(BaseController):
    """
    TODO Manage rights
    """

    @tg.expose('tracim.templates.help.page')
    def index(self, help_page=''):
        return dict()


    @tg.expose('tracim.templates.help.page')
    def page(self, help_page='', mode='normal'):
        """

        :param help_page: the mako help page file name (without the prefix page-)
        :param mode: the mode to generate. Options are "normal" or "modal"
        :return:
        """
        # FIXME - NOT REALLY SAFE BECAUSE SOME UNWANTED FILE MAY BE USED AS HELP PAGE
        if help_page:
            help_page_path = 'mako:tracim.templates.help.page-{}'.format(help_page)
            print('TEMPLATE:', help_page_path)
            override_template(HelpController.page, help_page_path)

        return dict(mode=mode)
