# -*- coding: utf-8 -*-
from tracim.config.app_cfg import CFG

__author__ = 'damien'

import sys
import traceback

from cgi import FieldStorage
from depot.manager import DepotManager
from preview_generator.manager import PreviewManager
from sqlalchemy.orm.exc import NoResultFound
import tg
from tg import abort
from tg import tmpl_context
from tg import require
from tg import predicates
from tg.i18n import ugettext as _
from tg.predicates import not_anonymous

from tracim.controllers import TIMRestController
from tracim.controllers import StandardController
from tracim.controllers import TIMRestPathContextSetup
from tracim.controllers import TIMRestControllerWithBreadcrumb
from tracim.controllers import TIMWorkspaceContentRestController
from tracim.lib import CST
from tracim.lib.base import BaseController
from tracim.lib.base import logger
from tracim.lib.integrity import render_invalid_integrity_chosen_path
from tracim.lib.utils import SameValueError
from tracim.lib.utils import get_valid_header_file_name
from tracim.lib.utils import str_as_bool
from tracim.lib.content import ContentApi
from tracim.lib.helpers import convert_id_into_instances
from tracim.lib.predicates import current_user_is_reader
from tracim.lib.predicates import current_user_is_contributor
from tracim.lib.predicates import current_user_is_content_manager
from tracim.lib.predicates import require_current_user_is_owner
from tracim.model.serializers import Context
from tracim.model.serializers import CTX
from tracim.model.serializers import DictLikeClass
from tracim.model.data import ActionDescription
from tracim.model import new_revision
from tracim.model import DBSession
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import UserRoleInWorkspace
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
    def post(self, content: str = ''):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace
        thread = tmpl_context.thread

        api = ContentApi(tmpl_context.current_user)

        comment = api.create_comment(workspace, thread, content, True)
        next_str = '/workspaces/{}/folders/{}/threads/{}'
        next_url = tg.url(next_str).format(tmpl_context.workspace_id,
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
        item = content_api.get_one(item_id,
                                   self._item_type,
                                   tmpl_context.workspace)
        next_or_back = '/workspaces/{}/folders/{}/threads/{}'
        try:
            next_url = tg.url(next_or_back).format(tmpl_context.workspace_id,
                                                   tmpl_context.folder_id,
                                                   tmpl_context.thread_id)
            undo_str = '{}/comments/{}/put_delete_undo'
            undo_url = tg.url(undo_str).format(next_url,
                                               item_id)
            msg_str = ('{} deleted. '
                       '<a class="alert-link" href="{}">Cancel action</a>')
            msg = _(msg_str).format(self._item_type_label,
                                    undo_url)
            with new_revision(item):
                content_api.delete(item)
                content_api.save(item, ActionDescription.DELETION)

            tg.flash(msg, CST.STATUS_OK, no_escape=True)
            tg.redirect(next_url)

        except ValueError as e:
            back_url = tg.url(next_or_back).format(tmpl_context.workspace_id,
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
        # Here we do not filter deleted items
        content_api = ContentApi(tmpl_context.current_user, True, True)
        item = content_api.get_one(item_id,
                                   self._item_type,
                                   tmpl_context.workspace)
        next_or_back = '/workspaces/{}/folders/{}/threads/{}'
        try:
            next_url = tg.url(next_or_back).format(tmpl_context.workspace_id,
                                                   tmpl_context.folder_id,
                                                   tmpl_context.thread_id)
            msg = _('{} undeleted.').format(self._item_type_label)
            with new_revision(item):
                content_api.undelete(item)
                content_api.save(item, ActionDescription.UNDELETION)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(next_url)

        except ValueError as e:
            logger.debug(self, 'Exception: {}'.format(e.__str__))
            back_url = tg.url(next_or_back).format(tmpl_context.workspace_id,
                                                   tmpl_context.folder_id,
                                                   tmpl_context.thread_id)
            msg = _('{} not un-deleted: {}').format(self._item_type_label,
                                                    str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(back_url)


class UserWorkspaceFolderFileRestController(TIMWorkspaceContentRestController):
    """
    manage a path like this: /workspaces/1/folders/XXX/files/4
    """

    TEMPLATE_NEW = 'mako:tracim.templates.file.new'
    TEMPLATE_EDIT = 'mako:tracim.templates.file.edit'

    @property
    def _std_url(self):
        return tg.url('/workspaces/{}/folders/{}/files/{}')

    @property
    def _parent_url(self):
        return tg.url('/workspaces/{}/folders/{}')

    @property
    def _err_url(self):
        return tg.url('/dashboard/workspaces/{}/folders/{}/file/{}')

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

    @tg.require(current_user_is_reader())
    @tg.expose('tracim.templates.file.getone')
    def get_one(self, file_id, revision_id=None):
        file_id = int(file_id)
        cache_path = CFG.get_instance().PREVIEW_CACHE_DIR
        preview_manager = PreviewManager(cache_path, create_folder=True)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace
        current_user_content = Context(CTX.CURRENT_USER,
                                       current_user=user).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)
        content_api = ContentApi(user,
                                 show_archived=True,
                                 show_deleted=True)
        if revision_id:
            file = content_api.get_one_from_revision(file_id,
                                                     self._item_type,
                                                     workspace,
                                                     revision_id)
        else:
            file = content_api.get_one(file_id,
                                       self._item_type,
                                       workspace)
            revision_id = file.revision_id

        file_path = content_api.get_one_revision_filepath(revision_id)
        nb_page = preview_manager.get_nb_page(file_path=file_path)
        preview_urls = []
        for page in range(int(nb_page)):
            url_str = '/previews/{}/pages/{}?revision_id={}'
            url = url_str.format(file_id,
                                 page,
                                 revision_id)
            preview_urls.append(url)

        fake_api_breadcrumb = self.get_breadcrumb(file_id)
        fake_api_content = DictLikeClass(breadcrumb=fake_api_breadcrumb,
                                         current_user=current_user_content)
        fake_api = Context(CTX.FOLDER,
                           current_user=user).toDict(fake_api_content)
        dictified_file = Context(self._get_one_context,
                                 current_user=user).toDict(file, 'file')
        result = DictLikeClass(result=dictified_file,
                               fake_api=fake_api,
                               nb_page=nb_page,
                               url=preview_urls)
        return result

    @tg.require(current_user_is_reader())
    @tg.expose()
    def download(self, file_id, revision_id=None):
        file_id = int(file_id)
        revision_id = int(revision_id) if revision_id != 'latest' else None
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        content_api = ContentApi(user)
        revision_to_send = None
        if revision_id:
            item = content_api.get_one_from_revision(file_id,
                                                     self._item_type,
                                                     workspace,
                                                     revision_id)
        else:
            item = content_api.get_one(file_id,
                                       self._item_type,
                                       workspace)

        revision_to_send = None
        if item.revision_to_serialize <= 0:
            for revision in item.revisions:
                if not revision_to_send:
                    revision_to_send = revision

                if revision.revision_id > revision_to_send.revision_id:
                    revision_to_send = revision
        else:
            for revision in item.revisions:
                if revision.revision_id == item.revision_to_serialize:
                    revision_to_send = revision
                    break

        content_type = 'application/x-download'
        if revision_to_send.file_mimetype:
            content_type = str(revision_to_send.file_mimetype)
            tg.response.headers['Content-type'] = \
                str(revision_to_send.file_mimetype)

        tg.response.headers['Content-Type'] = content_type
        file_name = get_valid_header_file_name(revision_to_send.file_name)
        tg.response.headers['Content-Disposition'] = \
            str('attachment; filename="{}"'.format(file_name))
        return DepotManager.get().get(revision_to_send.depot_file)

    def get_all_fake(self,
                     context_workspace: Workspace,
                     context_folder: Content):
        """
        fake methods are used in other controllers in order to simulate a
        client/server api.  the "client" controller method will include the
        result into its own fake_api object which will be available in the
        templates

        :param context_workspace: the workspace which would be taken from
                                  tmpl_context if we were in the normal
                                  behavior
        :return:
        """
        workspace = context_workspace
        content_api = ContentApi(tmpl_context.current_user)
        files = content_api.get_all(context_folder.content_id,
                                    ContentType.File,
                                    workspace)

        dictified_files = Context(CTX.FILES).toDict(files)
        return DictLikeClass(result=dictified_files)

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def post(self, label='', file_data=None):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace
        folder = tmpl_context.folder

        api = ContentApi(tmpl_context.current_user)
        with DBSession.no_autoflush:
            file = api.create(ContentType.File, workspace, folder, label)
            api.update_file_data(file,
                                 file_data.filename,
                                 file_data.type,
                                 file_data.file.read())
            # Display error page to user if chosen label is in conflict
            if not self._path_validation.validate_new_content(file):
                return render_invalid_integrity_chosen_path(
                    file.get_label_as_file(),
                )
        api.save(file, ActionDescription.CREATION)

        tg.flash(_('File created'), CST.STATUS_OK)
        redirect = '/workspaces/{}/folders/{}/files/{}'
        tg.redirect(tg.url(redirect).format(tmpl_context.workspace_id,
                                            tmpl_context.folder_id,
                                            file.content_id))

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def put(self, item_id, file_data=None, comment=None, label=None):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        try:
            api = ContentApi(tmpl_context.current_user)
            item = api.get_one(int(item_id), self._item_type, workspace)
            label_changed = False
            if label is not None and label != item.label:
                label_changed = True

            if label is None:
                label = ''

            # TODO - D.A. - 2015-03-19
            # refactor this method in order to make code easier to understand

            with new_revision(item):

                if (comment and label) or (not comment and label_changed):
                    updated_item = api.update_content(
                        item, label if label else item.label,
                        comment if comment else ''
                    )

                    # Display error page to user if chosen label is in conflict
                    if not self._path_validation.validate_new_content(
                        updated_item,
                    ):
                        return render_invalid_integrity_chosen_path(
                            updated_item.get_label_as_file(),
                        )

                    api.save(updated_item, ActionDescription.EDITION)

                    # This case is the default "file title and description
                    # update" In this case the file itself is not revisionned

                else:
                    # So, now we may have a comment and/or a file revision
                    if comment and '' == label:
                        comment_item = api.create_comment(workspace,
                                                          item, comment,
                                                          do_save=False)

                        if not isinstance(file_data, FieldStorage):
                            api.save(comment_item, ActionDescription.COMMENT)
                        else:
                            # The notification is only sent
                            # if the file is NOT updated
                            #
                            # If the file is also updated,
                            # then a 'file revision' notification will be sent.
                            api.save(comment_item,
                                     ActionDescription.COMMENT,
                                     do_notify=False)

                    if isinstance(file_data, FieldStorage):
                        api.update_file_data(item,
                                             file_data.filename,
                                             file_data.type,
                                             file_data.file.read())

                        # Display error page to user if chosen label is in
                        # conflict
                        if not self._path_validation.validate_new_content(
                            item,
                        ):
                            return render_invalid_integrity_chosen_path(
                                item.get_label_as_file(),
                            )

                        api.save(item, ActionDescription.REVISION)

            msg = _('{} updated').format(self._item_type_label)
            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(self._std_url.format(tmpl_context.workspace_id,
                                             tmpl_context.folder_id,
                                             item.content_id))

        except ValueError as e:
            error = '{} not updated - error: {}'
            msg = _(error).format(self._item_type_label,
                                  str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(self._err_url.format(tmpl_context.workspace_id,
                                             tmpl_context.folder_id,
                                             item_id))


class UserWorkspaceFolderPageRestController(TIMWorkspaceContentRestController):
    """
    manage a path like this: /workspaces/1/folders/XXX/pages/4
    """

    TEMPLATE_NEW = 'mako:tracim.templates.page.new'
    TEMPLATE_EDIT = 'mako:tracim.templates.page.edit'

    @property
    def _std_url(self):
        return tg.url('/workspaces/{}/folders/{}/pages/{}')

    @property
    def _err_url(self):
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

    @tg.require(current_user_is_reader())
    @tg.expose('tracim.templates.page.getone')
    def get_one(self, page_id, revision_id=None):
        page_id = int(page_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        content_api = ContentApi(
            user,
            show_deleted=True,
            show_archived=True,
        )
        if revision_id:
            page = content_api.get_one_from_revision(page_id,
                                                     ContentType.Page,
                                                     workspace,
                                                     revision_id)
        else:
            page = content_api.get_one(page_id,
                                       ContentType.Page,
                                       workspace)

        fake_api_breadcrumb = self.get_breadcrumb(page_id)
        fake_api_content = DictLikeClass(breadcrumb=fake_api_breadcrumb,
                                         current_user=current_user_content)
        fake_api = Context(CTX.FOLDER).toDict(fake_api_content)

        dictified_page = Context(CTX.PAGE).toDict(page, 'page')
        return DictLikeClass(result=dictified_page,
                             fake_api=fake_api)

    def get_all_fake(self,
                     context_workspace: Workspace,
                     context_folder: Content):
        """

        fake methods are used in other controllers in order to simulate a
        client/server api.  the "client" controller method will include the
        result into its own fake_api object which will be available in the
        templates

        :param context_workspace: the workspace which would be taken from
                                  tmpl_context if we were in the normal
                                  behavior
        :return:
        """
        workspace = context_workspace
        content_api = ContentApi(tmpl_context.current_user)
        pages = content_api.get_all(context_folder.content_id,
                                    ContentType.Page,
                                    workspace)

        dictified_pages = Context(CTX.PAGES).toDict(pages)
        return DictLikeClass(result=dictified_pages)

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def post(self, label='', content=''):
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)

        with DBSession.no_autoflush:
            page = api.create(ContentType.Page,
                              workspace,
                              tmpl_context.folder,
                              label)
            page.description = content

            if not self._path_validation.validate_new_content(page):
                return render_invalid_integrity_chosen_path(
                    page.get_label(),
                )

        api.save(page, ActionDescription.CREATION, do_notify=True)

        tg.flash(_('Page created'), CST.STATUS_OK)
        redirect = '/workspaces/{}/folders/{}/pages/{}'
        tg.redirect(tg.url(redirect).format(tmpl_context.workspace_id,
                                            tmpl_context.folder_id,
                                            page.content_id))

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def put(self, item_id, label='', content=''):
        # INFO - D.A. This method is a raw copy of
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        try:
            api = ContentApi(tmpl_context.current_user)
            item = api.get_one(int(item_id), self._item_type, workspace)
            with new_revision(item):
                api.update_content(item, label, content)

                if not self._path_validation.validate_new_content(item):
                    return render_invalid_integrity_chosen_path(
                        item.get_label(),
                    )

                api.save(item, ActionDescription.REVISION)

            msg = _('{} updated').format(self._item_type_label)
            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(self._std_url.format(tmpl_context.workspace_id,
                                             tmpl_context.folder_id,
                                             item.content_id))
        except SameValueError as e:
            not_updated = '{} not updated: the content did not change'
            msg = _(not_updated).format(self._item_type_label)
            tg.flash(msg, CST.STATUS_WARNING)
            tg.redirect(self._err_url.format(tmpl_context.workspace_id,
                                             tmpl_context.folder_id,
                                             item_id))
        except ValueError as e:
            not_updated = '{} not updated - error: {}'
            msg = _(not_updated).format(self._item_type_label, str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(self._err_url.format(tmpl_context.workspace_id,
                                             tmpl_context.folder_id,
                                             item_id))


class UserWorkspaceFolderThreadRestController(TIMWorkspaceContentRestController):
    """
    manage a path like this: /workspaces/1/folders/XXX/pages/4
    """

    TEMPLATE_NEW = 'mako:tracim.templates.thread.new'
    TEMPLATE_EDIT = 'mako:tracim.templates.thread.edit'

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

    @tg.require(current_user_is_contributor())
    @tg.expose()
    def post(self, label='', content='', parent_id=None):
        """
        Creates a new thread. Actually, on POST, the content will be included
        in a user comment instead of being the thread description
        :param label:
        :param content:
        :return:
        """
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)

        with DBSession.no_autoflush:
            thread = api.create(ContentType.Thread,
                                workspace,
                                tmpl_context.folder,
                                label)
            # FIXME - DO NOT DUPLCIATE FIRST MESSAGE
            # thread.description = content
            api.save(thread, ActionDescription.CREATION, do_notify=False)

            comment = api.create(ContentType.Comment, workspace, thread, label)
            comment.label = ''
            comment.description = content

            if not self._path_validation.validate_new_content(thread):
                return render_invalid_integrity_chosen_path(
                    thread.get_label(),
                )

        api.save(comment, ActionDescription.COMMENT, do_notify=False)
        api.do_notify(thread)

        tg.flash(_('Thread created'), CST.STATUS_OK)
        tg.redirect(self._std_url.format(tmpl_context.workspace_id,
                                         tmpl_context.folder_id,
                                         thread.content_id))

    @tg.require(current_user_is_reader())
    @tg.expose('tracim.templates.thread.getone')
    def get_one(self, thread_id, **kwargs):
        """
        :param thread_id: content_id of Thread
        :param inverted: fill with True equivalent to invert order of comments
                         NOTE: This parameter is in kwargs because prevent URL
                         changes.
        """
        inverted = kwargs.get('inverted')
        thread_id = int(thread_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        content_api = ContentApi(
            user,
            show_deleted=True,
            show_archived=True,
        )
        thread = content_api.get_one(thread_id, ContentType.Thread, workspace)

        fake_api_breadcrumb = self.get_breadcrumb(thread_id)
        fake_api_content = DictLikeClass(breadcrumb=fake_api_breadcrumb,
                                         current_user=current_user_content)
        fake_api = Context(CTX.FOLDER).toDict(fake_api_content)

        dictified_thread = Context(CTX.THREAD).toDict(thread, 'thread')

        if inverted:
            dictified_thread.thread.history = \
                reversed(dictified_thread.thread.history)

        return DictLikeClass(
            result=dictified_thread,
            fake_api=fake_api,
            inverted=inverted,
        )


class ItemLocationController(TIMWorkspaceContentRestController,
                             BaseController):

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
    @tg.expose('tracim.templates.folder.move')
    def edit(self, item_id):
        """
        Show the edit form (do not really edit the data)

        :param item_id:
        :return:
        """
        current_user_content = \
            Context(CTX.CURRENT_USER).toDict(tmpl_context.current_user)
        fake_api = \
            Context(CTX.FOLDER) \
            .toDict(DictLikeClass(current_user=current_user_content))

        item_id = int(item_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        content_api = ContentApi(user)
        item = content_api.get_one(item_id, ContentType.Any, workspace)

        dictified_item = Context(CTX.DEFAULT).toDict(item, 'item')
        return DictLikeClass(result=dictified_item, fake_api=fake_api)

    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put(self, item_id, folder_id='0'):
        """
        :param item_id:
        :param folder_id: id of the folder, in a style like
                          'workspace_14__content_1586'
        :return:
        """
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace
        item_id = int(item_id)
        new_workspace, new_parent = convert_id_into_instances(folder_id)

        if new_workspace != workspace:
            # check that user is at least
            # - content manager in current workspace
            # - content manager in new workspace
            user = tmpl_context.current_user

            if user.get_role(workspace) < UserRoleInWorkspace.CONTENT_MANAGER:
                tg.flash(_('You are not allowed '
                           'to move this folder'), CST.STATUS_ERROR)
                tg.redirect(self.parent_controller.url(item_id))

            if user.get_role(new_workspace) < UserRoleInWorkspace.CONTENT_MANAGER:
                tg.flash(_('You are not allowed to move '
                           'this folder to this workspace'), CST.STATUS_ERROR)
                tg.redirect(self.parent_controller.url(item_id))

            api = ContentApi(tmpl_context.current_user)
            item = api.get_one(item_id, ContentType.Any, workspace)

            with new_revision(item):
                api.move_recursively(item, new_parent, new_workspace)

            next_url = tg.url('/workspaces/{}/folders/{}'.format(
                new_workspace.workspace_id, item_id))
            if new_parent:
                tg.flash(_('Item moved to {} (workspace {})').format(
                    new_parent.label,
                    new_workspace.label), CST.STATUS_OK)
            else:
                tg.flash(_('Item moved to workspace {}').format(
                    new_workspace.label))

            tg.redirect(next_url)

        else:
            # Default move inside same workspace
            api = ContentApi(tmpl_context.current_user)
            item = api.get_one(item_id, ContentType.Any, workspace)
            with new_revision(item):
                api.move(item, new_parent)
            next_url = self.parent_controller.url(item_id)
            if new_parent:
                tg.flash(_('Item moved to {}').format(new_parent.label),
                         CST.STATUS_OK)
            else:
                tg.flash(_('Item moved to workspace root'))

            tg.redirect(next_url)


class UserWorkspaceFolderRestController(TIMRestControllerWithBreadcrumb):

    TEMPLATE_NEW = 'mako:tracim.templates.folder.new'

    location = ItemLocationController()

    files = UserWorkspaceFolderFileRestController()
    pages = UserWorkspaceFolderPageRestController()
    threads = UserWorkspaceFolderThreadRestController()

    def _before(self, *args, **kw):
        TIMRestPathContextSetup.current_user()
        try:
            TIMRestPathContextSetup.current_workspace()
        except NoResultFound:
            abort(404)

    @tg.require(current_user_is_content_manager())
    @tg.expose('tracim.templates.folder.edit')
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
        return DictLikeClass(result=dictified_folder)

    @tg.require(current_user_is_reader())
    @tg.expose('tracim.templates.folder.getone')
    def get_one(self, folder_id, **kwargs):
        """
        :param folder_id: Displayed folder id
        :param kwargs:
          * show_deleted: bool: Display deleted contents or hide them if False
          * show_archived: bool: Display archived contents or hide them
            if False
        """
        show_deleted = str_as_bool(kwargs.get('show_deleted', ''))
        show_archived = str_as_bool(kwargs.get('show_archived', ''))
        folder_id = int(folder_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace

        current_user_content = Context(CTX.CURRENT_USER,
                                       current_user=user).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        content_api = ContentApi(
            user,
            show_deleted=show_deleted,
            show_archived=show_archived,
        )
        with content_api.show(show_deleted=True, show_archived=True):
            folder = content_api.get_one(
                folder_id,
                ContentType.Folder,
                workspace,
            )

        fake_api_breadcrumb = self.get_breadcrumb(folder_id)
        fake_api_subfolders = self.get_all_fake(workspace,
                                                folder.content_id).result
        fake_api_pages = self.pages.get_all_fake(workspace, folder).result
        fake_api_files = self.files.get_all_fake(workspace, folder).result
        fake_api_threads = self.threads.get_all_fake(workspace, folder).result

        fake_api_content = DictLikeClass(
            current_user=current_user_content,
            breadcrumb=fake_api_breadcrumb,
            current_folder_subfolders=fake_api_subfolders,
            current_folder_pages=fake_api_pages,
            current_folder_files=fake_api_files,
            current_folder_threads=fake_api_threads,
        )

        fake_api = Context(CTX.FOLDER).toDict(fake_api_content)

        sub_items = content_api.get_children(
            parent_id=folder.content_id,
            content_types=[
                ContentType.Folder,
                ContentType.File,
                ContentType.Page,
                ContentType.Thread,
            ],

        )
        fake_api.sub_items = Context(CTX.FOLDER_CONTENT_LIST).toDict(sub_items)

        fake_api.content_types = Context(CTX.DEFAULT).toDict(
            content_api.get_all_types()
        )

        dictified_folder = Context(CTX.FOLDER).toDict(folder, 'folder')
        return DictLikeClass(
            result=dictified_folder,
            fake_api=fake_api,
            show_deleted=show_deleted,
            show_archived=show_archived,
        )

    def get_all_fake(self, context_workspace: Workspace, parent_id=None):
        """
        fake methods are used in other controllers in order to simulate a
        client/server api.  the "client" controller method will include the
        result into its own fake_api object which will be available in the
        templates

        :param context_workspace: the workspace which would be taken from
                                  tmpl_context if we were in the normal
                                  behavior
        :return:
        """
        workspace = context_workspace
        content_api = ContentApi(tmpl_context.current_user)
        with content_api.show(show_deleted=True, show_archived=True):
            parent_folder = content_api.get_one(parent_id, ContentType.Folder)
        folders = content_api.get_child_folders(parent_folder, workspace)

        folders = Context(CTX.FOLDERS).toDict(folders)
        return DictLikeClass(result=folders)

    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def post(self,
             label,
             parent_id=None,
             can_contain_folders=False,
             can_contain_threads=False,
             can_contain_files=False,
             can_contain_pages=False):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)

        redirect_url_tmpl = '/workspaces/{}/folders/{}'
        redirect_url = ''

        try:
            parent = None
            if parent_id:
                parent = api.get_one(int(parent_id),
                                     ContentType.Folder,
                                     workspace)

            with DBSession.no_autoflush:
                folder = api.create(ContentType.Folder,
                                    workspace,
                                    parent,
                                    label)

                subcontent = dict(
                    folder=True if can_contain_folders == 'on' else False,
                    thread=True if can_contain_threads == 'on' else False,
                    file=True if can_contain_files == 'on' else False,
                    page=True if can_contain_pages == 'on' else False
                )
                api.set_allowed_content(folder, subcontent)

                if not self._path_validation.validate_new_content(folder):
                    return render_invalid_integrity_chosen_path(
                        folder.get_label(),
                    )

            api.save(folder)

            tg.flash(_('Folder created'), CST.STATUS_OK)
            redirect_url = redirect_url_tmpl.format(tmpl_context.workspace_id,
                                                    folder.content_id)
        except Exception as e:
            error_msg = 'An unexpected exception has been catched. ' \
                        'Look at the traceback below.'
            logger.error(self, error_msg)
            traceback.print_exc()

            tb = sys.exc_info()[2]
            tg.flash(_('Folder not created: {}').format(e.with_traceback(tb)),
                     CST.STATUS_ERROR)
            if parent_id:
                redirect_url = \
                    redirect_url_tmpl.format(tmpl_context.workspace_id,
                                             parent_id)
            else:
                redirect_url = \
                    '/workspaces/{}'.format(tmpl_context.workspace_id)

        ####
        #
        # INFO - D.A. - 2014-10-22 - Do not put redirect in a
        # try/except block as redirect is using exceptions!
        #
        tg.redirect(tg.url(redirect_url))

    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put(self,
            folder_id,
            label,
            can_contain_folders=False,
            can_contain_threads=False,
            can_contain_files=False,
            can_contain_pages=False):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)
        next_url = ''

        try:
            folder = api.get_one(int(folder_id), ContentType.Folder, workspace)
            subcontent = dict(
                folder=True if can_contain_folders == 'on' else False,
                thread=True if can_contain_threads == 'on' else False,
                file=True if can_contain_files == 'on' else False,
                page=True if can_contain_pages == 'on' else False
            )
            with new_revision(folder):
                if label != folder.label:
                    # TODO - D.A. - 2015-05-25
                    # Allow to set folder description
                    api.update_content(folder, label, folder.description)
                api.set_allowed_content(folder, subcontent)

                if not self._path_validation.validate_new_content(folder):
                    return render_invalid_integrity_chosen_path(
                        folder.get_label(),
                    )

                api.save(folder)

            tg.flash(_('Folder updated'), CST.STATUS_OK)

            next_url = self.url(folder.content_id)

        except Exception as e:
            tg.flash(_('Folder not updated: {}').format(str(e)),
                     CST.STATUS_ERROR)
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
        item = content_api.get_one(item_id,
                                   self._item_type,
                                   tmpl_context.workspace)
        try:
            next_url = self._parent_url.format(item.workspace_id,
                                               item.parent_id)
            tmp_url = self._std_url.format(item.workspace_id,
                                           item.content_id)
            undo_url = tmp_url + '/put_archive_undo'
            archived_msg = '{} archived. ' \
                           '<a class="alert-link" href="{}">Cancel action</a>'
            msg = _(archived_msg).format(self._item_type_label,
                                         undo_url)
            with new_revision(item):
                content_api.archive(item)
                content_api.save(item, ActionDescription.ARCHIVING)
            # TODO allow to come back
            tg.flash(msg, CST.STATUS_OK, no_escape=True)
            tg.redirect(next_url)
        except ValueError as e:
            next_url = self._std_url.format(item.workspace_id,
                                            item.parent_id,
                                            item.content_id)
            msg = _('{} not archived: {}').format(self._item_type_label,
                                                  str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(next_url)

    @tg.require(current_user_is_content_manager())
    @tg.expose()
    def put_archive_undo(self, item_id):
        # TODO - CHECK RIGHTS
        item_id = int(item_id)
        # Here we do not filter deleted items
        content_api = ContentApi(tmpl_context.current_user, True, True)
        item = content_api.get_one(item_id,
                                   self._item_type,
                                   tmpl_context.workspace)
        try:
            next_url = self._std_url.format(item.workspace_id, item.content_id)
            msg = _('{} unarchived.').format(self._item_type_label)
            with new_revision(item):
                content_api.unarchive(item)
                content_api.save(item, ActionDescription.UNARCHIVING)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(next_url)

        except ValueError as e:
            msg = _('{} not un-archived: {}').format(self._item_type_label,
                                                     str(e))
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
        item = content_api.get_one(item_id,
                                   self._item_type,
                                   tmpl_context.workspace)
        try:

            next_url = self._parent_url.format(item.workspace_id,
                                               item.parent_id)
            tmp_url = self._std_url.format(item.workspace_id,
                                           item.content_id)
            undo_url = tmp_url + '/put_delete_undo'
            deleted_msg = '{} deleted. ' \
                          '<a class="alert-link" href="{}">Cancel action</a>'
            msg = _(deleted_msg).format(self._item_type_label,
                                        undo_url)
            with new_revision(item):
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
        # Here we do not filter deleted items
        content_api = ContentApi(tmpl_context.current_user, True, True)
        item = content_api.get_one(item_id,
                                   self._item_type,
                                   tmpl_context.workspace)
        try:
            next_url = self._std_url.format(item.workspace_id, item.content_id)
            msg = _('{} undeleted.').format(self._item_type_label)
            with new_revision(item):
                content_api.undelete(item)
                content_api.save(item, ActionDescription.UNDELETION)

            tg.flash(msg, CST.STATUS_OK)
            tg.redirect(next_url)

        except ValueError as e:
            logger.debug(self, 'Exception: {}'.format(e.__str__))
            back_url = self._parent_url.format(item.workspace_id,
                                               item.parent_id)
            msg = _('{} not un-deleted: {}').format(self._item_type_label,
                                                    str(e))
            tg.flash(msg, CST.STATUS_ERROR)
            tg.redirect(back_url)


class ContentController(StandardController):
    """
    Class of controllers used for example in home to mark read the unread
    contents via mark_all_read()
    """

    @classmethod
    def current_item_id_key_in_context(cls) -> str:
        return''

    @tg.expose()
    def index(self):
        return dict()

    @require(predicates.not_anonymous())
    @tg.expose()
    def mark_all_read(self):
        '''
        Mark as read all the content that hasn't been read
        redirects the user to "/home"
        '''
        user = tg.tmpl_context.current_user
        content_api = ContentApi(user)
        content_api.mark_read__all()

        tg.redirect("/home")
