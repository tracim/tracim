# -*- coding: utf-8 -*-

import tg
from tg.i18n import ugettext as _, lazy_ugettext as l_

from pod.lib import base as plb
from pod.lib import dbapi as pld
import pod.model as pm

class PODApiUserProfileController(plb.BaseController):

    @tg.expose()
    def change_password(self, current_password, new_password1, new_password2):
        current_user = pld.PODStaticController.getCurrentUser()

        redirect_url = tg.lurl('/me')
        if not current_password or not new_password1 or not new_password2:
            tg.flash(_('Empty password is not allowed.'))
            tg.redirect(redirect_url)

        if current_user.validate_password(current_password) is False:
            tg.flash(_('The current password you typed is wrong'))
            tg.redirect(redirect_url)
        # else:
        if new_password1!=new_password2:
            tg.flash(_('The current password you typed is wrong'))
            tg.redirect(redirect_url)
        # else:
        current_user.password = new_password1
        pm.DBSession.flush()

        tg.flash(_('The password has been successfully changed'))
        tg.redirect(redirect_url)
