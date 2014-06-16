# -*- coding: utf-8 -*-

import tg
import repoze.who.api

from tg import _compat
from pod.lib import base as plb
from pod.lib import dbapi as pld
from pod import model as pm
from pod.model import data as pmd
from pod.model import serializers as pms

from tg.i18n import ugettext as _

class PODPublicApiController(plb.BaseController):

    @tg.expose()
    def create_account(self, email='', password='', retyped_password='', real_name='', **kw):
      if email=='' or password=='' or retyped_password=='':
        tg.flash(_('Account creation error: please fill all the fields'), 'error')
        tg.redirect(tg.lurl('/'))
      elif password!=retyped_password:
        tg.flash(_('Account creation error: passwords do not match'), 'error')
        tg.redirect(tg.lurl('/'))
      else:
        loExistingUser = pld.PODStaticController.getUserByEmailAddress(email)
        if loExistingUser!=None:
          tg.flash(_('Account creation error: account already exist: %s') % (email), 'error')
          tg.redirect(tg.lurl('/'))

        loNewAccount = pld.PODStaticController.createNewUser(real_name if real_name!='' else email, email, password, [])

        tg.flash(_('Account successfully created: %s') % (email), 'info')

        who_api = repoze.who.api.get_api(tg.request.environ)
        creds = {}
        creds['login'] = email
        creds['password'] = password
        authenticated, headers = who_api.login(creds)
        tg.response.headers = headers

        tg.redirect(tg.lurl('/'))

