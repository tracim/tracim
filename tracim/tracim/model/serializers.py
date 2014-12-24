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
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import RoleType
from tracim.model.data import UserRoleInWorkspace
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
    ADMIN_WORKSPACE = 'ADMIN_WORKSPACE'
    ADMIN_WORKSPACES = 'ADMIN_WORKSPACES'
    CURRENT_USER = 'CURRENT_USER'
    DEFAULT = 'DEFAULT' # default context. This will allow to define a serialization method to be used by default
    EMAIL_NOTIFICATION = 'EMAIL_NOTIFICATION'
    FILE = 'FILE'
    FILES = 'FILES'
    FOLDER = 'FOLDER'
    FOLDERS = 'FOLDERS'
    MENU_API = 'MENU_API'
    MENU_API_BUILD_FROM_TREE_ITEM = 'MENU_API_BUILD_FROM_TREE_ITEM'
    PAGE = 'PAGE'
    PAGES = 'PAGES'
    THREAD = 'THREAD'
    THREADS = 'THREADS'
    USER = 'USER'
    USERS = 'USERS'
    WORKSPACE = 'WORKSPACE'


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

    def __init__(self, context_string, base_url=''):
        """
        """
        self.context_string = context_string
        self._base_url = base_url # real root url like http://mydomain.com:8080

    def url(self, base_url='/', params=None, qualified=False) -> str:
        url = tg.url(base_url, params)

        if self._base_url:
            url = '{}{}'.format(self._base_url, url)
        return  url

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
        label = version.label if version.label else version.file_name,
        owner = context.toDict(version.owner),
        created = version.created,
        action = context.toDict(version.get_last_action())
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
    return DictLikeClass(
        id = content.content_id,
        label = content.label if content.label else content.file_name,
        icon = ContentType.icon(content.type),
        status = context.toDict(content.get_status()),
        folder = context.toDict(DictLikeClass(id = content.parent.content_id if content.parent else None)),
        workspace = context.toDict(content.workspace),
        is_deleted = content.is_deleted,
        is_archived = content.is_archived,
        url = context.url('/workspaces/{wid}/folders/{fid}/{ctype}/{cid}'.format(wid = content.workspace_id, fid=content.parent_id, ctype=content.type+'s', cid=content.content_id))
    )


@pod_serializer(Content, CTX.MENU_API)
def serialize_content_for_menu_api(content: Content, context: Context):
    content_id = content.content_id
    workspace_id = content.workspace_id

    result = DictLikeClass(
        id = CST.TREEVIEW_MENU.ID_TEMPLATE__FULL.format(workspace_id, content_id),
        children = True, # TODO: make this dynamic
        text = content.get_label(),
        a_attr = { 'href' : context.url(ContentType.fill_url(content)) },
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
            label = content.label if content.label else content.file_name,
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
            id = content.content_id,
            parent = context.toDict(content.parent),
            workspace = context.toDict(content.workspace),
            type = content.type,

            content = data_container.description,
            created = data_container.created,
            label = data_container.label,
            icon = ContentType.icon(content.type),
            owner = context.toDict(data_container.owner),
            status = context.toDict(data_container.get_status()),
            links = context.toDict(content.extract_links_from_content(data_container.description)),
            revisions = context.toDict(sorted(content.revisions, key=lambda v: v.created, reverse=True)),
            selected_revision = 'latest' if content.revision_to_serialize<=0 else content.revision_to_serialize
        )

        if content.type==ContentType.File:
            result.label = content.label if content.label else content.file_name
            result['file'] = DictLikeClass(
                name = data_container.file_name,
                size = len(data_container.file_content),
                mimetype = data_container.file_mimetype)
        return result

    if content.type==ContentType.Folder:
        value = DictLikeClass(
            id = content.content_id,
            label = content.label,
        )
        return value

    raise NotImplementedError


@pod_serializer(Content, CTX.THREAD)
def serialize_node_for_page(item: Content, context: Context):
    if item.type==ContentType.Thread:
        return DictLikeClass(
            content = item.description,
            created = item.created,
            icon = ContentType.icon(item.type),
            id = item.content_id,
            label = item.label,
            links = context.toDict(item.extract_links_from_content(item.description)),
            owner = context.toDict(item.owner),
            parent = context.toDict(item.parent),
            selected_revision = 'latest',
            status = context.toDict(item.get_status()),
            type = item.type,
            workspace = context.toDict(item.workspace),
            comments = reversed(context.toDict(item.get_comments()))
        )

    if item.type==ContentType.Comment:
        return DictLikeClass(
            content = item.description,
            created = item.created,
            icon = ContentType.icon(item.type),
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
    ### CODE BELOW IS REPLACED BY THE TWO LINES UP ^^
    # 2014-10-08 - IF YOU FIND THIS COMMENT, YOU CAn REMOVE THE CODE
    #
    #if item.type==ContentType.Folder:
    #    value = DictLikeClass(
    #        id = item.content_id,
    #        label = item.label,
    #    )
    #    return value

    raise NotImplementedError


@pod_serializer(Content, CTX.THREADS)
def serialize_node_for_thread_list(content: Content, context: Context):
    if content.type==ContentType.Thread:
        return DictLikeClass(
            id = content.content_id,
            label = content.label,
            status = context.toDict(content.get_status()),
            folder = context.toDict(content.parent),
            comment_nb = len(content.get_comments())
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
            content_nb = DictLikeClass(all = content_nb_all)
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
        result = DictLikeClass(
            id = content.content_id,
            label = content.label,
            created = content.created,
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
    result['email'] = user.email
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
    result['email'] = user.email
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
    result['email'] = role.user.email
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
    result['notifications_subscribed'] = role.do_notify

    # result['workspace_name'] = role.workspace.label

    return result

########################################################################################################################
## WORKSPACE

@pod_serializer(Workspace, CTX.DEFAULT)
def serialize_workspace_default(workspace: Workspace, context: Context):
    result = DictLikeClass(
        id = workspace.workspace_id,
        label = workspace.label,
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

    #    roles = serializableObject.roles
    #    result['users'] = context.toDict(serializableObject.roles)
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
