# -*- coding: utf-8 -*-
import cherrypy

import types

from babel.dates import format_timedelta
from babel.dates import format_datetime

from datetime import datetime
import tg
from tg.i18n import ugettext as _
from tg.util import LazyString

from depot.manager import DepotManager

from tracim.lib.base import logger
from tracim.lib.user import CurrentUserGetterApi
from tracim.model.auth import Profile
from tracim.model.auth import User
from tracim.model.data import BreadcrumbItem, ActionDescription
from tracim.model.data import ContentStatus
from tracim.model.data import ContentRevisionRO
from tracim.model.data import LinkItem
from tracim.model.data import NodeTreeItem
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import RoleType
from tracim.model.data import UserRoleInWorkspace
from tracim.model.data import VirtualEvent
from tracim.model.data import Workspace

from tracim.model import data as pmd
from tracim.lib import CST

#############################################################"
##
## HERE COMES THE SERIALIZATION CLASSES
##
## The following code allow to define with high level
## of granularity the way models are serialized
##

class pod_serializer(object):
    """
    This decorator allow to define a function being a converter of a Model in a Context

    """
    def __init__(self, model_class, context):
        """
        :param model_class: the model class to serialize. Should be a class defined in tracim.model.auth or tracim.model.data
        :param context: the Context string which should defined in CTX class
        :return:
        """
        assert hasattr(CTX, context)
        self.context = context
        self.model_class = model_class

    def __call__(self, func):
        Context.register_converter(self.context, self.model_class, func)
        return func

class ContextConverterNotFoundException(Exception):
    def __init__(self, context_string, model_class):
        message = 'converter not found (context: {0} - model: {1})'.format(context_string, model_class.__name__)
        Exception.__init__(self, message)

class CTX(object):
    """ constants that are used for serialization / dictification of models"""
    ADMIN_USER = 'ADMIN_USER'
    ADMIN_WORKSPACE = 'ADMIN_WORKSPACE'
    ADMIN_WORKSPACES = 'ADMIN_WORKSPACES'
    CONTENT_LIST = 'CONTENT_LIST'
    CONTENT_HISTORY = 'CONTENT_HISTORY'
    CURRENT_USER = 'CURRENT_USER'
    DEFAULT = 'DEFAULT' # default context. This will allow to define a serialization method to be used by default
    EMAIL_NOTIFICATION = 'EMAIL_NOTIFICATION'
    FILE = 'FILE'
    FILES = 'FILES'
    FOLDER = 'FOLDER'
    FOLDER_CONTENT_LIST = 'FOLDER_CONTENT_LIST'
    FOLDERS = 'FOLDERS'
    MENU_API = 'MENU_API'
    MENU_API_BUILD_FROM_TREE_ITEM = 'MENU_API_BUILD_FROM_TREE_ITEM'
    PAGE = 'PAGE'
    PAGES = 'PAGES'
    SEARCH = 'SEARCH'
    THREAD = 'THREAD'
    THREADS = 'THREADS'
    USER = 'USER'
    USERS = 'USERS'
    WORKSPACE = 'WORKSPACE'
    API_WORKSPACE = 'API_WORKSPACE'
    API_CALENDAR_WORKSPACE = 'API_CALENDAR_WORKSPACE'
    API_CALENDAR_USER = 'API_CALENDAR_USER'


class DictLikeClass(dict):
    """
     This class allow to use dictionnary with property like access to values.
     eg.: user = { 'login': 'damien', 'password': 'bob'}
     will be accessible in the templates like following:
       ${user.login}
       ${user.password}
    """
    __getattr__ = dict.__getitem__
    __setattr__ = dict.__setitem__


class Context(object):
    """
    Convert a series of mapped objects into ClassLikeDict (a dictionnary which can be accessed through properties)
    example: obj = ClassLikeDict({'foo': 'bar'}) allow to call obj.foo
    """

    _converters = dict()

    @classmethod
    def register_converter(cls, context_string, model_class, convert_function):
        """

        :param context_string:
        :param model_class:
        :param convert_function:
        :return:
        """
        if context_string not in Context._converters:
            Context._converters[context_string] = dict()

        if model_class not in Context._converters[context_string]:
            logger.info(Context, 'Registering Serialization feature: [ {2} | {1} | {0} ]'.format(
                convert_function.__name__,
                model_class.__name__,
                context_string))

            Context._converters[context_string][model_class] = convert_function

    @classmethod
    def get_converter(cls, context_string, model_class):
        """
        :param context_string:
        :param model_class:
        :return:
        """
        try:
            converter = Context._converters[context_string][model_class]
            return converter
        except KeyError:
            if CTX.DEFAULT in Context._converters:
                if model_class in Context._converters[CTX.DEFAULT]:
                    return Context._converters[CTX.DEFAULT][model_class]

            raise ContextConverterNotFoundException(context_string, model_class)

    def __init__(self, context_string, base_url='', current_user=None):
        """
        """
        self.context_string = context_string
        self._current_user = current_user  # Allow to define the current user if any
        if not current_user:
            self._current_user = CurrentUserGetterApi.get_current_user()

        self._base_url = base_url # real root url like http://mydomain.com:8080

    def url(self, base_url='/', params=None, qualified=False) -> str:
        # HACK (REF WSGIDAV.CONTEXT.TG.URL) This is a temporary hack who
        # permit to know we are in WSGIDAV context.
        if not hasattr(cherrypy.request, 'current_user_email'):
            url = tg.url(base_url, params)
        else:
            url = base_url

        if self._base_url:
            url = '{}{}'.format(self._base_url, url)
        return  url

    def get_user(self):
        return self._current_user

    def toDict(self, serializableObject, key_value_for_a_list_object='', key_value_for_list_item_nb=''):
        """
        Converts a given object into a recursive dictionnary like structure.
        :param serializableObject: the structure to be serialized. this may be any type of object, or list
        :param key_value_for_a_list_object: if set, then the result will e a dictionnary with the given key.
        :param key_value_for_list_item_nb: in case of serializableObject being a list, then this key allow to add item number as property
        :return:
        """
        result = DictLikeClass()

        if serializableObject==None:
            return None

        if isinstance(serializableObject, (int, str, LazyString)):
            return serializableObject

        if isinstance(serializableObject, (list, tuple, types.GeneratorType)) and not isinstance(serializableObject, str):
            # Case of lists
            list_of_objects = list()
            for item in serializableObject:
                list_of_objects.append(self.toDict(item))

            if not key_value_for_a_list_object:
                return list_of_objects
            else:
                result[key_value_for_a_list_object] = list_of_objects

                if key_value_for_list_item_nb:
                    result[key_value_for_list_item_nb] = len(serializableObject)
            return result

        if isinstance(serializableObject, dict):
            # Case of dictionnaries
            for key, value in serializableObject.items():
                result[key] = self.toDict(value)

            return result

        # Default case now
        if key_value_for_a_list_object:
            serialized_object = self.toDictSpecific(serializableObject)
            result[key_value_for_a_list_object] = serialized_object
        else:
            result = self.toDictSpecific(serializableObject)

        return result


    def toDictSpecific(self, serializableObject):
        """
        Convert to a dictonnary the specific classes. This code will search for the right convert function which
        must have been developped and registered.

        :param serializableObject: an object to be serialized
        :return: a ClassLikeDict instance
        """
        converter_function = Context.get_converter(self.context_string, serializableObject.__class__)
        result = converter_function(serializableObject, self) # process the object with the given serializer

        assert isinstance(result, DictLikeClass)
        return result


########################################################################################################################
## ActionDescription

@pod_serializer(ActionDescription, CTX.DEFAULT)
def serialize_breadcrumb_item(action: ActionDescription, context: Context):
    return DictLikeClass(
        id = action.id,
        icon = action.icon,
        label = action.label
    )

########################################################################################################################
## BREADCRUMB

@pod_serializer(BreadcrumbItem, CTX.DEFAULT)
def serialize_breadcrumb_item(item: BreadcrumbItem, context: Context):
    return DictLikeClass(
        icon = item.icon,
        label = item.label,
        url = item.url,
        is_active = item.is_active
    )

########################################################################################################################
## Content

@pod_serializer(ContentRevisionRO, CTX.PAGE)
@pod_serializer(ContentRevisionRO, CTX.FILE)
def serialize_version_for_page_or_file(version: ContentRevisionRO, context: Context):
    return DictLikeClass(
        id = version.revision_id,
        label = version.label,
        owner = context.toDict(version.owner),
        created = version.created,
        action = context.toDict(version.get_last_action()),
    )


@pod_serializer(Content, CTX.DEFAULT)
def serialize_breadcrumb_item(content: Content, context: Context):
    return DictLikeClass(
        id = content.content_id,
        label = content.label,
        folder = context.toDict(DictLikeClass(id = content.parent.content_id if content.parent else None)),
        workspace = context.toDict(content.workspace)
    )

@pod_serializer(Content, CTX.EMAIL_NOTIFICATION)
def serialize_item(content: Content, context: Context):
    if ContentType.Comment==content.type:
        content = content.parent

    result = DictLikeClass(
        id = content.content_id,
        label = content.label,
        icon = ContentType.get_icon(content.type),
        status = context.toDict(content.get_status()),
        folder = context.toDict(DictLikeClass(id = content.parent.content_id if content.parent else None)),
        workspace = context.toDict(content.workspace),
        is_deleted = content.is_deleted,
        is_archived = content.is_archived,
        url = context.url('/workspaces/{wid}/folders/{fid}/{ctype}/{cid}'.format(wid = content.workspace_id, fid=content.parent_id, ctype=content.type+'s', cid=content.content_id)),
        last_action = context.toDict(content.get_last_action())
    )

    return result


@pod_serializer(Content, CTX.MENU_API)
def serialize_content_for_menu_api(content: Content, context: Context):
    content_id = content.content_id
    workspace_id = content.workspace_id

    has_children = False
    if content.type == ContentType.Folder:
        has_children = content.get_child_nb(ContentType.Any) > 0

    result = DictLikeClass(
        id = CST.TREEVIEW_MENU.ID_TEMPLATE__FULL.format(workspace_id, content_id),
        children = has_children,
        text = content.get_label(),
        a_attr = { 'href' : context.url(ContentType.fill_url(content))},
        li_attr = { 'title': content.get_label(), 'class': 'tracim-tree-item-is-a-folder' },
        type = content.type,
        state = { 'opened': True if ContentType.Folder!=content.type else False, 'selected': False }
    )
    return result


@pod_serializer(Content, CTX.FILES)
@pod_serializer(Content, CTX.PAGES)
def serialize_node_for_page_list(content: Content, context: Context):

    if content.type==ContentType.Page:
        if not content.parent:
            folder = None
        else:
            folder = Context(CTX.DEFAULT).toDict(content.parent)

        result = DictLikeClass(
            id = content.content_id,
            label = content.label,
            status = context.toDict(content.get_status()),
            folder = folder
        )
        return result

    if content.type==ContentType.File:
        result = DictLikeClass(
            id = content.content_id,
            label = content.label,
            status = context.toDict(content.get_status()),
            folder = Context(CTX.DEFAULT).toDict(content.parent)
        )
        return result


    # TODO - DA - 2014-10-16 - THE FOLLOWING CODE SHOULD BE REMOVED
    #
    # if content.type==ContentType.Folder:
    #     return DictLikeClass(
    #         id = content.content_id,
    #         label = content.label,
    #     )

    raise NotImplementedError('node type / context not implemented: {} {}'. format(content.type, context.context_string))


@pod_serializer(Content, CTX.PAGE)
@pod_serializer(Content, CTX.FILE)
def serialize_node_for_page(content: Content, context: Context):

    if content.type in (ContentType.Page, ContentType.File) :
        data_container = content

        # The following properties are overriden by revision values
        if content.revision_to_serialize>0:
            for revision in content.revisions:
                if revision.revision_id==content.revision_to_serialize:
                    data_container = revision
                    break

        result = DictLikeClass(
            id=content.content_id,
            parent=context.toDict(content.parent),
            workspace=context.toDict(content.workspace),
            type=content.type,
            is_new=content.has_new_information_for(context.get_user()),
            content=data_container.description,
            created=data_container.created,
            updated=content.last_revision.updated,
            label=data_container.label,
            icon=ContentType.get_icon(content.type),
            owner=context.toDict(content.first_revision.owner),
            last_modification_author=context.toDict(content.last_revision.owner),
            status=context.toDict(data_container.get_status()),
            links=[],
            revision_nb = len(content.revisions),
            selected_revision='latest' if content.revision_to_serialize<=0 else content.revision_to_serialize,
            history=Context(CTX.CONTENT_HISTORY).toDict(content.get_history()),
            is_editable=content.is_editable,
            is_deleted=content.is_deleted,
            is_archived=content.is_archived,
            urls = context.toDict({
                'mark_read': context.url(Content.format_path('/workspaces/{wid}/folders/{fid}/{ctype}s/{cid}/put_read', content)),
                'mark_unread': context.url(Content.format_path('/workspaces/{wid}/folders/{fid}/{ctype}s/{cid}/put_unread', content))
            })
        )

        if content.type == ContentType.File:
            depot = DepotManager.get()
            depot_stored_file = depot.get(data_container.depot_file)
            result.label = content.label
            result['file'] = DictLikeClass(
                name=data_container.file_name,
                size=depot_stored_file.content_length,
                mimetype=data_container.file_mimetype)
        return result

    if content.type==ContentType.Folder:
        value = DictLikeClass(
            id=content.content_id,
            label=content.label,
            is_new=content.has_new_information_for(context.get_user()),
        )
        return value

    raise NotImplementedError


@pod_serializer(VirtualEvent, CTX.CONTENT_HISTORY)
def serialize_content_for_history(event: VirtualEvent, context: Context):
    urls = DictLikeClass({'delete': None})
    if ContentType.Comment == event.type.id:
        urls = context.toDict({
          'delete': context.url('/workspaces/{wid}/folders/{fid}/{ctype}/{cid}/comments/{commentid}/put_delete'.format(
              wid = event.ref_object.workspace_id,
              fid=event.ref_object.parent.parent_id,
              ctype=event.ref_object.parent.type+'s',
              cid=event.ref_object.parent.content_id,
              commentid=event.ref_object.content_id))
        })

    return DictLikeClass(
        owner=context.toDict(event.owner),
        id=event.id,
        label=event.label,
        type=context.toDict(event.type),
        created=event.created,
        created_as_delta=event.created_as_delta(),
        content=event.content,
        is_new=event.ref_object.has_new_information_for(context.get_user()),
        urls = urls
    )

@pod_serializer(Content, CTX.THREAD)
def serialize_node_for_thread(item: Content, context: Context):
    if item.type==ContentType.Thread:
        return DictLikeClass(
            content = item.description,
            created = item.created,
            updated = item.last_revision.updated,
            revision_nb = len(item.revisions),
            icon = ContentType.get_icon(item.type),
            id = item.content_id,
            label = item.label,
            links=[],
            owner = context.toDict(item.owner),
            last_modification_author=context.toDict(item.last_revision.owner),
            parent = context.toDict(item.parent),
            selected_revision = 'latest',
            status = context.toDict(item.get_status()),
            type = item.type,
            workspace = context.toDict(item.workspace),
            comments = reversed(context.toDict(item.get_comments())),
            is_new=item.has_new_information_for(context.get_user()),
            history = Context(CTX.CONTENT_HISTORY).toDict(item.get_history()),
            is_editable=item.is_editable,
            is_deleted=item.is_deleted,
            is_archived=item.is_archived,
            urls = context.toDict({
                'mark_read': context.url(Content.format_path('/workspaces/{wid}/folders/{fid}/{ctype}s/{cid}/put_read', item)),
                'mark_unread': context.url(Content.format_path('/workspaces/{wid}/folders/{fid}/{ctype}s/{cid}/put_unread', item))
            }),
        )

    if item.type==ContentType.Comment:
        return DictLikeClass(
            is_new=item.has_new_information_for(context.get_user()),
            content = item.description,
            created = item.created,
            created_as_delta = item.created_as_delta(),
            icon = ContentType.get_icon(item.type),
            id = item.content_id,
            label = item.label,
            owner = context.toDict(item.owner),
            # REMOVE parent = context.toDict(item.parent),
            type = item.type,
            urls = context.toDict({
                'delete': context.url('/workspaces/{wid}/folders/{fid}/{ctype}/{cid}/comments/{commentid}/put_delete'.format(wid = item.workspace_id, fid=item.parent.parent_id, ctype=item.parent.type+'s', cid=item.parent.content_id, commentid=item.content_id))
            })
        )

    if item.type==ContentType.Folder:
        return Context(CTX.DEFAULT).toDict(item)



@pod_serializer(Content, CTX.THREADS)
def serialize_node_for_thread_list(content: Content, context: Context):
    if content.type==ContentType.Thread:
        return DictLikeClass(
            id = content.content_id,
            url=ContentType.fill_url(content),
            label=content.get_label(),
            status=context.toDict(content.get_status()),
            folder=context.toDict(content.parent),
            workspace=context.toDict(content.workspace) if content.workspace else None,
            comment_nb=len(content.get_comments())
        )

    if content.type==ContentType.Folder:
        return Context(CTX.DEFAULT).toDict(content)

    raise NotImplementedError

@pod_serializer(Content, CTX.WORKSPACE)
@pod_serializer(Content, CTX.FOLDERS)
def serialize_content_for_workspace(content: Content, context: Context):
    thread_nb_all  = content.get_child_nb(ContentType.Thread)
    thread_nb_open = content.get_child_nb(ContentType.Thread)
    file_nb_all  = content.get_child_nb(ContentType.File)
    file_nb_open = content.get_child_nb(ContentType.File)
    folder_nb_all  = content.get_child_nb(ContentType.Folder)
    folder_nb_open = content.get_child_nb(ContentType.Folder)
    page_nb_all  = content.get_child_nb(ContentType.Page)
    page_nb_open = content.get_child_nb(ContentType.Page)

    content_nb_all = thread_nb_all +\
                     thread_nb_open +\
                     file_nb_all +\
                     file_nb_open +\
                     folder_nb_all +\
                     folder_nb_open +\
                     page_nb_all +\
                     page_nb_open


    result = None
    if content.type==ContentType.Folder:
        result = DictLikeClass(
            id = content.content_id,
            label = content.label,
            thread_nb = DictLikeClass(
                all = thread_nb_all,
                open = thread_nb_open,
            ),
            file_nb = DictLikeClass(
                all = file_nb_all,
                open = file_nb_open,
            ),
            folder_nb = DictLikeClass(
                all = folder_nb_all,
                open = folder_nb_open,
            ),
            page_nb = DictLikeClass(
                all = page_nb_all,
                open = page_nb_open,
            ),
            content_nb = DictLikeClass(all = content_nb_all),
            is_editable=content.is_editable,
        )

    return result

@pod_serializer(Content, CTX.FOLDER)
def serialize_content_for_workspace_and_folder(content: Content, context: Context):
    thread_nb_all  = content.get_child_nb(ContentType.Thread)
    thread_nb_open = content.get_child_nb(ContentType.Thread)
    file_nb_all  = content.get_child_nb(ContentType.File)
    file_nb_open = content.get_child_nb(ContentType.File)
    folder_nb_all  = content.get_child_nb(ContentType.Folder)
    folder_nb_open = content.get_child_nb(ContentType.Folder)
    page_nb_all  = content.get_child_nb(ContentType.Page)
    page_nb_open = content.get_child_nb(ContentType.Page)

    content_nb_all = thread_nb_all +\
                     thread_nb_open +\
                     file_nb_all +\
                     file_nb_open +\
                     folder_nb_all +\
                     folder_nb_open +\
                     page_nb_all +\
                     page_nb_open


    result = None
    if content.type==ContentType.Folder:
        allowed_content = DictLikeClass(content.properties['allowed_content']),

        result = DictLikeClass(
            id=content.content_id,
            label=content.label,
            created=content.created,
            updated=content.last_revision.updated,
            last_modification_author=context.toDict(content.last_revision.owner),
            revision_nb=len(content.revisions),
            workspace=context.toDict(content.workspace),
            allowed_content=DictLikeClass(content.properties['allowed_content']),
            allowed_content_types=context.toDict(content.get_allowed_content_types()),
            selected_revision='latest',
            status=context.toDict(content.get_status()),
            owner=context.toDict(content.owner),
            thread_nb=DictLikeClass(all=thread_nb_all,
                                    open=thread_nb_open),
            file_nb=DictLikeClass(all=file_nb_all,
                                  open=file_nb_open),
            folder_nb=DictLikeClass(all=folder_nb_all,
                                    open=folder_nb_open),
            page_nb=DictLikeClass(all=page_nb_all,
                                  open=page_nb_open),
            content_nb=DictLikeClass(all = content_nb_all),
            is_archived=content.is_archived,
            is_deleted=content.is_deleted,
            is_editable=content.is_editable,
        )

    elif content.type==ContentType.Page:
        result = DictLikeClass(
            id = content.content_id,
            label = content.label,
            created = content.created,
            workspace = context.toDict(content.workspace),
            owner = DictLikeClass(
                id = content.owner.user_id,
                name = content.owner.get_display_name()
            ),
            status = DictLikeClass(id='', label=''), #FIXME - EXPORT DATA
        )

    return result


@pod_serializer(Content, CTX.CONTENT_LIST)
def serialize_content_for_general_list(content: Content, context: Context):
    content_type = ContentType(content.type)

    last_activity_date = content.get_last_activity_date()
    last_activity_date_formatted = format_datetime(last_activity_date,
                                                   locale=tg.i18n.get_lang()[0])
    last_activity_label = format_timedelta(
        datetime.utcnow() - last_activity_date,
        locale=tg.i18n.get_lang()[0],
    )
    last_activity_label = last_activity_label.replace(' ', '\u00A0') # espace insécable

    return DictLikeClass(
        id=content.content_id,
        folder = DictLikeClass({'id': content.parent_id}) if content.parent else None,
        workspace=context.toDict(content.workspace) if content.workspace else None,
        label=content.get_label(),
        url=ContentType.fill_url(content),
        type=DictLikeClass(content_type.toDict()),
        status=context.toDict(content.get_status()),
        is_deleted=content.is_deleted,
        is_archived=content.is_archived,
        is_editable=content.is_editable,
        last_activity = DictLikeClass({'date': last_activity_date,
                                       'label': last_activity_date_formatted,
                                       'delta': last_activity_label})
    )

@pod_serializer(Content, CTX.FOLDER_CONTENT_LIST)
def serialize_content_for_folder_content_list(content: Content, context: Context):
    content_type = ContentType(content.type)

    last_activity_date = content.get_last_activity_date()
    last_activity_date_formatted = format_datetime(last_activity_date,
                                                   locale=tg.i18n.get_lang()[0])
    last_activity_label = format_timedelta(datetime.utcnow() - last_activity_date,
                                           locale=tg.i18n.get_lang()[0])
    last_activity_label = last_activity_label.replace(' ', '\u00A0') # espace insécable


    item = None
    if ContentType.Thread == content.type:
        item = Context(CTX.THREADS).toDict(content)
        item.type = context.toDict(content_type)
        item.folder = DictLikeClass({'id': content.parent_id}) if content.parent else None
        item.workspace = DictLikeClass({'id': content.workspace.workspace_id}) if content.workspace else None
        item.last_activity = DictLikeClass({'date': last_activity_date,
                                            'label': last_activity_date_formatted,
                                            'delta': last_activity_label})

        comments = content.get_comments()
        if len(comments)>1:
            item.notes = _('{nb} messages').format(nb=len(comments))
        else:
            item.notes = _('1 message')

    elif ContentType.File == content.type:
        item = Context(CTX.CONTENT_LIST).toDict(content)
        if len(content.revisions)>1:
            item.notes = _('{nb} revisions').format(nb=len(content.revisions))
        else:
            item.notes = _('1 revision')

    elif ContentType.Folder == content.type:
        item = Context(CTX.CONTENT_LIST).toDict(content)
        item.notes = ''

        folder_nb = content.get_child_nb(ContentType.Folder)
        if folder_nb == 1:
            item.notes += _('1 subfolder<br/>\n')
        elif folder_nb > 1:
            item.notes += _('{} subfolders<br/>').format(folder_nb)

        file_nb = content.get_child_nb(ContentType.File, ContentStatus.OPEN)
        if file_nb == 1:
            item.notes += _('1 open file<br/>\n')
        elif file_nb > 1:
            item.notes += _('{} open files<br/>').format(file_nb)

        thread_nb = content.get_child_nb(ContentType.Thread, ContentStatus.OPEN)
        if thread_nb == 1:
            item.notes += _('1 open thread<br/>\n')
        elif thread_nb > 1:
            item.notes += _('{} open threads<br/>').format(thread_nb)

        page_nb = content.get_child_nb(ContentType.Page, ContentStatus.OPEN)
        if page_nb == 1:
            item.notes += _('1 open page<br/>\n')
        elif page_nb > 1:
            item.notes += _('{} open pages<br/>').format(page_nb)
    else:
        item = Context(CTX.CONTENT_LIST).toDict(content)
        item.notes = ''

    item.is_deleted = content.is_deleted
    item.is_archived = content.is_archived
    item.is_editable = content.is_editable

    return item


@pod_serializer(ContentType, CTX.DEFAULT)
def serialize_breadcrumb_item(content_type: ContentType, context: Context):
    return DictLikeClass(content_type.toDict())


@pod_serializer(Content, CTX.SEARCH)
def serialize_content_for_search_result(content: Content, context: Context):

    def serialize_it():
        nonlocal content

        if content.type == ContentType.Comment:
            logger.info('serialize_content_for_search_result', 'Serializing parent class {} instead of {} [content #{}]'.format(content.parent.type, content.type, content.content_id))
            content = content.parent

        data_container = content

        if content.revision_to_serialize>0:
            for revision in content.revisions:
                if revision.revision_id==content.revision_to_serialize:
                    data_container = revision
                    break

        # FIXME - D.A. - 2015-02-23 - This import should not be there...
        from tracim.lib.content import ContentApi
        breadcrumbs = ContentApi(None).build_breadcrumb(data_container.workspace, data_container.content_id, skip_root=True)

        last_comment_datetime = data_container.updated
        comments = data_container.get_comments()
        if comments:
            last_comment_datetime = max(last_comment_datetime, max(comment.updated for comment in comments))

        content_type = ContentType(content.type)
        result = DictLikeClass(
            id = content.content_id,
            type = DictLikeClass(content_type.toDict()),
            parent = context.toDict(content.parent),
            workspace = context.toDict(content.workspace),

            content = data_container.description,
            content_raw = data_container.description_as_raw_text(),

            created = data_container.created,
            created_as_delta = data_container.created_as_delta(),
            label = data_container.label,
            icon = ContentType.get_icon(content.type),
            owner = context.toDict(data_container.owner),
            status = context.toDict(data_container.get_status()),
            breadcrumb = context.toDict(breadcrumbs),
            last_activity=last_comment_datetime,
            last_activity_as_delta=content.datetime_as_delta(last_comment_datetime)
        )

        if content.type==ContentType.File:
            result.label = content.label.__str__()

        if not result.label or ''==result.label:
            result.label = 'No title'

        return result

    return serialize_it()



########################################################################################################################
# ContentStatus

@pod_serializer(ContentStatus, CTX.DEFAULT)
def serialize_content_status(status: ContentStatus, context: Context):
    return DictLikeClass(
        id = status.id,
        label = status.label,
        icon = status.icon,
        css = status.css
    )

########################################################################################################################
# LinkItem

@pod_serializer(LinkItem, CTX.DEFAULT)
def serialize_content_status(link: LinkItem, context: Context):
    return DictLikeClass(
        href = link.href,
        label = link.href,
    )

########################################################################################################################
# Profile
@pod_serializer(Profile, CTX.DEFAULT)
def serialize_user_list_default(profile: Profile, context: Context):
    return DictLikeClass(
        id = profile.id,
        name = profile.name,
        label = profile.label
    )

########################################################################################################################
## ROLE TYPE


@pod_serializer(RoleType, CTX.ADMIN_WORKSPACE)
@pod_serializer(RoleType, CTX.ADMIN_USER)
def serialize_role_list_for_select_field_in_workspace(role_type: RoleType, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = role_type.role_type_id
    result['icon'] = role_type.icon
    result['label'] = role_type.role_label
    result['style'] = role_type.css_style
    return result


########################################################################################################################
## USER

@pod_serializer(User, CTX.DEFAULT)
@pod_serializer(User, CTX.ADMIN_WORKSPACE)
def serialize_user_default(user: User, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = user.user_id
    result['name'] = user.get_display_name()
    return result

@pod_serializer(User, CTX.USERS)
@pod_serializer(User, CTX.ADMIN_WORKSPACE)
def serialize_user_list_default(user: User, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = user.user_id
    result['name'] = user.get_display_name()
    result['email'] = user.email
    result['enabled'] = user.is_active
    result['profile'] = user.profile
    result['has_password'] = user.password!=None
    result['timezone'] = user.timezone
    return result



@pod_serializer(User, CTX.USER)
@pod_serializer(User, CTX.ADMIN_USER)
@pod_serializer(User, CTX.CURRENT_USER)
def serialize_user_for_user(user: User, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = user.user_id
    result['name'] = user.get_display_name()
    result['email'] = user.email
    result['roles'] = context.toDict(user.roles)
    result['enabled'] = user.is_active
    result['profile'] = user.profile
    result['calendar_url'] = user.calendar_url
    result['timezone'] = user.timezone

    return result

########################################################################################################################
## USER ROLE IN WORKSPACE

@pod_serializer(UserRoleInWorkspace, CTX.ADMIN_WORKSPACE)
@pod_serializer(UserRoleInWorkspace, CTX.WORKSPACE)
def serialize_role_in_workspace(role: UserRoleInWorkspace, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = role.user_id
    result['icon'] = role.icon
    result['name'] = role.user.display_name
    result['role'] = role.role
    result['style'] = role.style
    result['role_description'] = role.role_as_label()
    result['email'] = role.user.email
    result['user'] = context.toDict(role.user)
    result['notifications_subscribed'] = role.do_notify
    return result


@pod_serializer(UserRoleInWorkspace, CTX.USER)
@pod_serializer(UserRoleInWorkspace, CTX.CURRENT_USER)
@pod_serializer(UserRoleInWorkspace, CTX.ADMIN_USER)
def serialize_role_in_list_for_user(role: UserRoleInWorkspace, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = role.role
    result['icon'] = role.icon
    result['label'] = role.role_as_label()
    result['style'] = RoleType(role.role).css_style
    result['workspace'] =  context.toDict(role.workspace)
    result['user'] = Context(CTX.DEFAULT).toDict(role.user)
    result['notifications_subscribed'] = role.do_notify

    # result['workspace_name'] = role.workspace.label

    return result

########################################################################################################################
## WORKSPACE

@pod_serializer(Workspace, CTX.DEFAULT)
def serialize_workspace_default(workspace: Workspace, context: Context):
    result = DictLikeClass(
        id = workspace.workspace_id,
        label = workspace.label,  # FIXME - 2015-08-20 - remove this property
        name = workspace.label,  # use name instead of label
        url = context.url('/workspaces/{}'.format(workspace.workspace_id))
    )
    return result

@pod_serializer(Workspace, CTX.USER)
@pod_serializer(Workspace, CTX.CURRENT_USER)
def serialize_workspace_in_list_for_one_user(workspace: Workspace, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = workspace.workspace_id
    result['name'] = workspace.label

    return result

@pod_serializer(Workspace, CTX.ADMIN_WORKSPACES)
def serialize_workspace_in_list(workspace: pmd.Workspace, context: Context):
    result = DictLikeClass()
    result['id'] = workspace.workspace_id
    result['label'] = workspace.label
    result['description'] = workspace.description
    result['member_nb'] = len(workspace.roles)
    result['calendar_enabled'] = workspace.calendar_enabled
    result['calendar_url'] = workspace.calendar_url

    return result


@pod_serializer(Workspace, CTX.ADMIN_WORKSPACE)
@pod_serializer(Workspace, CTX.WORKSPACE)
def serialize_workspace_complete(workspace: pmd.Workspace, context: Context):
    result = DictLikeClass()
    result['id'] = workspace.workspace_id
    result['label'] = workspace.label
    result['description'] = workspace.description
    result['created'] = workspace.created
    result['members'] = context.toDict(workspace.roles)
    result['member_nb'] = len(workspace.roles)
    result['allowed_content_types'] = context.toDict(workspace.get_allowed_content_types())
    result['calendar_enabled'] = workspace.calendar_enabled
    result['calendar_url'] = workspace.calendar_url

    return result

@pod_serializer(Workspace, CTX.MENU_API)
def serialize_workspace_for_menu_api(workspace: Workspace, context: Context):
    result = DictLikeClass(
        id = CST.TREEVIEW_MENU.ID_TEMPLATE__WORKSPACE_ONLY.format(workspace.workspace_id),
        children = True, # TODO: make this dynamic
        text = workspace.label,
        a_attr = { 'href' : context.url('/workspaces/{}'.format(workspace.workspace_id)) },
        li_attr = { 'title': workspace.label, 'class': 'tracim-tree-item-is-a-workspace' },
        type = 'workspace',
        state = { 'opened': False, 'selected': False }
    )
    return result

@pod_serializer(NodeTreeItem, CTX.MENU_API_BUILD_FROM_TREE_ITEM)
def serialize_node_tree_item_for_menu_api_tree(item: NodeTreeItem, context: Context):
    if isinstance(item.node, Content):
        ContentType.fill_url(item.node)

        return DictLikeClass(
            id=CST.TREEVIEW_MENU.ID_TEMPLATE__FULL.format(item.node.workspace_id, item.node.content_id),
            children=True if ContentType.Folder==item.node.type and len(item.children)<=0 else context.toDict(item.children),
            text=item.node.get_label(),
            a_attr={'href': context.url(ContentType.fill_url(item.node)) },
            li_attr={'title': item.node.get_label()},
            # type='folder',
            type=item.node.type,
            state={'opened': True if ContentType.Folder==item.node.type and len(item.children)>0 else False, 'selected': item.is_selected}
        )
    elif isinstance(item.node, Workspace):
        return DictLikeClass(
            id=CST.TREEVIEW_MENU.ID_TEMPLATE__WORKSPACE_ONLY.format(item.node.workspace_id),
            children=True if len(item.children)<=0 else context.toDict(item.children),
            text=item.node.label,
            a_attr={'href': context.url(ContentType.fill_url_for_workspace(item.node))},
            li_attr={'title': item.node.get_label()},
            type='workspace',
            state={'opened': True if len(item.children)>0 else False, 'selected': item.is_selected}
        )


@pod_serializer(Workspace, CTX.API_WORKSPACE)
def serialize_api_workspace(item: Workspace, context: Context):
    return DictLikeClass(
        id=item.workspace_id,
        label=item.label,
        description=item.description,
        has_calendar=item.calendar_enabled,
    )


@pod_serializer(Workspace, CTX.API_CALENDAR_WORKSPACE)
def serialize_api_calendar_workspace(item: Workspace, context: Context):
    return DictLikeClass(
        id=item.workspace_id,
        label=item.label,
        description=item.description,
        type='workspace',
    )


@pod_serializer(User, CTX.API_CALENDAR_USER)
def serialize_api_calendar_workspace(item: User, context: Context):
    from tracim.lib.calendar import CalendarManager  # Cyclic import
    return DictLikeClass(
        id=item.user_id,
        label=item.display_name,
        description=CalendarManager.get_personal_calendar_description(),
        type='user',
    )
