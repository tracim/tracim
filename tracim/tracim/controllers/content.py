# -*- coding: utf-8 -*-
__author__ = 'damien'

from cgi import FieldStorage

import tg
from tg import tmpl_context
from tg.i18n import ugettext as _
from tg.predicates import not_anonymous

import traceback

from tracim.controllers import TIMRestController
from tracim.controllers import TIMRestPathContextSetup
from tracim.controllers import TIMRestControllerWithBreadcrumb
from tracim.controllers import TIMWorkspaceContentRestController

from tracim.lib import CST
from tracim.lib.base import BaseController
from tracim.lib.base import logger
from tracim.lib.content import ContentApi
from tracim.lib.helpers import convert_id_into_instances
from tracim.lib.predicates import current_user_is_reader
from tracim.lib.predicates import current_user_is_contributor
from tracim.lib.predicates import current_user_is_content_manager
from tracim.lib.predicates import require_current_user_is_owner

from tracim.model.serializers import Context, CTX, DictLikeClass
from tracim.model.data import ActionDescription
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import Workspace

class UserWorkspaceFolderThreadCommentRestController(TIMRestController):

    @property
    def _item_type(self):
        return ContentType.Comment

    @property
    def _item_type_label(self):
        return _('Comment')

    def _before(self, *args, **kw):
        TIMRestPathContextSetup.current_user()
        TIMRestPathContextSetup.current_workspace()
        TIMRestPathContextSetup.current_folder()
        TIMRestPathContextSetup.current_thread()

    @tg.expose()
    @tg.require(current_user_is_contributor())
    def post(self, content=''):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace
        thread = tmpl_context.thread


        api = ContentApi(tmpl_context.current_user)

        comment = api.create_comment(workspace, thread, content, True)

        next_url = tg.url('/workspaces/{}/folders/{}/threads/{}').format(tmpl_context.workspace_id,
                                                                              tmpl_context.folder_id,
                                                                              tmpl_context.thread_id)
        tg.flash(_('Comment added'), CST.STATUS_OK)
        tg.redirect(next_url)

    @tg.expose()
    @tg.require(not_anonymous())
    def put_delete(self, item_id):
        require_current_user_is_owner(int(item_id))

        # TODO - CHECK RIGHTS
        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user)
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)

        try:

            next_url = tg.url('/workspaces/{}/folders/{}/threads/{}').format(tmpl_context.workspace_id,
                                                                             tmpl_context.folder_id,
                                                                             tmpl_context.thread_id)
            undo_url = tg.url('/workspaces/{}/folders/{}/threads/{}/comments/{}/put_delete_undo').format(tmpl_context.workspace_id,
                                                                                                         tmpl_context.folder_id,
                                                                                                         tmpl_context.thread_id,
                                                                                                         item_id)

            msg = _('{} deleted. <a class="alert-link" href="{}">Cancel action</a>').format(self._item_type_label, undo_url)
            content_api.delete(item)
            content_api.save(item, ActionDescription.DELETION)

            tg.flash(msg, CST.STATUS_OK, no_escape=True)
            tg.redirect(next_url)

        except ValueError as e:
            back_url = tg.url('/workspaces/{}/folders/{}/threads/{}').format(tmpl_context.workspace_id,
                                                                             tmpl_context.folder_id,
                                                                             tmpl_context.thread_id)
            msg = _('{} not deleted: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(back_url)


    @tg.expose()
    @tg.require(not_anonymous())
    def put_delete_undo(self, item_id):
        require_current_user_is_owner(int(item_id))

        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user, True, True) # Here we do not filter deleted items
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)
        try:
            next_url = tg.url('/workspaces/{}/folders/{}/threads/{}').format(tmpl_context.workspace_id,
                                                                             tmpl_context.folder_id,
                                                                             tmpl_context.thread_id)
            msg = _('{} undeleted.').format(self._item_type_label)
            content_api.undelete(item)
            content_api.save(item, ActionDescription.UNDELETION)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(next_url)

        except ValueError as e:
            logger.debug(self, 'Exception: {}'.format(e.__str__))
            back_url = tg.url('/workspaces/{}/folders/{}/threads/{}').format(tmpl_context.workspace_id,
                                                                             tmpl_context.folder_id,
                                                                             tmpl_context.thread_id)
            msg = _('{} not un-deleted: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(back_url)


class UserWorkspaceFolderFileRestController(TIMWorkspaceContentRestController):
    """
    manage a path like this: /workspaces/1/folders/XXX/files/4
    """

    @property
    def _std_url(self):
        return tg.url('/workspaces/{}/folders/{}/files/{}')

    @property
    def _parent_url(self):
        return tg.url('/workspaces/{}/folders/{}')

    @property
    def _item_type(self):
        return ContentType.File

    @property
    def _item_type_label(self):
        return _('File')

    @property
    def _get_one_context(self) -> str:
        return CTX.FILE

    @property
    def _get_all_context(self) -> str:
        return CTX.FILES

    @property
    def _edit_template(self) -> str:
        return 'mako:tracim.templates.user_workspace_folder_file_edit'


    @tg.require(current_user_is_reader())
    @tg.expose('tracim.templates.user_workspace_folder_file_get_one')
    def get_one(self, file_id, revision_id=None):
        file_id = int(file_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace
        workspace_id = tmpl_context.workspace_id

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        content_api = ContentApi(user)
        if revision_id:
            file = content_api.get_one_from_revision(file_id,  self._item_type, workspace, revision_id)
        else:
            file = content_api.get_one(file_id, self._item_type, workspace)

        fake_api_breadcrumb = self.get_breadcrumb(file_id)
        fake_api_content = DictLikeClass(breadcrumb=fake_api_breadcrumb, current_user=current_user_content)
        fake_api = Context(CTX.FOLDER).toDict(fake_api_content)

        dictified_file = Context(self._get_one_context).toDict(file, 'file')
        return DictLikeClass(result = dictified_file, fake_api=fake_api)

    @tg.require(current_user_is_reader())
    @tg.expose()
    def download(self, file_id, revision_id=None):
        file_id = int(file_id)
        revision_id = int(revision_id) if revision_id!='latest' else None
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        content_api = ContentApi(user)
        revision_to_send = None
        if revision_id:
            item = content_api.get_one_from_revision(file_id,  self._item_type, workspace, revision_id)
        else:
            item = content_api.get_one(file_id, self._item_type, workspace)

        revision_to_send = None
        if item.revision_to_serialize<=0:
            for revision in item.revisions:
                if not revision_to_send:
                    revision_to_send = revision

                if revision.revision_id>revision_to_send.revision_id:
                    revision_to_send = revision
        else:
            for revision in item.revisions:
                if revision.revision_id==item.revision_to_serialize:
                    revision_to_send = revision
                    break

        content_type = 'application/x-download'
        if revision_to_send.file_mimetype:
            content_type = str(revision_to_send.file_mimetype)
            tg.response.headers['Content-type'] = str(revision_to_send.file_mimetype)

        tg.response.headers['Content-Type'] = content_type
        tg.response.headers['Content-Disposition'] = str('attachment; filename="{}"'.format(revision_to_send.file_name))
        return revision_to_send.file_content


    def get_all_fake(self, context_workspace: Workspace, context_folder: Content):
        """
        fake methods are used in other controllers in order to simulate a client/server api.
        the "client" controller method will include the result into its own fake_api object
        which will be available in the templates

        :param context_workspace: the workspace which would be taken from tmpl_context if we were in the normal behavior
        :return:
        """
        workspace = context_workspace
        content_api = ContentApi(tmpl_context.current_user)
        files = content_api.get_all(context_folder.content_id, ContentType.File, workspace)

        dictified_files = Context(CTX.FILES).toDict(files)
        return DictLikeClass(result = dictified_files)


    @tg.require(current_user_is_contributor())
    @tg.expose()
    def post(self, label='', file_data=None):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)

        file = api.create(ContentType.File, workspace, tmpl_context.folder, label)
        api.update_file_data(file, file_data.filename, file_data.type, file_data.file.read())
        api.save(file, ActionDescription.CREATION)

        tg.flash(_('File created'), CST.STATUS_OK)
        tg.redirect(tg.url('/workspaces/{}/folders/{}/files/{}').format(tmpl_context.workspace_id, tmpl_context.folder_id, file.content_id))


    @tg.require(current_user_is_contributor())
    @tg.expose()
    def put(self, item_id, file_data=None, comment=None, label=''):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        try:
            api = ContentApi(tmpl_context.current_user)
            item = api.get_one(int(item_id), self._item_type, workspace)
            if comment or label:
                api.update_content(item, label if label else item.label, comment if comment else '')
                action_description = ActionDescription.EDITION
                # The action_description is overwritten by ActionDescription.REVISION if the file content is also updated

            if isinstance(file_data, FieldStorage):
                api.update_file_data(item, file_data.filename, file_data.type, file_data.file.read())
                action_description = ActionDescription.REVISION

            api.save(item, action_description)

            msg = _('{} updated').format(self._item_type_label)
            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(self._std_url.format(tmpl_context.workspace_id, tmpl_context.folder_id, item.content_id))

        except ValueError as e:
            msg = _('{} not updated - error: {}').format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(self._err_url.format(tmpl_context.workspace_id, tmpl_context.folder_id, item_id))



class UserWorkspaceFolderPageRestController(TIMWorkspaceContentRestController):
    """
    manage a path like this: /workspaces/1/folders/XXX/pages/4
    """

    @property
    def _std_url(self):
        return tg.url('/workspaces/{}/folders/{}/pages/{}')

    @property
    def _parent_url(self):
        return tg.url('/workspaces/{}/folders/{}')

    @property
    def _item_type(self):
        return ContentType.Page

    @property
    def _item_type_label(self):
        return _('Page')

    @property
    def _get_one_context(self) -> str:
        return CTX.PAGE

    @property
    def _get_all_context(self) -> str:
        return CTX.PAGES

    @property
    def _edit_template(self) -> str:
        return 'mako:tracim.templates.user_workspace_folder_page_edit'


    @tg.require(current_user_is_reader())
    @tg.expose('tracim.templates.user_workspace_folder_page_get_one')
    def get_one(self, page_id, revision_id=None):
        page_id = int(page_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace
        workspace_id = tmpl_context.workspace_id

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        content_api = ContentApi(user)
        if revision_id:
            page = content_api.get_one_from_revision(page_id, ContentType.Page, workspace, revision_id)
        else:
            page = content_api.get_one(page_id, ContentType.Page, workspace)

        fake_api_breadcrumb = self.get_breadcrumb(page_id)
        fake_api_content = DictLikeClass(breadcrumb=fake_api_breadcrumb, current_user=current_user_content)
        fake_api = Context(CTX.FOLDER).toDict(fake_api_content)

        dictified_page = Context(CTX.PAGE).toDict(page, 'page')
        return DictLikeClass(result = dictified_page, fake_api=fake_api)


    def get_all_fake(self, context_workspace: Workspace, context_folder: Content):
        """
        fake methods are used in other controllers in order to simulate a client/server api.
        the "client" controller method will include the result into its own fake_api object
        which will be available in the templates

        :param context_workspace: the workspace which would be taken from tmpl_context if we were in the normal behavior
        :return:
        """
        workspace = context_workspace
        content_api = ContentApi(tmpl_context.current_user)
        pages = content_api.get_all(context_folder.content_id, ContentType.Page, workspace)

        dictified_pages = Context(CTX.PAGES).toDict(pages)
        return DictLikeClass(result = dictified_pages)


    @tg.require(current_user_is_contributor())
    @tg.expose()
    def post(self, label='', content=''):
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)

        page = api.create(ContentType.Page, workspace, tmpl_context.folder, label)
        page.description = content
        api.save(page, ActionDescription.CREATION)

        tg.flash(_('Page created'), CST.STATUS_OK)
        tg.redirect(tg.url('/workspaces/{}/folders/{}/pages/{}').format(tmpl_context.workspace_id, tmpl_context.folder_id, page.content_id))



class UserWorkspaceFolderThreadRestController(TIMWorkspaceContentRestController):
    """
    manage a path like this: /workspaces/1/folders/XXX/pages/4
    """
    comments = UserWorkspaceFolderThreadCommentRestController()


    def _before(self, *args, **kw):
        TIMRestPathContextSetup.current_user()
        TIMRestPathContextSetup.current_workspace()
        TIMRestPathContextSetup.current_folder()


    @property
    def _std_url(self):
        return tg.url('/workspaces/{}/folders/{}/threads/{}')


    @property
    def _err_url(self):
        return self._std_url


    @property
    def _parent_url(self):
        return tg.url('/workspaces/{}/folders/{}')


    @property
    def _item_type(self):
        return ContentType.Thread


    @property
    def _item_type_label(self):
        return _('Thread')


    @property
    def _get_one_context(self) -> str:
        return CTX.THREAD


    @property
    def _get_all_context(self) -> str:
        return CTX.THREADS


    @property
    def _edit_template(self) -> str:
        return 'mako:tracim.templates.user_workspace_folder_thread_edit'


    @tg.require(current_user_is_contributor())
    @tg.expose()
    def post(self, label='', content=''):
        """
        Creates a new thread. Actually, on POST, the content will be included in a user comment instead of being the thread description
        :param label:
        :param content:
        :return:
        """
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)

        thread = api.create(ContentType.Thread, workspace, tmpl_context.folder, label)
        # FIXME - DO NOT DUPLCIATE FIRST MESSAGE thread.description = content
        api.save(thread, ActionDescription.CREATION)

        comment = api.create(ContentType.Comment, workspace, thread, label)
        comment.label = ''
        comment.description = content
        api.save(comment, ActionDescription.COMMENT)

        tg.flash(_('Thread created'), CST.STATUS_OK)
        tg.redirect(self._std_url.format(tmpl_context.workspace_id, tmpl_context.folder_id, thread.content_id))


    @tg.require(current_user_is_reader())
    @tg.expose('tracim.templates.user_workspace_folder_thread_get_one')
    def get_one(self, thread_id):
        thread_id = int(thread_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        content_api = ContentApi(user)
        thread = content_api.get_one(thread_id, ContentType.Thread, workspace)

        fake_api_breadcrumb = self.get_breadcrumb(thread_id)
        fake_api_content = DictLikeClass(breadcrumb=fake_api_breadcrumb, current_user=current_user_content)
        fake_api = Context(CTX.FOLDER).toDict(fake_api_content)

        dictified_thread = Context(CTX.THREAD).toDict(thread, 'thread')
        return DictLikeClass(result = dictified_thread, fake_api=fake_api)



class ItemLocationController(TIMWorkspaceContentRestController, BaseController):

    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def get_one(self, item_id):
        item_id = int(item_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        item = ContentApi(user).get_one(item_id, ContentType.Any, workspace)
        raise NotImplementedError
        return item


    @tg.require(current_user_is_content_manager())
    @tg.expose('tracim.templates.item_location_edit')
    def edit(self, item_id):
        """
        Show the edit form (do not really edit the data)

        :param item_id:
        :return:
        """
        current_user_content = Context(CTX.CURRENT_USER).toDict(tmpl_context.current_user)
        fake_api = Context(CTX.FOLDER).toDict(DictLikeClass(current_user=current_user_content))

        item_id = int(item_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        content_api = ContentApi(user)
        item = content_api.get_one(item_id, ContentType.Any, workspace)

        dictified_item = Context(CTX.DEFAULT).toDict(item, 'item')
        return DictLikeClass(result = dictified_item, fake_api=fake_api)






    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put(self, item_id, folder_id='0'):
        """
        :param item_id:
        :param folder_id: id of the folder, in the 'workspace_14__content_1586' style
        :return:
        """
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace
        item_id = int(item_id)
        new_workspace, new_parent = convert_id_into_instances(folder_id)

        api = ContentApi(tmpl_context.current_user)
        item = api.get_one(item_id, ContentType.Any, workspace)
        api.move(item, new_parent)
        next_url = self.parent_controller.url(item_id)
        if new_parent:
            tg.flash(_('Item moved to {}').format(new_parent.label), CST.STATUS_OK)
        else:
            tg.flash(_('Item moved to workspace root'))

        tg.redirect(next_url)



class UserWorkspaceFolderRestController(TIMRestControllerWithBreadcrumb):

    location = ItemLocationController()

    files = UserWorkspaceFolderFileRestController()
    pages = UserWorkspaceFolderPageRestController()
    threads = UserWorkspaceFolderThreadRestController()

    def _before(self, *args, **kw):
        TIMRestPathContextSetup.current_user()
        TIMRestPathContextSetup.current_workspace()


    @tg.require(current_user_is_content_manager())
    @tg.expose('tracim.templates.folder_edit')
    def edit(self, folder_id):
        """
        Show the edit form (do not really edit the data)

        :param item_id:
        :return:
        """

        folder_id = int(folder_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        content_api = ContentApi(user)
        folder = content_api.get_one(folder_id, ContentType.Folder, workspace)

        dictified_folder = Context(CTX.FOLDER).toDict(folder, 'folder')
        return DictLikeClass(result = dictified_folder)


    @tg.require(current_user_is_reader())
    @tg.expose('tracim.templates.user_workspace_folder_get_one')
    def get_one(self, folder_id):
        folder_id = int(folder_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace
        workspace_id = tmpl_context.workspace_id

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        content_api = ContentApi(user)
        folder = content_api.get_one(folder_id, ContentType.Folder, workspace)

        fake_api_breadcrumb = self.get_breadcrumb(folder_id)
        fake_api_subfolders = self.get_all_fake(workspace, folder.content_id).result
        fake_api_pages = self.pages.get_all_fake(workspace, folder).result
        fake_api_files = self.files.get_all_fake(workspace, folder).result
        fake_api_threads = self.threads.get_all_fake(workspace, folder).result

        fake_api_content = DictLikeClass(
            current_user = current_user_content,
            breadcrumb = fake_api_breadcrumb,
            current_folder_subfolders = fake_api_subfolders,
            current_folder_pages = fake_api_pages,
            current_folder_files = fake_api_files,
            current_folder_threads = fake_api_threads
        )
        fake_api = Context(CTX.FOLDER).toDict(fake_api_content)


        dictified_folder = Context(CTX.FOLDER).toDict(folder, 'folder')
        return DictLikeClass(result = dictified_folder, fake_api=fake_api)


    def get_all_fake(self, context_workspace: Workspace, parent_id=None):
        """
        fake methods are used in other controllers in order to simulate a client/server api.
        the "client" controller method will include the result into its own fake_api object
        which will be available in the templates

        :param context_workspace: the workspace which would be taken from tmpl_context if we were in the normal behavior
        :return:
        """
        workspace = context_workspace
        content_api = ContentApi(tmpl_context.current_user)
        parent_folder = content_api.get_one(parent_id, ContentType.Folder)
        folders = content_api.get_child_folders(parent_folder, workspace)

        folders = Context(CTX.FOLDERS).toDict(folders)
        return DictLikeClass(result = folders)


    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def post(self, label, parent_id=None, can_contain_folders=False, can_contain_threads=False, can_contain_files=False, can_contain_pages=False):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)

        redirect_url_tmpl = '/workspaces/{}/folders/{}'
        redirect_url = ''


        try:
            parent = None
            if parent_id:
                parent = api.get_one(int(parent_id), ContentType.Folder, workspace)
            folder = api.create(ContentType.Folder, workspace, parent, label)

            subcontent = dict(
                folder = True if can_contain_folders=='on' else False,
                thread = True if can_contain_threads=='on' else False,
                file = True if can_contain_files=='on' else False,
                page = True if can_contain_pages=='on' else False
            )
            api.set_allowed_content(folder, subcontent)
            api.save(folder)

            tg.flash(_('Folder created'), CST.STATUS_OK)
            redirect_url = redirect_url_tmpl.format(tmpl_context.workspace_id, folder.content_id)
        except Exception as e:
            logger.error(self, 'An unexpected exception has been catched. Look at the traceback below.')
            traceback.print_exc()

            tg.flash(_('Folder not created: {}').format(e.with_traceback()), CST.STATUS_ERROR)
            if parent_id:
                redirect_url = redirect_url_tmpl.format(tmpl_context.workspace_id, parent_id)
            else:
                redirect_url = '/workspaces/{}'.format(tmpl_context.workspace_id)

        ####
        #
        # INFO - D.A. - 2014-10-22 - Do not put redirect in a
        # try/except block as redirect is using exceptions!
        #
        tg.redirect(tg.url(redirect_url))


    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put(self, folder_id, label, can_contain_folders=False, can_contain_threads=False, can_contain_files=False, can_contain_pages=False):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)
        next_url = ''

        try:
            folder = api.get_one(int(folder_id), ContentType.Folder, workspace)
            subcontent = dict(
                folder = True if can_contain_folders=='on' else False,
                thread = True if can_contain_threads=='on' else False,
                file = True if can_contain_files=='on' else False,
                page = True if can_contain_pages=='on' else False
            )
            api.update_content(folder, label, folder.description)
            api.set_allowed_content(folder, subcontent)
            api.save(folder)

            tg.flash(_('Folder updated'), CST.STATUS_OK)

            next_url = self.url(folder.content_id)

        except Exception as e:
            tg.flash(_('Folder not updated: {}').format(str(e)), CST.STATUS_ERROR)
            next_url = self.url(int(folder_id))

        tg.redirect(next_url)

    @property
    def _std_url(self):
        return tg.url('/workspaces/{}/folders/{}')

    @property
    def _parent_url(self):
        return tg.url('/workspaces/{}')

    @property
    def _item_type_label(self):
        return _('Folder')

    @property
    def _item_type(self):
        return ContentType.Folder


    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put_archive(self, item_id):
        # TODO - CHECK RIGHTS
        item_id = int(item_id)
        content_api = ContentApi(tmpl_context.current_user)
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)

        try:
            next_url = self._parent_url.format(item.workspace_id, item.parent_id)
            undo_url = self._std_url.format(item.workspace_id, item.content_id)+'/put_archive_undo'
            msg = _('{} archived. <a class="alert-link" href="{}">Cancel action</a>').format(self._item_type_label, undo_url)

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
        content_api = ContentApi(tmpl_context.current_user, True, True) # Here we do not filter deleted items
        item = content_api.get_one(item_id, self._item_type, tmpl_context.workspace)
        try:
            next_url = self._std_url.format(item.workspace_id, item.content_id)
            msg = _('{} unarchived.').format(self._item_type_label)
            content_api.unarchive(item)
            content_api.save(item, ActionDescription.UNARCHIVING)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(next_url )

        except ValueError as e:
            msg = _('{} not un-archived: {}').format(self._item_type_label, str(e))
            next_url = self._std_url.format(item.workspace_id, item.content_id)
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
            undo_url = self._std_url.format(item.workspace_id, item.content_id)+'/put_delete_undo'
            msg = _('{} deleted. <a class="alert-link" href="{}">Cancel action</a>').format(self._item_type_label, undo_url)
            content_api.delete(item)
            content_api.save(item, ActionDescription.DELETION)

            tg.flash(msg, CST.STATUS_OK, no_escape=True)
            tg.redirect(next_url)

        except ValueError as e:
            back_url = self._std_url.format(item.workspace_id, item.content_id)
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
            next_url = self._std_url.format(item.workspace_id, item.content_id)
            msg = _('{} undeleted.').format(self._item_type_label)
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