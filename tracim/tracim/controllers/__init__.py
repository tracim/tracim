# -*- coding: utf-8 -*-
"""Controllers for the tracim application."""
from tracim.lib.workspace import WorkspaceApi

import tg
from tg import RestController
from tg import tmpl_context
from tg.i18n import ugettext as _
from tg.predicates import not_anonymous

from tracim.lib import CST
from tracim.lib.base import BaseController
from tracim.lib.base import logger

from tracim.lib.predicates import current_user_is_contributor
from tracim.lib.predicates import current_user_is_content_manager

from tracim.model.auth import User
from tracim.model.data import ActionDescription, new_revision
from tracim.model.data import BreadcrumbItem
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import Workspace

from tracim.lib.content import ContentApi
from tracim.lib.user import UserStaticApi
from tracim.lib.utils import SameValueError

from tracim.model.serializers import Context
from tracim.model.serializers import DictLikeClass

class TIMRestPathContextSetup(object):

    @classmethod
    def current_user(cls) -> User:
        user = UserStaticApi.get_current_user()
        tmpl_context.current_user_id = user.user_id if user else None
        tmpl_context.current_user = user if user else None
        return user


    @classmethod
    def current_workspace(cls) -> Workspace:
        """
        To be used by other conrtollers in order to setup workspace instance in the context
        """
        workspace_api = WorkspaceApi(tg.tmpl_context.current_user)
        workspace_id = int(tg.request.controller_state.routing_args.get('workspace_id'))
        workspace = workspace_api.get_one(workspace_id)

        tg.tmpl_context.workspace_id = workspace_id
        tg.tmpl_context.workspace = workspace

        return workspace


    @classmethod
    def current_folder(cls) -> Content:
        content_api = ContentApi(tg.tmpl_context.current_user)
        folder_id = int(tg.request.controller_state.routing_args.get('folder_id'))
        folder = content_api.get_one(folder_id, ContentType.Folder, tg.tmpl_context.workspace)

        tg.tmpl_context.folder_id = folder_id
        tg.tmpl_context.folder = folder

        return folder


    @classmethod
    def current_folder(cls) -> Content:
        content_api = ContentApi(tg.tmpl_context.current_user)
        folder_id = int(tg.request.controller_state.routing_args.get('folder_id'))
        folder = content_api.get_one(folder_id, ContentType.Folder, tg.tmpl_context.workspace)

        tg.tmpl_context.folder_id = folder_id
        tg.tmpl_context.folder = folder

        return folder


    @classmethod
    def _current_item_manually(cls, item_id: int, item_type: str) -> Content:
        # in case thread or page or other stuff is instanciated, then force
        # the associated item to be available through generic name tmpl_context.item to be available
        content_api = ContentApi(tg.tmpl_context.current_user)
        item = content_api.get_one(item_id, item_type, tg.tmpl_context.workspace)

        tg.tmpl_context.item_id = item.content_id
        tg.tmpl_context.item = item

        return item


    @classmethod
    def current_thread(cls) -> Content:
        thread_id = int(tg.request.controller_state.routing_args.get('thread_id'))
        thread = cls._current_item_manually(thread_id, ContentType.Thread)
        tg.tmpl_context.thread_id = thread.content_id
        tg.tmpl_context.thread = thread
        return thread


    @classmethod
    def current_page(cls) -> Content:
        page_id = int(tg.request.controller_state.routing_args.get('page_id'))
        page = cls._current_item_manually(page_id, ContentType.Page)
        tg.tmpl_context.page_id = page.content_id
        tg.tmpl_context.page = page
        return page


class TIMRestController(RestController, BaseController):
    """
        Parent controller of most of tracim controlelrs.
        It inserts the current user object into the tmpl_context var,
        so that the object is available in any controller method
    """

    TEMPLATE_NEW = 'unknown "template new"'
    TEMPLATE_EDIT = 'unknown "template edit"'

    def _before(self, *args, **kw):
        """
        Instantiate the current workspace in tg.tmpl_context
        :param args:
        :param kw:
        :return:
        """
        super()._before(*args, **kw)
        TIMRestPathContextSetup.current_user()


class TIMRestControllerWithBreadcrumb(TIMRestController):

    def get_breadcrumb(self, item_id=None) -> [BreadcrumbItem]:
        """
        TODO - Remove this and factorize it with other get_breadcrumb_xxx methods
        :param item_id: an item id (item may be normal content or folder
        :return:
        """
        return ContentApi(tmpl_context.current_user).build_breadcrumb(tmpl_context.workspace, item_id)

    def _struct_new_serialized(self, workspace_id, parent_id):
        print('values are: ', workspace_id, parent_id)
        result = DictLikeClass(
            item=DictLikeClass(parent=DictLikeClass(id=parent_id),
                               workspace=DictLikeClass(id=workspace_id)))

        return result

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def new(self, parent_id=None, workspace_id=None):
        """ Show the add form """
        tg.override_template(self.new, self.TEMPLATE_NEW)

        workspace_id = tg.request.GET['workspace_id']
        parent_id = tg.request.GET['parent_id'] if 'parent_id' in tg.request.GET else None

        return DictLikeClass(result=self._struct_new_serialized(workspace_id, parent_id))


class TIMWorkspaceContentRestController(TIMRestControllerWithBreadcrumb):
    """
    This class is intended to be parent class of controllers managing routes like
    /dashboard/workspaces/{}/folders/{}/someitems/{}
    """
    def _before(self, *args, **kw):
        TIMRestPathContextSetup.current_user()
        TIMRestPathContextSetup.current_workspace()
        TIMRestPathContextSetup.current_folder()


    @property
    def _std_url(self):
        raise NotImplementedError('You must implement this method in child controllers')
        ##
        # ## Example of result:
        ## return tg.url('/dashboard/workspaces/{}/folders/{}/threads/{}')


    @property
    def _err_url(self):
        raise NotImplementedError('You must implement this method in child controllers')
        ##
        # ## Example of result:
        ## return tg.url('/dashboard/workspaces/{}/folders/{}/threads/{}')


    def _parent_url(self):
        raise NotImplementedError('You must implement this method in child controllers')
        ##
        # ## Example of result:
        ## return tg.url('/dashboard/workspaces/{}/folders/{}')


    @property
    def _item_type(self):
        raise NotImplementedError('You must implement this method in child controllers')


    @property
    def _item_type_label(self):
        raise NotImplementedError('You must implement this method in child controllers')


    @property
    def _get_one_context(self) -> str:
        """
        This method should return the get_all context associated to the given Node type
        example: CTX.THREAD
        """
        raise NotImplementedError('You must implement this method in child controllers')


    @property
    def _get_all_context(self) -> str:
        """
        This method should return the get_all context associated to the given Node type
        example: CTX.THREADS
        """
        raise NotImplementedError('You must implement this method in child controllers')

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def new(self, parent_id=None, workspace_id=None):
        """ Show the add form
         Note: parent is the /folders/{parent_id} value
         When refactoring urls, this may be need somme update
        """
        tg.override_template(self.new, self.TEMPLATE_NEW)

        workspace_id = tg.request.GET['workspace_id']
        parent_id = tg.request.GET['parent_id'] if 'parent_id' in tg.request.GET else None

        return DictLikeClass(result=self._struct_new_serialized(workspace_id, parent_id))

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def edit(self, item_id):
        """
        Show the edit form (do not really edit the data)

        :param item_id:
        :return:
        """

        # the follwing line allow to define the template to use in child classes.
        tg.override_template(self.edit, self.TEMPLATE_EDIT)

        item_id = int(item_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        content_api = ContentApi(user)
        item = content_api.get_one(item_id, self._item_type, workspace)

        dictified_item = Context(self._get_one_context).toDict(item, 'item')
        return DictLikeClass(result = dictified_item)

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def put(self, item_id, label='',content=''):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        try:
            api = ContentApi(tmpl_context.current_user)
            item = api.get_one(int(item_id), self._item_type, workspace)
            with new_revision(item):
                api.update_content(item, label, content)
                api.save(item, ActionDescription.REVISION)

            msg = _('{} updated').format(self._item_type_label)
            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(self._std_url.format(tmpl_context.workspace_id, tmpl_context.folder_id, item.content_id))

        except SameValueError as e:
            msg = _('{} not updated: the content did not change').format(self._item_type_label)
            tg.flash(msg, CST.STATUS_WARNING)
            tg.redirect(self._err_url.format(tmpl_context.workspace_id, tmpl_context.folder_id, item_id))

        except ValueError as e:
            msg = _('{} not updated - error: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(self._err_url.format(tmpl_context.workspace_id, tmpl_context.folder_id, item_id))


    @tg.require(current_user_is_contributor())
    @tg.expose()
    def put_status(self, item_id, status):
        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user)
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)
        try:
            with new_revision(item):
                content_api.set_status(item, status)
                content_api.save(item, ActionDescription.STATUS_UPDATE)
            msg = _('{} status updated').format(self._item_type_label)
            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(self._std_url.format(item.workspace_id, item.parent_id, item.content_id))
        except ValueError as e:
            msg = _('{} status not updated: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(self._err_url.format(item.workspace_id, item.parent_id, item.content_id))


    def get_all_fake(self, context_workspace: Workspace, context_folder: Content) -> [Content]:
        """
        fake methods are used in other controllers in order to simulate a client/server api.
        the "client" controller method will include the result into its own fake_api object
        which will be available in the templates

        :param context_workspace: the workspace which would be taken from tmpl_context if we were in the normal behavior
        :return:
        """
        workspace = context_workspace
        content_api = ContentApi(tmpl_context.current_user)
        items = content_api.get_all(context_folder.content_id, self._item_type, workspace)

        dictified_items = Context(self._get_all_context).toDict(items)
        return DictLikeClass(result = dictified_items)


    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put_archive(self, item_id):
        # TODO - CHECK RIGHTS
        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user)
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)
        try:
            next_url = self._parent_url.format(item.workspace_id, item.parent_id)
            undo_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)+'/put_archive_undo'
            msg = _('{} archived. <a class="alert-link" href="{}">Cancel action</a>').format(self._item_type_label, undo_url)

            with new_revision(item):
                content_api.archive(item)
                content_api.save(item, ActionDescription.ARCHIVING)

            tg.flash(msg, CST.STATUS_OK, no_escape=True) # TODO allow to come back
            tg.redirect(next_url)
        except ValueError as e:
            next_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)
            msg = _('{} not archived: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(next_url)

    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put_archive_undo(self, item_id):
        # TODO - CHECK RIGHTS
        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user, True) # Here we do not filter archived items
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)
        try:
            next_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)
            msg = _('{} unarchived.').format(self._item_type_label)
            with new_revision(item):
                content_api.unarchive(item)
                content_api.save(item, ActionDescription.UNARCHIVING)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(next_url )

        except ValueError as e:
            msg = _('{} not un-archived: {}').format(self._item_type_label, str(e))
            next_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)
            # We still use std url because the item has not been archived
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(next_url)


    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put_delete(self, item_id):
        # TODO - CHECK RIGHTS
        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user)
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)
        try:

            next_url = self._parent_url.format(item.workspace_id, item.parent_id)
            undo_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)+'/put_delete_undo'
            msg = _('{} deleted. <a class="alert-link" href="{}">Cancel action</a>').format(self._item_type_label, undo_url)
            with new_revision(item):
                content_api.delete(item)
                content_api.save(item, ActionDescription.DELETION)

            tg.flash(msg, CST.STATUS_OK, no_escape=True)
            tg.redirect(next_url)

        except ValueError as e:
            back_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)
            msg = _('{} not deleted: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(back_url)


    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put_delete_undo(self, item_id):
        # TODO - CHECK RIGHTS

        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user, True, True) # Here we do not filter deleted items
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)
        try:
            next_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)
            msg = _('{} undeleted.').format(self._item_type_label)
            with new_revision(item):
                content_api.undelete(item)
                content_api.save(item, ActionDescription.UNDELETION)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(next_url)

        except ValueError as e:
            logger.debug(self, 'Exception: {}'.format(e.__str__))
            back_url = self._parent_url.format(item.workspace_id, item.parent_id)
            msg = _('{} not un-deleted: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(back_url)

    @tg.expose()
    @tg.require(not_anonymous())
    def put_read(self, item_id):
        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user, True, True) # Here we do not filter deleted items
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)

        item_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)

        try:
            msg = _('{} marked as read.').format(self._item_type_label)
            content_api.mark_read(item)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(item_url)

        except ValueError as e:
            logger.debug(self, 'Exception: {}'.format(e.__str__))
            msg = _('{} not marked as read: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(item_url)

    @tg.expose()
    @tg.require(not_anonymous())
    def put_unread(self, item_id):
        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user, True, True) # Here we do not filter deleted items
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)

        item_url = self._std_url.format(item.workspace_id, item.parent_id, item.content_id)

        try:
            msg = _('{} marked unread.').format(self._item_type_label)
            content_api.mark_unread(item)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(item_url)

        except ValueError as e:
            logger.debug(self, 'Exception: {}'.format(e.__str__))
            msg = _('{} not marked unread: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(item_url)

class StandardController(BaseController):

    def _before(self, *args, **kw):
        """
        Instantiate the current workspace in tg.tmpl_context
        :param args:
        :param kw:
        :return:
        """
        super()._before(*args, **kw)
        TIMRestPathContextSetup.current_user()

    @classmethod
    def current_item_id_key_in_context(self):
        return ''

