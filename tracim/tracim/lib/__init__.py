# -*- coding: utf-8 -*-
from tg.i18n import lazy_ugettext as l_

class NotFoundError(Exception):
    pass

class CST(object):
    STATUS_ERROR = 'error'
    STATUS_OK = 'ok'
    STATUS_WARNING = 'warning'

    class TREEVIEW_MENU(object):
        """
        Constant values used for tree view menu generation
        """
        ITEM_SEPARATOR = '__'
        ID_SEPARATOR = '_'

        ID_TEMPLATE__WORKSPACE_ONLY='workspace_{}__'
        ID_TEMPLATE__FULL='workspace_{}__content_{}'


#############
#
# HERE ARE static messages which allow to get translation for dates
#
# FIXME - MAKE months translatable
# l_('January')
# l_('February')
# l_('March')
# l_('April')
# l_('May')
# l_('June')
# l_('July')
# l_('August')
# l_('September')
# l_('October')
# l_('November')
# l_('December')


def cmp_to_key(mycmp):
    """
    List sort related function

    Convert a cmp= function into a key= function
    """
    class K(object):
        def __init__(self, obj, *args):
            self.obj = obj
        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0
        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0
        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0
        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0
        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0
        def __ne__(self, other):
            return mycmp(self.obj, other.obj) != 0
    return K