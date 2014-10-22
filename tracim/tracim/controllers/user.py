# -*- coding: utf-8 -*-

from tracim import model  as pm

from sprox.tablebase import TableBase
from sprox.formbase import EditableForm, AddRecordForm
from sprox.fillerbase import TableFiller, EditFormFiller
from tw2 import forms as tw2f
import tg
from tg import tmpl_context
from tg.i18n import ugettext as _, lazy_ugettext as l_

from sprox.widgets import PropertyMultipleSelectField
from sprox._compat import unicode_text

from formencode import Schema
from formencode.validators import FieldsMatch

from tracim.controllers import TIMRestController
from tracim.lib import helpers as h
from tracim.lib.user import UserApi
from tracim.lib.group import GroupApi
from tracim.lib.user import UserStaticApi
from tracim.lib.userworkspace import RoleApi
from tracim.lib.workspace import WorkspaceApi

from tracim.model import DBSession
from tracim.model.auth import Group, User
from tracim.model.serializers import Context, CTX, DictLikeClass

class UserPasswordRestController(TIMRestController):
    """
     CRUD Controller allowing to manage password of a given user
     TODO: do not duplicate this controller between admin and "standard user" interfaces
    """

    def _before(self, *args, **kw):
        """
        Instantiate the current workspace in tg.tmpl_context
        :param args:
        :param kw:
        :return:
        """
        super(self.__class__, self)._before(args, kw)

        api = UserApi(tg.tmpl_context.current_user)
        user_id = tmpl_context.current_user_id
        user = tmpl_context.current_user


    @tg.expose('tracim.templates.user_password_edit_me')
    def edit(self):
        dictified_user = Context(CTX.USER).toDict(tmpl_context.current_user, 'user')
        return DictLikeClass(result = dictified_user)

    @tg.expose()
    def put(self, current_password, new_password1, new_password2):
        # FIXME - Allow only self password or operation for managers
        current_user = tmpl_context.current_user

        redirect_url = tg.lurl('/user/me')

        if not current_password or not new_password1 or not new_password2:
            tg.flash(_('Empty password is not allowed.'))
            tg.redirect(redirect_url)

        if current_user.validate_password(current_password) is False:
            tg.flash(_('The current password you typed is wrong'))
            tg.redirect(redirect_url)

        if new_password1!=new_password2:
            tg.flash(_('New passwords do not match.'))
            tg.redirect(redirect_url)

        current_user.password = new_password1
        pm.DBSession.flush()

        tg.flash(_('Your password has been changed'))
        tg.redirect(redirect_url)


class UserRestController(TIMRestController):
    """
     CRUD Controller allowing to manage Users
    """

    password = UserPasswordRestController()

    @classmethod
    def current_item_id_key_in_context(cls):
        return 'user_id'

    @tg.expose('tracim.templates.user_get_all')
    def get_all(self, *args, **kw):
        tg.redirect(self.url(None, 'me'))
        pass

    @tg.expose()
    def post(self, name, email, password, is_pod_manager='off', is_pod_admin='off'):
        pass

    @tg.expose('tracim.templates.user_get_me')
    def get_one(self, user_id):
        user_id = tmpl_context.current_user.user_id

        current_user = tmpl_context.current_user
        assert user_id==current_user.user_id
        api = UserApi(current_user)
        dictified_user = Context(CTX.USER).toDict(current_user, 'user')
        current_user_content = Context(CTX.CURRENT_USER).toDict(tmpl_context.current_user)
        fake_api_content = DictLikeClass(current_user=current_user_content)
        fake_api = Context(CTX.WORKSPACE).toDict(fake_api_content)

        return DictLikeClass(result = dictified_user, fake_api=fake_api)

    @tg.expose('tracim.templates.user_edit_me')
    def edit(self, id):
        id = tmpl_context.current_user.user_id
        current_user = tmpl_context.current_user
        assert id==current_user.user_id

        dictified_user = Context(CTX.USER).toDict(current_user, 'user')
        return DictLikeClass(result = dictified_user)

    @tg.expose('tracim.templates.workspace_edit')
    def put(self, user_id, name, email):
        user_id = tmpl_context.current_user.user_id
        current_user = tmpl_context.current_user
        assert user_id==current_user.user_id

        api = UserApi(tmpl_context.current_user)
        api.update(current_user, name, email, True)
        tg.flash(_('profile updated.'))
        tg.redirect(self.url())
        return
