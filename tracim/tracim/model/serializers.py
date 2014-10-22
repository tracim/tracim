# -*- coding: utf-8 -*-
import types

import tg
from tg.util import LazyString
from tracim.lib.base import logger
from tracim.model.auth import Group, Profile
from tracim.model.auth import User
from tracim.model.data import BreadcrumbItem, ActionDescription
from tracim.model.data import ContentStatus
from tracim.model.data import ContentRevisionRO
from tracim.model.data import LinkItem
from tracim.model.data import NodeTreeItem
from tracim.model.data import PBNode
from tracim.model.data import PBNodeType
from tracim.model.data import RoleType
from tracim.model.data import UserRoleInWorkspace
from tracim.model.data import Workspace

from tracim.model import data as pmd
from tracim.lib import CST

def node_to_dict(node: pmd.PBNode, children_content, new_item_state):
    """
    DEPRECATED - TODO - REMOVE
        children_content may be boolean or a list containing json values
    """
    url = tg.url('/document/', dict(node_id=node.node_id)) ## FIXME - 2014-05-27 - Make this more flexible

    return dict(
        id = node.node_id,
        children = children_content,
        text = node.data_label,
        a_attr = { "href" : url },
        li_attr = { "title": node.data_label },
        type = node.node_type, # this property is understandable by jstree (through "types" plugin)
        state = new_item_state,
        node_status = node.getStatus().getId() # this is not jstree understandable data. This requires a JS 'success' callback
    )


def PBNodeForMenu(func):

    def process_item(item: pmd.PBNode):
        """ convert given item into a dictionnary """
        return node_to_dict(item, item.getChildNb()>0, None)

    def pre_serialize(*args, **kws):
        initial_result = func(*args, **kws)
        real_result = None

        if isinstance(initial_result, list):
            real_result = list()
            for value_item in initial_result:
                real_result.append(process_item(value_item))
        else:
            # We suppose here that we have an object only
            real_result = process_item(initial_result)

        return dict(d = real_result)

    return pre_serialize


def NodeTreeItemForMenu(func):
    """ works with structure NodeTreeItem """
    def process_item(structure_item: pmd.NodeTreeItem, current_node_id=None):
        """ convert given item into a dictionnary """

        item = structure_item.node
        children = []

        for child_item in structure_item.children:
            children.append(process_item(child_item, current_node_id))

        children_field_value = None
        if len(children)>0:
            children_field_value = children
        elif item.getChildNb()>0:
            children_field_value = True
        else:
            children_field_value = False

        new_item_state = dict(
            opened = item.getChildNb()<=0 or len(children)>0,
            selected = current_node_id!=None and item.node_id==current_node_id,
        )

        return node_to_dict(item, children_field_value, new_item_state)

    def pre_serialize(*args, **kws):
        initial_result = func(*args, **kws)
        real_result = None

        current_node_id = None
        if "current_node_id" in kws:
            current_node_id = int(kws['current_node_id'])

        if isinstance(initial_result, list):
            real_result = list()
            for value_item in initial_result:
                real_result.append(process_item(value_item, current_node_id))
        else:
            # We suppose here that we have an object only
            real_result = process_item(initial_result, current_node_id)

        return dict(d = real_result)

    return pre_serialize

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
    DEFAULT = 'DEFAULT' # default context. This will allow to define a serialization method to be used by default

    CURRENT_USER = 'CURRENT_USER'

    USER = 'USER'
    USERS = 'USERS'
    ADMIN_WORKSPACE = 'ADMIN_WORKSPACE'
    ADMIN_WORKSPACES = 'ADMIN_WORKSPACES'

    WORKSPACE = 'WORKSPACE'
    FOLDER = 'FOLDER'
    FOLDERS = 'FOLDERS'

    FILE = 'FILE'
    FILES = 'FILES'

    PAGE = 'PAGE'
    PAGES = 'PAGES'

    THREAD = 'THREAD'
    THREADS = 'THREADS'

    MENU_API = 'MENU_API'
    MENU_API_BUILD_FROM_TREE_ITEM = 'MENU_API_BUILD_FROM_TREE_ITEM'


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
        except:
            if CTX.DEFAULT in Context._converters:
                if model_class in Context._converters[CTX.DEFAULT]:
                    return Context._converters[CTX.DEFAULT][model_class]

            raise ContextConverterNotFoundException(context_string,model_class)

    def __init__(self, context_string):
        """
        """
        self.context_string = context_string

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
        id = version.version_id,
        node_id = version.node_id,
        label = version.data_label if version.data_label else version.data_file_name,
        owner = context.toDict(version.owner),
        created = version.created_at,
        action = context.toDict(version.get_last_action())
    )


@pod_serializer(PBNode, CTX.DEFAULT)
def serialize_breadcrumb_item(content: PBNode, context: Context):
    return DictLikeClass(
        id = content.node_id,
        label = content.data_label,
        folder = context.toDict(DictLikeClass(id = content.parent.node_id if content.parent else None)),
        # folder = None if not content.parent else context.toDict(DictLikeClass(id = content.parent.node_id)),
        workspace = context.toDict(content.workspace)
    )


@pod_serializer(PBNode, CTX.MENU_API)
def serialize_content_for_menu_api(content: PBNode, context: Context):
    content_id = content.node_id
    workspace_id = content.workspace_id

    result = DictLikeClass(
        id = CST.TREEVIEW_MENU.ID_TEMPLATE__FULL.format(workspace_id, content_id),
        children = True, # TODO: make this dynamic
        text = content.data_label,
        a_attr = { 'href' : tg.url('/workspaces/{}/folders/{}'.format(workspace_id, content_id)) },
        li_attr = { 'title': content.data_label, 'class': 'tracim-tree-item-is-a-folder' },
        type = content.node_type,
        state = { 'opened': False, 'selected': False }
    )
    return result


@pod_serializer(PBNode, CTX.FILES)
@pod_serializer(PBNode, CTX.PAGES)
def serialize_node_for_page_list(content: PBNode, context: Context):

    if content.node_type==PBNodeType.Page:
        if not content.parent:
            folder = None
        else:
            print('FOLDER PARENT IS', content.parent)
            folder = Context(CTX.DEFAULT).toDict(content.parent)
        print('FOLDER IS', folder)
        result = DictLikeClass(
            id = content.node_id,
            label = content.data_label,
            status = context.toDict(content.get_status()),
            folder = folder
        )
        return result

    if content.node_type==PBNodeType.File:
        result = DictLikeClass(
            id = content.node_id,
            label = content.data_label if content.data_label else content.data_file_name,
            status = context.toDict(content.get_status()),
            folder = Context(CTX.DEFAULT).toDict(content.parent)
        )
        return result


    # TODO - DA - 2014-10-16 - THE FOLLOWING CODE SHOULD BE REMOVED
    #
    # if content.node_type==PBNodeType.Folder:
    #     return DictLikeClass(
    #         id = content.node_id,
    #         label = content.data_label,
    #     )

    raise NotImplementedError('node type / context not implemented: {} {}'. format(content.node_type, context.context_string))


@pod_serializer(PBNode, CTX.PAGE)
@pod_serializer(PBNode, CTX.FILE)
def serialize_node_for_page(content: PBNode, context: Context):
    if content.node_type in (PBNodeType.Page, PBNodeType.File) :
        data_container = content



        # The following properties are overriden by revision values
        if content.revision_to_serialize>0:
            for revision in content.revisions:
                if revision.version_id==content.revision_to_serialize:
                    data_container = revision
                    break

        result = DictLikeClass(
            id = content.node_id,
            parent = context.toDict(content.parent),
            workspace = context.toDict(content.workspace),
            type = content.node_type,

            content = data_container.data_content,
            created = data_container.created_at,
            label = data_container.data_label,
            icon = PBNodeType.icon(content.node_type),
            owner = context.toDict(data_container.owner),
            status = context.toDict(data_container.get_status()),
            links = context.toDict(content.extract_links_from_content(data_container.data_content)),
            revisions = context.toDict(sorted(content.revisions, key=lambda v: v.created_at, reverse=True)),
            selected_revision = 'latest' if content.revision_to_serialize<=0 else content.revision_to_serialize
        )

        if content.node_type==PBNodeType.File:
            result.label = content.data_label if content.data_label else content.data_file_name
            result['file'] = DictLikeClass(
                name = data_container.data_file_name,
                size = len(data_container.data_file_content),
                mimetype = data_container.data_file_mime_type)
        return result

    if content.node_type==PBNodeType.Folder:
        value = DictLikeClass(
            id = content.node_id,
            label = content.data_label,
        )
        return value

    raise NotImplementedError


@pod_serializer(PBNode, CTX.THREAD)
def serialize_node_for_page(item: PBNode, context: Context):
    if item.node_type==PBNodeType.Thread:
        return DictLikeClass(
            content = item.data_content,
            created = item.created_at,
            icon = PBNodeType.icon(item.node_type),
            id = item.node_id,
            label = item.data_label,
            links = context.toDict(item.extract_links_from_content(item.data_content)),
            owner = context.toDict(item.owner),
            parent = context.toDict(item.parent),
            selected_revision = 'latest',
            status = context.toDict(item.get_status()),
            type = item.node_type,
            workspace = context.toDict(item.workspace),
            comments = reversed(context.toDict(item.get_comments()))
        )

    if item.node_type==PBNodeType.Comment:
        return DictLikeClass(
            content = item.data_content,
            created = item.created_at,
            icon = PBNodeType.icon(item.node_type),
            id = item.node_id,
            label = item.data_label,
            owner = context.toDict(item.owner),
            # REMOVE parent = context.toDict(item.parent),
            type = item.node_type,
        )

    if item.node_type==PBNodeType.Folder:
        return Context(CTX.DEFAULT).toDict(item)
    ### CODE BELOW IS REPLACED BY THE TWO LINES UP ^^
    # 2014-10-08 - IF YOU FIND THIS COMMENT, YOU CAn REMOVE THE CODE
    #
    #if item.node_type==PBNodeType.Folder:
    #    value = DictLikeClass(
    #        id = item.node_id,
    #        label = item.data_label,
    #    )
    #    return value

    raise NotImplementedError


@pod_serializer(PBNode, CTX.THREADS)
def serialize_node_for_thread_list(content: PBNode, context: Context):
    if content.node_type==PBNodeType.Thread:
        return DictLikeClass(
            id = content.node_id,
            label = content.data_label,
            status = context.toDict(content.get_status()),
            folder = context.toDict(content.parent),
            comment_nb = len(content.get_comments())
        )

    if content.node_type==PBNodeType.Folder:
        return Context(CTX.DEFAULT).toDict(content)

    raise NotImplementedError

@pod_serializer(PBNode, CTX.WORKSPACE)
@pod_serializer(PBNode, CTX.FOLDERS)
def serialize_content_for_workspace(content: PBNode, context: Context):
    content_id = content.node_id
    workspace_id = content.workspace_id

    thread_nb_all  = content.get_child_nb(PBNodeType.Thread)
    thread_nb_open = content.get_child_nb(PBNodeType.Thread)
    file_nb_all  = content.get_child_nb(PBNodeType.File)
    file_nb_open = content.get_child_nb(PBNodeType.File)
    folder_nb_all  = content.get_child_nb(PBNodeType.Folder)
    folder_nb_open = content.get_child_nb(PBNodeType.Folder)
    page_nb_all  = content.get_child_nb(PBNodeType.Data)
    page_nb_open = content.get_child_nb(PBNodeType.Data)

    content_nb_all = thread_nb_all +\
                     thread_nb_open +\
                     file_nb_all +\
                     file_nb_open +\
                     folder_nb_all +\
                     folder_nb_open +\
                     page_nb_all +\
                     page_nb_open


    if content.node_type==PBNodeType.Folder:
        result = DictLikeClass(
            id = content.node_id,
            label = content.data_label,
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
            content_nb = DictLikeClass(all = content_nb_all)
        )

    return result

@pod_serializer(PBNode, CTX.FOLDER)
def serialize_content_for_workspace_and_folder(content: PBNode, context: Context):
    content_id = content.node_id
    workspace_id = content.workspace_id

    thread_nb_all  = content.get_child_nb(PBNodeType.Thread)
    thread_nb_open = content.get_child_nb(PBNodeType.Thread)
    file_nb_all  = content.get_child_nb(PBNodeType.File)
    file_nb_open = content.get_child_nb(PBNodeType.File)
    folder_nb_all  = content.get_child_nb(PBNodeType.Folder)
    folder_nb_open = content.get_child_nb(PBNodeType.Folder)
    page_nb_all  = content.get_child_nb(PBNodeType.Data)
    page_nb_open = content.get_child_nb(PBNodeType.Data)

    content_nb_all = thread_nb_all +\
                     thread_nb_open +\
                     file_nb_all +\
                     file_nb_open +\
                     folder_nb_all +\
                     folder_nb_open +\
                     page_nb_all +\
                     page_nb_open


    if content.node_type==PBNodeType.Folder:
        result = DictLikeClass(
            id = content.node_id,
            label = content.data_label,
            created = content.created_at,
            workspace = context.toDict(content.workspace),
            allowed_content = DictLikeClass(content.properties['allowed_content']),
            selected_revision = 'latest',
            status = context.toDict(content.get_status()),
            owner = context.toDict(content.owner),
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
            content_nb = DictLikeClass(all = content_nb_all)
        )

    elif content.node_type==PBNodeType.Page:
        result = DictLikeClass(
            id = content.node_id,
            label = content.data_label,
            created = content.created_at,
            workspace = context.toDict(content.workspace),
            owner = DictLikeClass(
                id = content._oOwner.user_id,
                name = content._oOwner.display_name
            ),
            status = DictLikeClass(id='', label=''), #FIXME - EXPORT DATA
        )

    return result


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
def serialize_role_list_for_select_field_in_workspace(role_type: RoleType, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = role_type.role_type_id
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
    result['email'] = user.email_address
    result['enabled'] = user.is_active
    result['profile'] = user.profile
    return result



@pod_serializer(User, CTX.USER)
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
    result['email'] = user.email_address
    result['roles'] = context.toDict(user.roles)
    result['enabled'] = user.is_active
    result['profile'] = user.profile

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
    result['name'] = role.user.display_name
    result['role'] = role.role
    result['style'] = role.style
    result['role_description'] = role.role_as_label()
    result['email'] = role.user.email_address
    return result


@pod_serializer(UserRoleInWorkspace, CTX.USER)
@pod_serializer(UserRoleInWorkspace, CTX.CURRENT_USER)
def serialize_role_in_list_for_user(role: UserRoleInWorkspace, context: Context):
    """
    Actually, roles are serialized as users (with minimal information)
    :param role:
    :param context:
    :return:
    """
    result = DictLikeClass()
    result['id'] = role.role
    result['label'] = role.role_as_label()
    result['style'] = RoleType(role.role).css_style
    result['workspace'] =  context.toDict(role.workspace)
    # result['workspace_name'] = role.workspace.data_label

    return result

########################################################################################################################
## WORKSPACE

@pod_serializer(Workspace, CTX.DEFAULT)
def serialize_workspace_default(workspace: Workspace, context: Context):
    result = DictLikeClass(
        id = workspace.workspace_id,
        label = workspace.data_label
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
    result['name'] = workspace.data_label

    return result

@pod_serializer(Workspace, CTX.ADMIN_WORKSPACES)
def serialize_workspace_in_list(workspace: pmd.Workspace, context: Context):
    result = DictLikeClass()
    result['id'] = workspace.workspace_id
    result['label'] = workspace.data_label
    result['description'] = workspace.data_comment
    result['member_nb'] = len(workspace.roles)

    #    roles = serializableObject.roles
    #    result['users'] = context.toDict(serializableObject.roles)
    return result


@pod_serializer(Workspace, CTX.ADMIN_WORKSPACE)
@pod_serializer(Workspace, CTX.WORKSPACE)
def serialize_workspace_complete(workspace: pmd.Workspace, context: Context):
    result = DictLikeClass()
    result['id'] = workspace.workspace_id
    result['label'] = workspace.data_label
    result['description'] = workspace.data_comment
    result['created'] = workspace.created_at
    result['members'] = context.toDict(workspace.roles)
    result['member_nb'] = len(workspace.roles)

    return result

@pod_serializer(Workspace, CTX.MENU_API)
def serialize_workspace_for_menu_api(workspace: Workspace, context: Context):
    result = DictLikeClass(
        id = CST.TREEVIEW_MENU.ID_TEMPLATE__WORKSPACE_ONLY.format(workspace.workspace_id),
        children = True, # TODO: make this dynamic
        text = workspace.data_label,
        a_attr = { 'href' : tg.url('/workspaces/{}'.format(workspace.workspace_id)) },
        li_attr = { 'title': workspace.data_label, 'class': 'tracim-tree-item-is-a-workspace' },
        type = 'workspace',
        state = { 'opened': False, 'selected': False }
    )
    return result

@pod_serializer(NodeTreeItem, CTX.MENU_API_BUILD_FROM_TREE_ITEM)
def serialize_node_tree_item_for_menu_api_tree(item: NodeTreeItem, context: Context):
    if isinstance(item.node, PBNode):
        return DictLikeClass(
            id=CST.TREEVIEW_MENU.ID_TEMPLATE__FULL.format(item.node.workspace_id, item.node.node_id),
            children=True if len(item.children)<=0 else context.toDict(item.children),
            text=item.node.data_label,
            a_attr={'href': tg.url('/workspaces/{}/folders/{}'.format(item.node.workspace_id, item.node.node_id)) },
            li_attr={'title': item.node.data_label, 'class': 'tracim-tree-item-is-a-folder'},
            type='folder',
            state={'opened': True if len(item.children)>0 else False, 'selected': item.is_selected}
        )
    elif isinstance(item.node, Workspace):
        return DictLikeClass(
            id=CST.TREEVIEW_MENU.ID_TEMPLATE__WORKSPACE_ONLY.format(item.node.workspace_id),
            children=True if len(item.children)<=0 else context.toDict(item.children),
            text=item.node.data_label,
            a_attr={'href': tg.url('/workspaces/{}'.format(item.node.workspace_id))},
            li_attr={'title': item.node.data_label, 'class': 'tracim-tree-item-is-a-workspace'},
            type='workspace',
            state={'opened': True if len(item.children)>0 else False, 'selected': item.is_selected}
        )


