# -*- coding: utf-8 -*-

__author__ = 'damien'

import tg
from tg import tmpl_context
from tg.i18n import ugettext as _

from pod.controllers import PodRestPathContextSetup
from pod.controllers import PodWorkspaceNodeRestController

from pod.lib import CST
from pod.lib.content import ContentApi
from pod.lib.workspace import WorkspaceApi

from pod.model.serializers import Context, CTX, DictLikeClass
from pod.model.data import BreadcrumbItem
from pod.model.data import NodeTreeItem
from pod.model.data import PBNode
from pod.model.data import PBNodeType
from pod.model.data import Workspace

from pod.controllers.user_workspace_folder_page import UserWorkspaceFolderPageRestController
from pod.controllers.user_workspace_folder_thread import UserWorkspaceFolderThreadRestController

class UserWorkspaceFolderRestController(PodWorkspaceNodeRestController):

    pages = UserWorkspaceFolderPageRestController()
    threads = UserWorkspaceFolderThreadRestController()

    def _before(self, *args, **kw):
        PodRestPathContextSetup.current_user()
        PodRestPathContextSetup.current_workspace()


    @tg.expose('pod.templates.user_workspace_folder_get_one')
    def get_one(self, folder_id):
        folder_id = int(folder_id)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace
        workspace_id = tmpl_context.workspace_id

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        content_api = ContentApi(user)
        folder = content_api.get_one(folder_id, PBNodeType.Folder, workspace)

        fake_api_breadcrumb = self.get_breadcrumb(folder_id)

        fake_api_subfolders = self.get_all_fake(workspace, folder.node_id).result
        fake_api_pages = self.pages.get_all_fake(workspace, folder).result
        fake_api_threads = self.threads.get_all_fake(workspace, folder).result

        fake_api_content = DictLikeClass(
            breadcrumb=fake_api_breadcrumb,
            current_folder_subfolders = fake_api_subfolders,
            current_folder_pages = fake_api_pages,
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
        parent_folder = content_api.get_one(parent_id, PBNodeType.Folder)
        folders = content_api.get_child_folders(parent_folder, workspace)

        folders = Context(CTX.FOLDERS).toDict(folders)
        return DictLikeClass(result = folders)

    @tg.expose()
    def post(self, label, parent_id=None, can_contain_folders=False, can_contain_threads=False, can_contain_files=False, can_contain_pages=False):
        # TODO - SECURE THIS
        workspace = tmpl_context.workspace

        api = ContentApi(tmpl_context.current_user)

        redirect_url_tmpl = '/dashboard/workspaces/{}/folders/{}'
        try:
            parent = None
            if parent_id:
                parent = api.get_one(int(parent_id), PBNodeType.Folder, workspace)
            folder = api.create(PBNodeType.Folder, workspace, parent, label)

            subcontent = dict(
                folders = True if can_contain_folders=='on' else False,
                threads = True if can_contain_threads=='on' else False,
                files = True if can_contain_files=='on' else False,
                pages = True if can_contain_pages=='on' else False
            )
            api.set_allowed_content(folder, subcontent)
            api.save(folder)

            tg.flash(_('Folder created'), 'info')
            tg.redirect(tg.url(redirect_url_tmpl.format(tmpl_context.workspace_id, folder.node_id)))
        except Exception as e:
            tg.flash(_('Folder not created: {}').format(e), 'error')
            if parent_id:
                tg.redirect(tg.url(redirect_url_tmpl.format(tmpl_context.workspace_id, parent_id)))
            else:
                tg.redirect(tg.url('/dashboard/workspaces/{}'.format(tmpl_context.workspace_id)))