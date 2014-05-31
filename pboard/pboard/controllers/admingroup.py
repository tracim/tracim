# -*- coding: utf-8 -*-

from pboard import model  as pm

from tgext.crud import CrudRestController
from sprox.tablebase import TableBase
from sprox.formbase import EditableForm, AddRecordForm
from sprox.fillerbase import TableFiller, EditFormFiller
from pboard.model import auth as pma
from tw2 import forms as tw2f
import tg

from sprox.widgets import PropertyMultipleSelectField
from sprox._compat import unicode_text
from formencode import Schema
from formencode.validators import FieldsMatch

from pboard.lib import dbapi as pld

class GroupField(PropertyMultipleSelectField):
    """ Shows a limited list of groups """

    def prepare(self):
        # self.entity = pma.Group
        #self.__class__.entity

        visible_groups = pm.DBSession.query(pma.Group).\
            filter(pma.Group.group_id>0).\
            filter(pma.Group.group_id!=pma.Group.GROUP_ID_ALL_USERS).all()

        self.options = [(group.group_id, group.getDisplayName()) for group in visible_groups]

        if not self.value:
            self.value = []
        self.value = [unicode_text(v) for v in self.value]

        super(PropertyMultipleSelectField, self).prepare()


class AdminUserController(CrudRestController):
    model = pma.User

    class new_form_type(AddRecordForm):
        __model__ = pma.User

        __require_fields__     = ['display_name', 'email_address', 'password', 'verify_password', 'groups']
        __omit_fields__        = ['_password', 'created', 'user_id', '_lAllNodes']
        __field_order__        = ['display_name', 'email_address', 'password', 'verify_password', 'groups']

        email_address          = tw2f.TextField('email_address')
        display_name           = tw2f.TextField('display_name')
        verify_password        = tw2f.PasswordField('verify_password')
        groups = GroupField('groups')

    class edit_form_type(EditableForm):
        __model__ = pma.User

        __require_fields__     = ['display_name', 'email_address', 'groups']
        __omit_fields__        = ['_password', 'created', 'user_id', '_lAllNodes', 'password']
        __field_order__        = ['display_name', 'email_address', 'groups']

        email_address          = tw2f.TextField('email_address')
        display_name           = tw2f.TextField('display_name')
        groups = GroupField('groups')

    class edit_filler_type(EditFormFiller):
        __model__ = pma.User

    class table_type(TableBase):
        __model__ = pma.User
        __limit_fields__ = ['user_id', 'email_address', 'display_name', 'groups']
        __field_order__ = ['user_id', 'display_name', 'email_address', 'groups']
        __headers__ = dict(user_id='id', email_address='Email', display_name='Name', groups='Groups')
        __xml_fields__ = ['groups']

    class table_filler_type(TableFiller):
        __model__ = pma.User
        __limit_fields__ = ['user_id', 'email_address', 'display_name', 'groups']

        def groups(self, obj):
            groups = ''.join(['<li>{0}</li>'.format(group.getDisplayName()) for group in obj.groups if group.group_id>0])
            return groups.join(('<ul>', '</ul>'))

    @tg.expose()
    #@tg.validate(new_user_validator, error_handler=CrudRestController.new)
    def post(self, *args, **kw):

        real_name = kw['display_name']
        email = kw['email_address']
        groups = kw['groups'] if 'groups' in kw else []
        password = kw['password']

        new_user = pld.PODStaticController.createNewUser(real_name, email, password, groups)
        if tg.request.response_type == 'application/json':
            if new_user is not None and self.conditional_update_field is not None:
                tg.response.last_modified = getattr(new_user, self.conditional_update_field)

            return dict(model=self.model.__name__,
                        value=self._dictify(new_user))

        return tg.redirect('./', params=self._kept_params())


    @tg.expose()
    def post_delete(self, *args, **kw):
        user_id = int(args[0])

        pld.PODStaticController.deleteUser(user_id)
        return tg.redirect('./', params=self._kept_params())