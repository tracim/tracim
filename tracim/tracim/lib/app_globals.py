# -*- coding: utf-8 -*-

from markupsafe import escape_silent as escape

import tg
from tg.i18n import ugettext as _, lazy_ugettext as l_
from tg.flash import TGFlash

"""The application's Globals object"""

__all__ = ['Globals']

class Globals(object):
    """Container for objects available throughout the life of the application.

    One instance of Globals is created during application initialization and
    is available during requests via the 'app_globals' variable.

    """

    def __init__(self):
        """Do nothing, by default."""
        pass

    VERSION_NUMBER = '1.0.3'
    LONG_DATE_FORMAT = '%A, the %d of %B %Y at %H:%M'
    SHORT_DATE_FORMAT = l_('%B %d at %I:%M%p')


class LinkReadyTGFlash(TGFlash):
    """
    This class inherits from (and is used in place of) TGFlash
    in order to allow to include links in flash messages.
    """

    def _render_static_version(self, container_id):
        payload = self.pop_payload()
        if not payload:
            return ''

        # HACK - THIS IS A PATCH
        if payload.get('no_escape'):
            payload['message'] = payload.get('message','')
        else:
            payload['message'] = escape(payload.get('message',''))

        payload['container_id'] = container_id
        return self.static_template.substitute(payload)

# Override the default flash with the Specific one
tg.flash = LinkReadyTGFlash.create_global()
