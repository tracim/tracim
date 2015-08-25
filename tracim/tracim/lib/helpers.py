# -*- coding: utf-8 -*-

"""WebHelpers used in tracim."""

#from webhelpers import date, feedgenerator, html, number, misc, text

import datetime

from babel.dates import format_date, format_time
from markupsafe import Markup

import tg
from tg.i18n import ugettext as _
from tracim.config.app_cfg import CFG

from tracim.lib import app_globals as plag

from tracim.lib import CST
from tracim.lib.base import logger
from tracim.lib.content import ContentApi
from tracim.lib.workspace import WorkspaceApi

from tracim.model.data import ContentStatus
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import UserRoleInWorkspace
from tracim.model.data import Workspace

def date_time_in_long_format(datetime_object, format=''):

    current_locale = tg.i18n.get_lang()[0]
    date = format_date(datetime_object, locale=current_locale)
    time = format_time(datetime_object, locale=current_locale)
    return _('{date} at {time}').format(date=date, time=time)

def date_time(datetime_object):
    return date_time_in_long_format(datetime_object)

def date(datetime_object):
    current_locale = tg.i18n.get_lang()[0]
    return format_date(datetime_object, locale=current_locale)


def time(datetime_object):
    current_locale = tg.i18n.get_lang()[0]
    return format_time(datetime_object, locale=current_locale)

def format_short(datetime_object):
    return datetime_object.strftime(format = plag.Globals.SHORT_DATE_FORMAT.__str__())

def user_friendly_file_size(file_size: int):
    file_size_kib = file_size/1024
    if file_size_kib<1024:
        return '{:.3f} ko'.format(file_size_kib)
    else:
        mega_size = file_size_kib/1024
        if mega_size<1024:
            return '{:.3f} Mo'.format(int(mega_size))

def current_year():
  now = datetime.datetime.now()
  return now.strftime('%Y')

def formatLongDateAndTime(datetime_object, format=''):
    """ OBSOLETE
    :param datetime_object:
    :param format:
    :return:
    """
    if not format:
        format = plag.Globals.LONG_DATE_FORMAT
    return datetime_object.strftime(format)



def icon(icon_name, white=False):
    if (white):
        return Markup('<i class="icon-%s icon-white"></i>' % icon_name)
    else:
        return Markup('<i class="icon-%s"></i>' % icon_name)

class ICON(object):
  Shared = '<i class="fa fa-group"></i>'
  Private = '<i class="fa fa-key"></i>'

def show_email_stuff():
    """
    this function is used in order to show/hide link for sending password reset through email
    """
    return CFG.get_instance().EMAIL_NOTIFICATION_ACTIVATED

def tracker_js():
    return CFG.get_instance().TRACKER_JS_CONTENT

def IconPath(icon_size, icon_path):
    return tg.url('/assets/icons/{0}x{0}/{1}.png'.format(icon_size, icon_path))

def PodVersion():
    return plag.Globals.VERSION_NUMBER

def RoleLevelAssociatedCss(role_level):
    if role_level==UserRoleInWorkspace.NOT_APPLICABLE:
        return '#CCC'
    elif role_level==UserRoleInWorkspace.READER:
        return '#1fdb11'
    elif role_level==UserRoleInWorkspace.CONTRIBUTOR:
        return '#759ac5'
    elif role_level==UserRoleInWorkspace.CONTENT_MANAGER:
        return '#ea983d'
    elif role_level==UserRoleInWorkspace.WORKSPACE_MANAGER:
        return '#F00'

def AllStatus(type=''):
    return ContentStatus.all(type)


def is_debug_mode():
    return tg.config.get('debug')

def on_off_to_boolean(on_or_off: str) -> bool:
    return True if on_or_off=='on' else False

def convert_id_into_instances(id: str) -> (Workspace, Content):
    """
    TODO - D.A. - 2014-10-18 - Refactor and move this function where it must be placed
    convert an id like 'workspace_<workspace_id>|content_<content_id>'
    into two objects: the given workspace instance and the given content instance
    """

    if id=='#':
        return None, None

    workspace_str = ''
    content_str = ''
    try:
        workspace_str, content_str = id.split(CST.TREEVIEW_MENU.ITEM_SEPARATOR)
    except:
        pass

    workspace = None
    content = None

    try:
        workspace_data = workspace_str.split(CST.TREEVIEW_MENU.ID_SEPARATOR)
        workspace_id = workspace_data[1]
        workspace = WorkspaceApi(tg.tmpl_context.current_user).get_one(workspace_id)
    except:
        workspace = None

    try:
        content_data = content_str.split(CST.TREEVIEW_MENU.ID_SEPARATOR)
        content_id = int(content_data[1])
        content = ContentApi(tg.tmpl_context.current_user).get_one(content_id, ContentType.Any)
    except (IndexError, ValueError) as e:
        content = None

    return workspace, content

def user_role(user, workspace) -> int:
    """
    This function works on DictLikeClass() instances
    :param user: the serialized version of the user (cf CTX.CURRENT_USER)
    :param workspace: the serialized version of the workspace
    :return: the user role id (int)
    """
    for role in user.roles:
        if role.workspace.id==workspace.id:
            return role.id

    return 0

def delete_label_for_item(item) -> str:
    """
    :param item: is a serialized Content item (be carefull; it's not an instance of 'Content')
    :return: the delete label to show to the user (in the right language)
    """
    return ContentType._DELETE_LABEL[item.type]

def is_item_still_editable(item):
    if item.type.id != 'comment':
        return False

    # HACK - D.A - 2014-12-24 - item contains a datetime object!!!
    # 'item' is a variable which is created by serialization and it should be an instance of DictLikeClass.
    # therefore, it contains strins, integers and booleans (something json-ready or almost json-ready)
    #
    # BUT, the property 'created' is still a datetime object
    #
    edit_duration = CFG.get_instance().DATA_UPDATE_ALLOWED_DURATION
    if edit_duration<0:
        return True
    elif edit_duration==0:
        return False
    else:
        time_limit = item.created + datetime.timedelta(0, edit_duration)
        logger.warning(is_item_still_editable, 'limit is: {}'.format(time_limit))
        if datetime.datetime.now() < time_limit:
            return True
    return False

def shorten(text: str, maxlength: int, add_three_points=True) -> str:

    result = text
    if len(text)>maxlength:
        result = text[:maxlength]

        if add_three_points:
            result += '…'

    return result

from tracim.config.app_cfg import CFG as CFG_ORI
CFG = CFG_ORI.get_instance() # local CFG var is an instance of CFG class found in app_cfg
