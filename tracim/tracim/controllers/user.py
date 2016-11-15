# -*- coding: utf-8 -*-
import pytz
from webob.exc import HTTPForbidden
import tg
from tg import tmpl_context
from tg.i18n import ugettext as _

from tracim.controllers import TIMRestController
from tracim.lib.user import UserApi
from tracim.lib.workspace import WorkspaceApi
from tracim.model.serializers import Context
from tracim.model.serializers import CTX
from tracim.model.serializers import DictLikeClass
from tracim import model as pm


class UserWorkspaceRestController(TIMRestController):

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

    @tg.expose()
    def enable_notifications(self, workspace_id, next_url=None):
        workspace_id = int(workspace_id)
        api = WorkspaceApi(tg.tmpl_context.current_user)

        workspace = api.get_one(workspace_id)
        api.enable_notifications(tg.tmpl_context.current_user, workspace)
        tg.flash(_('Notification enabled for workspace {}').format(workspace.label))

        if next_url:
            tg.redirect(tg.url(next_url))
        tg.redirect(self.parent_controller.url(None, 'me'))

    @tg.expose()
    def disable_notifications(self, workspace_id, next_url=None):
        workspace_id = int(workspace_id)
        api = WorkspaceApi(tg.tmpl_context.current_user)

        workspace = api.get_one(workspace_id)
        api.disable_notifications(tg.tmpl_context.current_user, workspace)
        tg.flash(_('Notification disabled for workspace {}').format(workspace.label))

        if next_url:
            tg.redirect(tg.url(next_url))
        tg.redirect(self.parent_controller.url(None, 'me'))


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
        if not tg.config.get('auth_is_internal'):
            raise HTTPForbidden()

        dictified_user = Context(CTX.USER).toDict(tmpl_context.current_user, 'user')
        return DictLikeClass(result = dictified_user)

    @tg.expose()
    def put(self, current_password, new_password1, new_password2):
        if not tg.config.get('auth_is_internal'):
            raise HTTPForbidden()

        # FIXME - Allow only self password or operation for managers
        current_user = tmpl_context.current_user

        redirect_url = tg.lurl('/home')

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
        current_user.update_webdav_digest_auth(new_password1)
        pm.DBSession.flush()

        tg.flash(_('Your password has been changed'))
        tg.redirect(redirect_url)


class UserRestController(TIMRestController):
    """
     CRUD Controller allowing to manage Users
    """

    password = UserPasswordRestController()
    workspaces = UserWorkspaceRestController()

    @classmethod
    def current_item_id_key_in_context(cls):
        return 'user_id'

    @tg.expose('tracim.templates.user_get_all')
    def get_all(self, *args, **kw):
        tg.redirect(self.url(None, 'me'))
        pass

    @tg.expose()
    def post(self, name, email, password, is_tracim_manager='off', is_pod_admin='off'):
        pass

    @tg.expose('tracim.templates.user_get_me')
    def get_one(self, user_id):
        user_id = tmpl_context.current_user.user_id

        current_user = tmpl_context.current_user
        assert user_id==current_user.user_id
        api = UserApi(current_user)
        current_user = api.get_one(current_user.user_id)
        dictified_user = Context(CTX.USER).toDict(current_user, 'user')
        current_user_content = Context(CTX.CURRENT_USER).toDict(tmpl_context.current_user)
        fake_api_content = DictLikeClass(current_user=current_user_content)
        fake_api = Context(CTX.WORKSPACE).toDict(fake_api_content)

        return DictLikeClass(result=dictified_user, fake_api=fake_api)

    @tg.expose('tracim.templates.user_edit_me')
    def edit(self, id, next_url=None):
        id = tmpl_context.current_user.user_id
        current_user = tmpl_context.current_user
        assert id==current_user.user_id

        dictified_user = Context(CTX.USER).toDict(current_user, 'user')
        fake_api = DictLikeClass(next_url=next_url)
        return DictLikeClass(
            result=dictified_user,
            fake_api=fake_api,
            timezones=pytz.all_timezones,
        )

    @tg.expose('tracim.templates.workspace.edit')
    def put(self, user_id, name, email, timezone, next_url=None):
        user_id = tmpl_context.current_user.user_id
        current_user = tmpl_context.current_user
        assert user_id==current_user.user_id

        # Only keep allowed field update
        updated_fields = self._clean_update_fields({
            'name': name,
            'email': email,
            'timezone': timezone,
        })

        api = UserApi(tmpl_context.current_user)
        api.update(current_user, do_save=True, **updated_fields)
        tg.flash(_('profile updated.'))
        if next_url:
            tg.redirect(tg.url(next_url))
        tg.redirect(self.url())

    def _clean_update_fields(self, fields: dict):
        """
        Remove field key who are not allowed to be updated
        :param fields: dict with field name key to be cleaned
        :rtype fields: dict
        :return:
        """
        auth_instance = tg.config.get('auth_instance')
        if not auth_instance.is_internal:
            externalized_fields_names = auth_instance.managed_fields
            for externalized_field_name in externalized_fields_names:
                if externalized_field_name in fields:
                    fields.pop(externalized_field_name)
        return fields
