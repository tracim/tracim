# -*- coding: utf-8 -*-
"""Main Controller"""

import tg.predicates
from tgext.admin.config import AdminConfig, CrudRestControllerConfig
from sprox.formbase import AddRecordForm
from sprox import formbase as sform
from sprox import fillerbase as sfill
from sprox import tablebase as stable
from formencode import Schema
from formencode.validators import FieldsMatch
from tw2.forms import PasswordField, TextField, HiddenField
from tw2 import forms as tw2f
from formencode import validators as fev

from pboard.model import auth as pma
from pboard import model as pm

########################################################################################################################
##
## GROUP RELATED STUFF
##

class GroupRegistrationForm(sform.AddRecordForm):
    __model__ = pma.Group
    __require_fields__     = ['group_name', 'display_name', 'users', 'personnal_group']
    __omit_fields__        = ['created', 'permissions', '_lRights']
    __field_order__        = ['group_name', 'display_name', 'users']

    __headers__ = dict(group_name='Unique name', display_name='Visible name')

    group_name = tw2f.TextField('group_name')
    display_name = tw2f.TextField('display_name', place_holder='agaga')
    display_name = tw2f.TextField('display_name', place_holder='agaga')
    personnal_group = tw2f.HiddenField('personnal_group', value='off')

class GroupEditForm(sform.EditableForm):
    __model__ = pma.Group
    __require_fields__     = ['group_name', 'display_name', 'users']
    __omit_fields__        = ['personnal_group', 'created', 'permissions', '_lRights']
    __field_order__        = ['group_name', 'display_name']

    __headers__ = dict(group_name='Unique name', display_name='Visible name')

class GroupTableFillerForm(sfill.TableFiller):

    __model__ = pma.Group
    __limit_fields__ = ['group_id', 'group_name', 'display_name', 'users']
    #__add_fields__ = {'associated_users':None}

    def _do_get_provider_count_and_objs(self, director=None, **kw):
        groups = pm.DBSession.query(pma.Group).filter(pma.Group.group_id>0).all()
        return len(groups), groups

    def users(self, obj):
        users = ''.join(['<li>{0}</li>'.format(user.getDisplayName()) for user in obj.users])
        return users.join(('<ul>', '</ul>'))

class GroupTable(stable.TableBase):
    __model__ = pma.Group
    __limit_fields__ = ['group_id', 'group_name', 'display_name', 'users']
    __headers__ = dict(group_id='id', group_name='Unique name', display_name='Visible name', users='Users')
    __xml_fields__ = ['users']

class GroupCrudConfig(CrudRestControllerConfig):
    new_form_type = GroupRegistrationForm
    edit_form_type = GroupEditForm
    table_filler_type = GroupTableFillerForm
    table_type = GroupTable


########################################################################################################################
##
## USER RELATED STUFF
##


form_validator =  Schema(chained_validators=(FieldsMatch('password',
                                                         'verify_password',
                                                         messages={'invalidNoMatch':
                                                         'Passwords do not match'}),))
class UserRegistrationForm(AddRecordForm):
    pass
    __model__ = pma.User
    __require_fields__     = ['display_name', 'email_address', 'password']
    __omit_fields__        = ['_password', 'groups', 'created', 'user_id', '_lAllNodes']
    __field_order__        = ['display_name', 'email_address', 'password', 'verify_password']

    __fields__ = dict(display_name='Name', email_address='Email', password='Password', verify_password='Retype Password', )

    email_address          = TextField('blop')
    display_name           = TextField
    verify_password        = PasswordField('verify_password')
    groups = tw2f.MultipleSelectionField('groups')


class UserTableFiller(sfill.TableFiller):

    __model__ = pma.User
    __limit_fields__ = ['user_id', 'email_address', 'display_name', 'groups']

    def groups(self, obj):
        groups = ''.join(['<li>{0}</li>'.format(group.getDisplayName()) for group in obj.groups if group.group_id>0])
        return groups.join(('<ul>', '</ul>'))

class UserTable(stable.TableBase):
    __model__ = pma.User
    __limit_fields__ = ['user_id', 'email_address', 'display_name', 'groups']
    __field_order__ = ['user_id', 'display_name', 'email_address', 'groups']
    __omit_fields__ = ['__actions__']
    __headers__ = dict(user_id='id', email_address='Email', display_name='Name', groups='Groups')
    __xml_fields__ = ['groups']


class UserCrudConfig(CrudRestControllerConfig):
    new_form_type = UserRegistrationForm
    table_filler_type = UserTableFiller
    table_type = UserTable

########################################################################################################################
##
## GENERIC STUFF
##

class PodAdminConfig(AdminConfig):
    user = UserCrudConfig
    group = GroupCrudConfig
    allow_only = tg.predicates.in_group('user')


