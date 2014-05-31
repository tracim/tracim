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

class AdminGroupController(CrudRestController):
    model = pma.Group
    substring_filters = True

    class new_form_type(AddRecordForm):
        __model__ = pma.Group
        __require_fields__     = ['group_name', 'display_name', 'users', 'personnal_group']
        __omit_fields__        = ['created', 'permissions', '_lRights']
        __field_order__        = ['group_name', 'display_name', 'users']

        __headers__ = dict(group_name='Unique name', display_name='Visible name')

        group_name = tw2f.TextField('group_name')
        display_name = tw2f.TextField('display_name')
        personnal_group = tw2f.HiddenField('personnal_group', value='off')


    class edit_form_type(EditableForm):
        __model__ = pma.Group
        __require_fields__     = ['group_name', 'display_name', 'users']
        __omit_fields__        = ['personnal_group', 'created', 'permissions', '_lRights']
        __field_order__        = ['group_name', 'display_name']

        __headers__ = dict(group_name='Unique name', display_name='Visible name')


    class edit_filler_type(EditFormFiller):
        __model__ = pma.Group


    class table_type(TableBase):
        __model__ = pma.Group
        __limit_fields__ = ['group_id', 'group_name', 'display_name', 'users']
        __headers__ = dict(group_id='id', group_name='Unique name', display_name='Visible name', users='Users')
        __xml_fields__ = ['users']


    class table_filler_type(TableFiller):
        __model__ = pma.Group
        __limit_fields__ = ['group_id', 'group_name', 'display_name', 'users']
        #__add_fields__ = {'associated_users':None}

        def _do_get_provider_count_and_objs(self, groups=None, **kw):
            groups = pm.DBSession.query(pma.Group).\
                filter(pma.Group.group_id>0).\
                filter(pma.Group.group_id != pma.Group.GROUP_ID_ALL_USERS).\
                filter(pma.Group.group_id != pma.Group.GROUP_ID_MANAGERS).\
                all()
            return len(groups), groups

        def users(self, obj):
            users = ''.join(['<li>{0}</li>'.format(user.getDisplayName()) for user in obj.users])
            return users.join(('<ul>', '</ul>'))
