# coding: utf8
from abc import ABC
from abc import abstractmethod
import functools
import io
import logging
import os
from os.path import basename
from os.path import dirname
import re
import sys
from time import mktime
import traceback
import transaction
import typing
from typing import List
from wsgidav.dav_error import DAVError
from wsgidav.dav_error import HTTP_FORBIDDEN
from wsgidav.dav_error import HTTP_REQUEST_ENTITY_TOO_LARGE
from wsgidav.dav_provider import DAVCollection
from wsgidav.dav_provider import DAVNonCollection
from wsgidav.dav_provider import _DAVResource

from tracim_backend.app_models.contents import ContentTypeSlug
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import FileSizeOverMaxLimitation
from tracim_backend.exceptions import FileSizeOverOwnerEmptySpace
from tracim_backend.exceptions import FileSizeOverWorkspaceEmptySpace
from tracim_backend.exceptions import TracimException
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import AuthorizationChecker
from tracim_backend.lib.utils.authorization import can_delete_workspace
from tracim_backend.lib.utils.authorization import can_move_content
from tracim_backend.lib.utils.authorization import is_content_manager
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.authorization import is_trusted_user
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.utils import add_trailing_slash
from tracim_backend.lib.utils.utils import normpath
from tracim_backend.lib.utils.utils import webdav_convert_file_name_to_bdd
from tracim_backend.lib.utils.utils import webdav_convert_file_name_to_display
from tracim_backend.lib.webdav.design import design_page
from tracim_backend.lib.webdav.design import design_thread
from tracim_backend.lib.webdav.utils import FakeFileStream
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision

logger = logging.getLogger()

if typing.TYPE_CHECKING:
    from tracim_backend.lib.webdav.dav_provider import TracimDavProvider
    from tracim_backend.lib.webdav.dav_provider import WebdavTracimContext


def webdav_check_right(authorization_checker: AuthorizationChecker):
    def decorator(func: typing.Callable) -> typing.Callable:
        @functools.wraps(func)
        def wrapper(self: "_DAVResource", *arg, **kwarg) -> typing.Callable:
            try:
                authorization_checker.check(tracim_context=self.tracim_context)
            except TracimException as exc:
                raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc
            return func(self, *arg, **kwarg)

        return wrapper

    return decorator


def get_workspace_resource(
    path: str,
    environ: typing.Dict,
    workspace: Workspace,
    label: str,
    tracim_context: "WebdavTracimContext",
) -> "WorkspaceResource":
    return WorkspaceResource(
        path=path,
        environ=environ,
        workspace=workspace,
        tracim_context=tracim_context,
        label=label,
    )


def get_content_resource(
    content: Content,
    path: str,
    environ: typing.Dict,
    workspace: Workspace,
    tracim_context: "WebdavTracimContext",
) -> _DAVResource:
    """
    Helper to get the correct content WebDAV resource according to the content type
    """
    if content.type == content_type_list.Folder.slug:
        return FolderResource(
            path=path,
            environ=environ,
            workspace=workspace,
            content=content,
            tracim_context=tracim_context,
        )
    elif content.depot_file:
        return FileResource(
            path=path,
            environ=environ,
            content=content,
            tracim_context=tracim_context,
        )
    else:
        # Content is assumed to be in raw_content
        return OtherFileResource(
            path=path, environ=environ, content=content, tracim_context=tracim_context
        )


class WebdavContainer(ABC):
    """
    A Webdav Container should implement these methods.
    """

    @abstractmethod
    def create_empty_resource(self, name: str):
        """Create a empty non-collection sub-resource of the current resource, for example a file on a directory"""
        pass

    @abstractmethod
    def create_collection(self, name: str) -> "FolderResource":
        """Create a collection sub-resource of the current resource, for example a dir on a directory or workspace"""
        pass

    @abstractmethod
    def get_member_names(self) -> typing.List[str]:
        """Get the list of subresources of the current resource"""
        pass

    @abstractmethod
    def get_member(self, name: str) -> _DAVResource:
        """Get one member name subresource according to label (same as filename)"""
        pass

    @abstractmethod
    def get_member_list(self) -> typing.List[_DAVResource]:
        """Get list of all sub-resources of the current resource"""
        pass


class WorkspaceOnlyContainer(WebdavContainer):
    """
    Container that can get children workspace
    """

    def __init__(
        self,
        path: str,
        environ: dict,
        label: str,
        workspace: typing.Optional[Workspace],
        provider: "TracimDavProvider",
        tracim_context: "WebdavTracimContext",
        list_orphan_workspaces: bool = False,
    ) -> None:
        """
        Some rules:
        - if workspace given is None, return workspaces with no parent
        - if workspace given is correct, return children workspaces of this workspace
        - if list_orphan_workspaces is True, it
         adds user-known workspaces without any user-known parent to the list.
         - in case of workspace collision, only the first named workspace (sorted by workspace_id
         from lower to higher) will be returned
        """
        self.path = path
        self.environ = environ
        self.workspace = workspace
        self.tracim_context = tracim_context
        self.user = tracim_context.current_user
        self.session = tracim_context.dbsession
        self.label = label
        self.provider = provider
        self.workspace_api = WorkspaceApi(
            current_user=self.user,
            session=self.session,
            force_role=True,
            config=tracim_context.app_config,
        )
        self.list_orphan_workspaces = list_orphan_workspaces

    # Internal methods
    def _get_members(
        self, already_existing_names: typing.Optional[typing.List[str]] = None
    ) -> typing.List[Workspace]:
        members_names = already_existing_names or []  # type: List[str]
        members = []
        workspace_id = self.workspace.workspace_id if self.workspace else 0  # type: int
        workspace_children = list(self.workspace_api.get_all_children([workspace_id]))
        if self.list_orphan_workspaces:
            workspace_children.extend(self.workspace_api.get_user_orphan_workspaces(self.user))
        for workspace in workspace_children:
            workspace_label = workspace.filemanager_filename
            if workspace_label in members_names:
                # INFO - G.M - 2020-09-24
                # We decide to show only first same name workspace (in order of get_all() which is workspace
                # id order). So, same name workspace are not supported from webdav but doesn't cause
                # much trouble: only one workspace is accessible without any issue.
                continue
            else:
                members_names.append(workspace_label)
                members.append(workspace)
        return members

    def _generate_child_workspace_resource(
        self, parent_path: str, child_workspace: Workspace
    ) -> "WorkspaceResource":
        workspace_label = webdav_convert_file_name_to_display(child_workspace.filemanager_filename)
        path = add_trailing_slash(parent_path)
        workspace_path = "{}{}".format(path, workspace_label)
        return get_workspace_resource(
            path=workspace_path,
            environ=self.environ,
            workspace=child_workspace,
            tracim_context=self.tracim_context,
            label=workspace_label,
        )

    # Container methods
    def create_empty_resource(self, name: str):
        raise NotImplementedError()

    def create_collection(self, name: str) -> "FolderResource":
        raise NotImplementedError()

    def get_member_names(self) -> List[str]:
        """
        This method returns the names (here workspace's labels) of all its children
        """
        # INFO - G.M - 2020-14-10 - Unclear if this method is really used by wsgidav
        members_names = []  # type: List[str]
        for workspace in self._get_members():
            members_names.append(
                webdav_convert_file_name_to_display(workspace.filemanager_filename)
            )
        return members_names

    def get_member(self, name: str) -> typing.Optional[_DAVResource]:
        """
        Access to a specific members
        """
        return self.provider.get_resource_inst(
            "%s/%s" % (self.path, webdav_convert_file_name_to_display(name)),
            self.environ,
        )

    def get_member_list(self):
        """
        This method is called by wsgidav when requesting with a depth > 0, it will return a list of _DAVResource
        of all its direct children
        """
        members = []
        for workspace in self._get_members():
            members.append(
                self._generate_child_workspace_resource(
                    parent_path=self.path, child_workspace=workspace
                )
            )
        return members


class ContentOnlyContainer(WebdavContainer):
    """
    Container that can get children content
    """

    def __init__(
        self,
        path: str,
        environ: dict,
        label: str,
        content: Content,
        provider: "TracimDavProvider",
        workspace: Workspace,
        tracim_context: "WebdavTracimContext",
    ) -> None:
        """
        Some rules:
        - if content given is None, return workspace root contents
        - if the given content is correct, return the subcontent of this content
         and user-known workspaces without any user-known parent to the list.
         - in case of content collision, only the first named content (sorted by content_id
         from lower to higher) will be returned.
        """
        self.path = path
        self.environ = environ
        self.workspace = workspace
        self.content = content
        self.tracim_context = tracim_context
        self.user = tracim_context.current_user
        self.session = tracim_context.dbsession
        self.label = label
        self.provider = provider
        self.content_api = ContentApi(
            current_user=self.user,
            session=tracim_context.dbsession,
            config=tracim_context.app_config,
            show_temporary=True,
            namespaces_filter=[ContentNamespaces.CONTENT],
        )

    # Internal methods
    def _get_members(
        self, already_existing_names: typing.Optional[typing.List[str]] = None
    ) -> typing.List[Content]:
        members_names = []
        members = []
        if self.content:
            parent_id = self.content.content_id
            children = self.content_api.get_all(
                content_type=ContentTypeSlug.ANY.value,
                workspaces=[self.workspace],
                parent_ids=[parent_id],
                order_by_properties=["content_id"],
            )
        else:
            children = self.content_api.get_all(
                content_type=ContentTypeSlug.ANY.value,
                workspaces=[self.workspace],
                parent_ids=[0],
                order_by_properties=["content_id"],
            )
        for child in children:
            if child.file_name in members_names:
                continue
            else:
                members_names.append(child.file_name)
                members.append(child)
        return members

    def _generate_child_content_resource(
        self, parent_path: str, child_content: Content
    ) -> _DAVResource:
        content_path = "%s/%s" % (
            self.path,
            webdav_convert_file_name_to_display(child_content.file_name),
        )
        return get_content_resource(
            path=content_path,
            environ=self.environ,
            workspace=self.workspace,
            content=child_content,
            tracim_context=self.tracim_context,
        )

    # Container methods
    def create_empty_resource(self, name: str):
        """
        Create a new file on the current workspace/folder.
        """
        content = None
        fixed_file_name = webdav_convert_file_name_to_display(name)
        path = os.path.join(self.path, name)
        resource = self.provider.get_resource_inst(path, self.environ)  # FIXME HERE
        if resource:
            content = resource.content
        try:
            self.content_api.check_upload_size(int(self.environ["CONTENT_LENGTH"]), self.workspace)
        except (
            FileSizeOverMaxLimitation,
            FileSizeOverWorkspaceEmptySpace,
            FileSizeOverOwnerEmptySpace,
        ) as exc:
            raise DAVError(HTTP_REQUEST_ENTITY_TOO_LARGE, contextinfo=str(exc))
        # return item
        return FakeFileStream(
            session=self.session,
            file_name=fixed_file_name,
            content_api=self.content_api,
            workspace=self.workspace,
            content=content,
            parent=self.content,
            path=self.path + "/" + fixed_file_name,
        )

    def create_collection(self, name: str) -> "FolderResource":
        """
        Create a new folder for the current workspace/folder. As it's not possible for the user to choose
        which types of content are allowed in this folder, we allow allow all of them.

        This method return the DAVCollection created.
        """
        folder_label = webdav_convert_file_name_to_bdd(name)
        try:
            folder = self.content_api.create(
                content_type_slug=content_type_list.Folder.slug,
                workspace=self.workspace,
                label=folder_label,
                parent=self.content,
            )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc

        self.content_api.save(folder)

        transaction.commit()
        # fixed_path
        folder_path = "%s/%s" % (self.path, webdav_convert_file_name_to_display(name))
        # return item
        return FolderResource(
            folder_path,
            self.environ,
            content=folder,
            tracim_context=self.tracim_context,
            workspace=self.workspace,
        )

    def get_member_names(self) -> typing.List[str]:
        """
        Access to the list of content names for current workspace/folder
        """
        # INFO - G.M - 2020-14-10 - Unclear if this method is really used by wsgidav
        retlist = []
        for content in self._get_members():
            retlist.append(webdav_convert_file_name_to_display(content.file_name))
        return retlist

    def get_member(self, name: str) -> _DAVResource:
        """
        Access to a specific members
        """
        return self.provider.get_resource_inst(
            "%s/%s" % (self.path, webdav_convert_file_name_to_display(name)),
            self.environ,
        )

    def get_member_list(self) -> typing.List[_DAVResource]:
        """
        Access to the list of content of current workspace/folder
        """
        members = []
        for content in self._get_members():
            members.append(
                self._generate_child_content_resource(parent_path=self.path, child_content=content)
            )
        return members


class WorkspaceAndContentContainer(WebdavContainer):
    def __init__(
        self,
        path: str,
        environ: dict,
        label: str,
        content: typing.Optional[Content],
        workspace: typing.Optional[Workspace],
        provider: "TracimDavProvider",
        tracim_context: "WebdavTracimContext",
    ) -> None:
        """
        Some rules:
        - combined rules of both WorkspaceOnlyContainer and ContentOnlyContainer
        - in case of content and workspace collision, workspaces have the priority
        """
        self.path = path
        self.environ = environ
        self.workspace = workspace
        self.tracim_context = tracim_context
        self.user = tracim_context.current_user
        self.session = tracim_context.dbsession
        self.provider = provider
        self.label = label
        self.provider = provider
        self.content_container = ContentOnlyContainer(
            path,
            environ,
            content=content,
            label=workspace.filemanager_filename,
            workspace=workspace,
            tracim_context=tracim_context,
            provider=self.provider,
        )
        self.workspace_container = WorkspaceOnlyContainer(
            path,
            environ,
            label=self.label,
            workspace=self.workspace,
            tracim_context=tracim_context,
            provider=self.provider,
        )

    def create_empty_resource(self, name: str):
        return self.content_container.create_empty_resource(name)

    def create_collection(self, name: str) -> "FolderResource":
        return self.content_container.create_collection(name=name)

    def get_member_names(self) -> typing.List[str]:
        # INFO - G.M - 2020-14-10 - Unclear if this method is really used by wsgidav
        workspace_names = self.workspace_container.get_member_names()
        content_names = self.content_container.get_member_names()
        members_names = list(workspace_names)
        for name in content_names:
            if name in workspace_names:
                continue
            else:
                members_names.append(name)
        return members_names

    def get_member(self, label: str) -> _DAVResource:
        member = self.workspace_container.get_member(label=label)
        if not member:
            member = self.content_container.get_member(label=label)

    def get_member_list(self) -> typing.List[_DAVResource]:
        workspace_names = self.workspace_container.get_member_names()
        workspaces = self.workspace_container.get_member_list()
        content_resources = self.content_container.get_member_list()
        members = list(workspaces)
        for content_resource in content_resources:
            if content_resource.content.file_name in workspace_names:
                continue
            else:
                members.append(content_resource)
        return members


class RootResource(DAVCollection):
    """
    RootResource resource that represents Tracim's home, which contains all workspaces without
    any parents or user's orphan workspaces
    Direct children can only be workspaces.
    """

    def __init__(self, path: str, environ: dict, tracim_context: "WebdavTracimContext"):
        DAVCollection.__init__(self, path, environ)
        self.workspace_container = WorkspaceOnlyContainer(
            path,
            environ,
            label="",
            workspace=None,
            tracim_context=tracim_context,
            provider=self.provider,
            list_orphan_workspaces=True,
        )
        self.tracim_context = tracim_context

    def __repr__(self) -> str:
        return "<DAVCollection: RootResource>"

    @webdav_check_right(is_user)
    def get_member_names(self) -> List[str]:
        return self.workspace_container.get_member_names()

    @webdav_check_right(is_user)
    def get_member(self, name) -> typing.Optional[DAVCollection]:
        return self.workspace_container.get_member(name=name)

    @webdav_check_right(is_user)
    def get_member_list(self):
        return self.workspace_container.get_member_list()

    @webdav_check_right(is_trusted_user)
    def create_empty_resource(self, name: str):
        """
        This method is called whenever the user wants to create a DAVNonCollection resource (files in our case).

        There we don't allow to create files at the root;
        """
        raise DAVError(HTTP_FORBIDDEN, contextinfo="Not allowed to create new root")

    @webdav_check_right(is_trusted_user)
    def create_collection(self, name: str):
        """
        This method is called whenever the user wants to create a DAVCollection resource as a child (in our case,
        we create workspaces as this is the root).

        We don't allow to create new workspaces through
        webdav client.
        """
        raise DAVError(HTTP_FORBIDDEN, contextinfo="Not allowed to create item in the root dir")


class WorkspaceResource(DAVCollection):
    """
    Workspace resource corresponding to tracim's workspaces.
    Direct children can be:
    - workspace
    - folder
    - any other type of content
    """

    def __init__(
        self,
        label: str,
        path: str,
        environ: dict,
        workspace: Workspace,
        tracim_context: "WebdavTracimContext",
    ) -> None:
        DAVCollection.__init__(self, path, environ)
        self.workspace = workspace
        self.label = label
        self.tracim_context = tracim_context
        self.container = WorkspaceAndContentContainer(
            path=path,
            environ=environ,
            label=label,
            workspace=workspace,
            tracim_context=tracim_context,
            provider=self.provider,
            content=None,
        )

    def __repr__(self) -> str:
        return "<DAVCollection: Workspace (%d)>" % self.workspace.workspace_id

    def get_creation_date(self) -> float:
        return mktime(self.workspace.created.timetuple())

    def get_display_name(self) -> str:
        return webdav_convert_file_name_to_display(self.label)

    def get_display_info(self):
        return {"type": "workspace".capitalize()}

    def get_last_modified(self) -> float:
        return mktime(self.workspace.updated.timetuple())

    def delete(self):
        """For now, it is not possible to delete a workspace through the webdav client."""
        # FIXME - G.M - 2018-12-11 - For an unknown reason current_workspace
        # of tracim_context is here invalid.
        self.tracim_context._current_workspace = self.workspace
        try:
            can_delete_workspace.check(self.tracim_context)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc))
        raise DAVError(HTTP_FORBIDDEN, "Workspace deletion is not allowed through webdav")

    def support_recursive_move(self, dest_path):
        return True

    def move_recursive(self, dest_path: str):
        raise DAVError(
            HTTP_FORBIDDEN,
            contextinfo="Not allowed to rename or move workspace through webdav",
        )

    def get_member_names(self) -> typing.List[str]:
        return self.container.get_member_names()

    def get_member(self, label: str) -> _DAVResource:
        return self.container.get_member(label=label)

    def get_member_list(self) -> typing.List[_DAVResource]:
        return self.container.get_member_list()

    @webdav_check_right(is_contributor)
    def create_empty_resource(self, name: str):
        return self.container.create_empty_resource(name=name)

    @webdav_check_right(is_content_manager)
    def create_collection(self, name: str):
        return self.container.create_collection(name=name)


class FolderResource(DAVCollection):
    """
    FolderResource resource corresponding to tracim's folders.
    Direct children can only be content (folder, html-document, file, etc...)
    By default when creating new folders, we allow them to contain all types of content
    """

    def __init__(
        self,
        path: str,
        environ: dict,
        workspace: Workspace,
        content: Content,
        tracim_context: "WebdavTracimContext",
    ):
        DAVCollection.__init__(self, path, environ)
        self.content_container = ContentOnlyContainer(
            path,
            environ,
            provider=self.provider,
            content=content,
            label=workspace.filemanager_filename,
            workspace=workspace,
            tracim_context=tracim_context,
        )
        self.tracim_context = tracim_context
        self.content_api = ContentApi(
            current_user=tracim_context.current_user,
            session=tracim_context.dbsession,
            config=tracim_context.app_config,
            show_temporary=True,
            namespaces_filter=[ContentNamespaces.CONTENT],
        )
        self.content = content
        self.session = tracim_context.dbsession

    def __repr__(self) -> str:
        return "<DAVCollection: Folder (%s)>" % self.content.label

    @webdav_check_right(is_reader)
    def get_creation_date(self) -> float:
        return mktime(self.content.created.timetuple())

    @webdav_check_right(is_reader)
    def get_display_name(self) -> str:
        return webdav_convert_file_name_to_display(self.content.file_name)

    @webdav_check_right(is_reader)
    def get_display_info(self):
        return {"type": self.content.type.capitalize()}

    def get_last_modified(self) -> float:
        return mktime(self.content.updated.timetuple())

    @webdav_check_right(is_content_manager)
    def delete(self):
        try:
            with new_revision(session=self.session, tm=transaction.manager, content=self.content):
                self.content_api.delete(self.content)
                self.content_api.save(self.content)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc
        transaction.commit()

    def support_recursive_move(self, dest_path: str):
        return True

    def move_recursive(self, dest_path: str):
        """
        As we support recursive move, copy_move_single won't be called, though with copy it'll be called
        but i have to check if the client ever call that function...
        """
        dest_path = normpath(dest_path)
        self.tracim_context.set_destpath(dest_path)
        if normpath(dirname(dest_path)) == normpath(dirname(self.path)):
            # INFO - G.M - 2018-12-12 - renaming case
            checker = is_contributor
        else:
            # INFO - G.M - 2018-12-12 - move case
            checker = can_move_content

        try:
            checker.check(self.tracim_context)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc))

        # we check if the path is good (not at the root path /)
        # and we move the content
        invalid_path = dirname(dest_path) == self.environ["wsgidav.auth.realm"]

        if not invalid_path:
            self.move_folder(dest_path)

        if invalid_path:
            raise DAVError(HTTP_FORBIDDEN)

    def move_folder(self, dest_path: str):
        dest_path = normpath(dest_path)
        self.tracim_context.set_destpath(dest_path)
        if normpath(dirname(dest_path)) == normpath(dirname(self.path)):
            # INFO - G.M - 2018-12-12 - renaming case
            checker = is_contributor
        else:
            # INFO - G.M - 2018-12-12 - move case
            checker = can_move_content

        try:
            checker.check(self.tracim_context)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc))

        destination_workspace = self.tracim_context.candidate_workspace
        try:
            destination_parent = self.tracim_context.candidate_parent_content
        except ContentNotFound:
            destination_parent = None
        try:
            with new_revision(content=self.content, tm=transaction.manager, session=self.session):
                # renaming file if needed
                if basename(dest_path) != self.get_display_name():
                    self.content_api.update_content(
                        self.content,
                        webdav_convert_file_name_to_bdd(basename(dest_path)),
                        force_update=True,
                    )
                    self.content_api.save(self.content)
                # move file if needed
                if (
                    destination_workspace != self.content.workspace
                    or destination_parent != self.content.parent
                ):
                    self.content_api.move(
                        self.content,
                        new_parent=destination_parent,
                        new_workspace=destination_workspace,
                        must_stay_in_same_workspace=False,
                    )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc

        transaction.commit()

    @webdav_check_right(is_contributor)
    def create_empty_resource(self, name: str):
        return self.content_container.create_empty_resource(name)

    @webdav_check_right(is_content_manager)
    def create_collection(self, name: str) -> "FolderResource":
        return self.content_container.create_collection(name)

    def get_member_names(self) -> typing.List[str]:
        return self.content_container.get_member_names()

    def get_member(self, name: str) -> _DAVResource:
        return self.content_container.get_member(name)

    def get_member_list(self) -> typing.List[_DAVResource]:
        return self.content_container.get_member_list()

    def handle_copy(self, dest_path, *, depth_infinity):
        # CHECK IF FORCE OVERWRITE is 'T' -> in this case we should overwrite files (which is not trivial in tracim)
        # if self.environ['']
        destpath = normpath(dest_path)
        self.tracim_context.set_destpath(destpath)
        content_in_context = self.content_api.get_content_in_context(self.content)
        try:
            self.content_api.check_upload_size(content_in_context.size or 0, self.content.workspace)
        except (
            FileSizeOverMaxLimitation,
            FileSizeOverWorkspaceEmptySpace,
            FileSizeOverOwnerEmptySpace,
        ) as exc:
            raise DAVError(HTTP_REQUEST_ENTITY_TOO_LARGE, contextinfo=str(exc))
        new_filename = webdav_convert_file_name_to_bdd(basename(destpath))
        regex_file_extension = re.compile(
            "(?P<label>.*){}".format(re.escape(self.content.file_extension))
        )
        same_extension = regex_file_extension.match(new_filename)
        if same_extension:
            new_label = same_extension.group("label")
            new_file_extension = self.content.file_extension
        else:
            new_label, new_file_extension = os.path.splitext(new_filename)

        self.tracim_context.set_destpath(destpath)
        destination_workspace = self.tracim_context.candidate_workspace
        try:
            destination_parent = self.tracim_context.candidate_parent_content
        except ContentNotFound:
            destination_parent = None
        try:
            # // OVERRIDE ?
            force_overwrite = False
            if self.environ["HTTP_OVERWRITE"] and self.environ["HTTP_OVERWRITE"] == "T":
                force_overwrite = True

            self.content_api.copy(
                item=self.content,
                context=self.tracim_context,
                new_parent=destination_parent,
                new_label=new_label,
                new_workspace=destination_workspace,
                new_file_extension=new_file_extension,
                allow_overwrite=force_overwrite,
            )
        except TracimException as exc:
            print(exc)
            traceback.print_exc(sys.stdout)
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc
        except Exception as e:
            print(e)
            traceback.print_exc(sys.stdout)
            raise e

        transaction.commit()
        return True

    def copy_move_single(self, dest_path, *, is_move):
        if is_move:
            return self.move_folder(dest_path)

        destpath = normpath(dest_path)
        self.tracim_context.set_destpath(destpath)
        # try:
        #    can_move_content.check(self.tracim_context)
        # except TracimException as exc:
        #    raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc))

        content_in_context = self.content_api.get_content_in_context(self.content)
        try:
            self.content_api.check_upload_size(content_in_context.size or 0, self.content.workspace)
        except (
            FileSizeOverMaxLimitation,
            FileSizeOverWorkspaceEmptySpace,
            FileSizeOverOwnerEmptySpace,
        ) as exc:
            raise DAVError(HTTP_REQUEST_ENTITY_TOO_LARGE, contextinfo=str(exc))
        new_filename = webdav_convert_file_name_to_bdd(basename(destpath))
        regex_file_extension = re.compile(
            "(?P<label>.*){}".format(re.escape(self.content.file_extension))
        )
        same_extension = regex_file_extension.match(new_filename)
        if same_extension:
            new_label = same_extension.group("label")
            new_file_extension = self.content.file_extension
        else:
            new_label, new_file_extension = os.path.splitext(new_filename)

        self.tracim_context.set_destpath(destpath)
        destination_workspace = self.tracim_context.candidate_workspace
        try:
            destination_parent = self.tracim_context.candidate_parent_content
        except ContentNotFound:
            destination_parent = None
        try:
            # // OVERRIDE ?
            self.content_api.copy(
                item=self.content,
                context=self.tracim_context,
                new_parent=destination_parent,
                new_label=new_label,
                new_workspace=destination_workspace,
                new_file_extension=new_file_extension,
                allow_overwrite=True,
            )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc
        transaction.commit()


class FileResource(DAVNonCollection):
    """
    FileResource resource corresponding to tracim's files
    """

    def __init__(
        self,
        path: str,
        environ: dict,
        content: Content,
        tracim_context: "WebdavTracimContext",
    ) -> None:
        super(FileResource, self).__init__(path, environ)
        self.tracim_context = tracim_context
        self.content = content
        self.user = tracim_context.current_user
        self.session = tracim_context.dbsession
        self.content_api = ContentApi(
            current_user=self.user,
            config=tracim_context.app_config,
            session=self.session,
            namespaces_filter=[self.content.content_namespace],
        )

        # this is the property that windows client except to check if the file is read-write or read-only,
        # but i wasn't able to set this property so you'll have to look into it >.>
        # self.setPropertyValue('Win32FileAttributes', '00000021')

    def __repr__(self) -> str:
        return "<DAVNonCollection: FileResource (%d)>" % self.content.cached_revision_id

    @webdav_check_right(is_reader)
    def get_content_length(self) -> int:
        return self.content.depot_file.file.content_length

    @webdav_check_right(is_reader)
    def get_content_type(self) -> str:
        return self.content.file_mimetype

    @webdav_check_right(is_reader)
    def get_creation_date(self) -> float:
        return mktime(self.content.created.timetuple())

    @webdav_check_right(is_reader)
    def get_display_name(self) -> str:
        return webdav_convert_file_name_to_display(self.content.file_name)

    @webdav_check_right(is_reader)
    def get_display_info(self):
        return {"type": self.content.type.capitalize()}

    def get_last_modified(self) -> float:
        return mktime(self.content.updated.timetuple())

    @webdav_check_right(is_reader)
    def get_content(self) -> typing.BinaryIO:
        return self.content.depot_file.file

    @webdav_check_right(is_reader)
    def get_etag(self):
        return None

    @webdav_check_right(is_reader)
    def support_etag(self):
        return self.get_etag() is not None

    @webdav_check_right(is_contributor)
    def begin_write(self, *, content_type: str = None) -> FakeFileStream:
        try:
            self.content_api.check_upload_size(
                int(self.environ["CONTENT_LENGTH"]), self.content.workspace
            )
        except (
            FileSizeOverMaxLimitation,
            FileSizeOverWorkspaceEmptySpace,
            FileSizeOverOwnerEmptySpace,
        ) as exc:
            raise DAVError(HTTP_REQUEST_ENTITY_TOO_LARGE, contextinfo=str(exc))
        return FakeFileStream(
            content=self.content,
            content_api=self.content_api,
            file_name=self.content.file_name,
            workspace=self.content.workspace,
            path=self.path,
            session=self.session,
        )

    def move_recursive(self, dest_path):
        """As we support recursive move, copymovesingle won't be called, though with copy it'll be called
        but i have to check if the client ever call that function..."""
        destpath = normpath(dest_path)
        self.tracim_context.set_destpath(destpath)
        if normpath(dirname(destpath)) == normpath(dirname(self.path)):
            # INFO - G.M - 2018-12-12 - renaming case
            checker = is_contributor
        else:
            # INFO - G.M - 2018-12-12 - move case
            checker = can_move_content

        try:
            checker.check(self.tracim_context)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc))

        invalid_path = False
        invalid_path = dirname(destpath) == self.environ["wsgidav.auth.realm"]

        if not invalid_path:
            self.move_file(destpath)

        if invalid_path:
            raise DAVError(HTTP_FORBIDDEN)

    def move_file(self, destpath: str) -> None:
        """
        Move file mean changing the path to access to a file. This can mean
        simple renaming(1), moving file from a directory to one another(2)
        but also renaming + moving file from a directory to one another at
        the same time (3).

        (1): move /dir1/file1 -> /dir1/file2
        (2): move /dir1/file1 -> /dir2/file1
        (3): move /dir1/file1 -> /dir2/file2
        :param destpath: destination path of webdav move
        :return: nothing
        """

        workspace = self.content.workspace
        parent = self.content.parent
        destpath = normpath(destpath)
        self.tracim_context.set_destpath(destpath)
        if normpath(dirname(destpath)) == normpath(dirname(self.path)):
            # INFO - G.M - 2018-12-12 - renaming case
            checker = is_contributor
        else:
            # INFO - G.M - 2018-12-12 - move case
            checker = can_move_content

        try:
            checker.check(self.tracim_context)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc))

        try:
            with new_revision(content=self.content, tm=transaction.manager, session=self.session):
                # INFO - G.M - 2018-03-09 - First, renaming file if needed
                if basename(destpath) != self.get_display_name():
                    # aaa.crt -> label = aaa extension = ".crt"
                    # aaa.crt.bob -> new_label = aaa.crt new_extention = .bob
                    new_filename = webdav_convert_file_name_to_bdd(basename(destpath))
                    new_label, new_file_extension = os.path.splitext(new_filename)
                    if new_label != self.content.label:
                        self.content_api.update_content(
                            self.content, new_label=new_label, force_update=True
                        )
                    self.content.file_extension = new_file_extension
                    self.content_api.save(self.content)

                # INFO - G.M - 2018-03-09 - Moving file if needed
                destination_workspace = self.tracim_context.candidate_workspace
                try:
                    destination_parent = self.tracim_context.candidate_parent_content
                except ContentNotFound:
                    destination_parent = None
                if destination_parent != parent or destination_workspace != workspace:
                    #  INFO - G.M - 12-03-2018 - Avoid moving the file "at the same place"
                    #  if the request does not result in a real move.
                    self.content_api.move(
                        item=self.content,
                        new_parent=destination_parent,
                        must_stay_in_same_workspace=False,
                        new_workspace=destination_workspace,
                    )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc

        transaction.commit()

    def copy_move_single(self, dest_path, *, is_move):
        if is_move:
            # INFO - G.M - 12-03-2018 - This case should not happen
            # As far as moveRecursive method exist, all move should not go
            # through this method. If such case appear, try replace this to :
            ####
            # self.move_file(destpath)
            # return
            ####
            raise NotImplementedError("Feature not available")

        destpath = normpath(dest_path)
        self.tracim_context.set_destpath(destpath)
        try:
            can_move_content.check(self.tracim_context)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc))

        content_in_context = self.content_api.get_content_in_context(self.content)
        try:
            self.content_api.check_upload_size(content_in_context.size or 0, self.content.workspace)
        except (
            FileSizeOverMaxLimitation,
            FileSizeOverWorkspaceEmptySpace,
            FileSizeOverOwnerEmptySpace,
        ) as exc:
            raise DAVError(HTTP_REQUEST_ENTITY_TOO_LARGE, contextinfo=str(exc))
        new_filename = webdav_convert_file_name_to_bdd(basename(destpath))
        regex_file_extension = re.compile(
            "(?P<label>.*){}".format(re.escape(self.content.file_extension))
        )
        same_extension = regex_file_extension.match(new_filename)
        if same_extension:
            new_label = same_extension.group("label")
            new_file_extension = self.content.file_extension
        else:
            new_label, new_file_extension = os.path.splitext(new_filename)

        self.tracim_context.set_destpath(destpath)
        destination_workspace = self.tracim_context.candidate_workspace
        try:
            destination_parent = self.tracim_context.candidate_parent_content
        except ContentNotFound:
            destination_parent = None
        try:
            self.content_api.copy(
                item=self.content,
                context=self.tracim_context,
                new_label=new_label,
                new_file_extension=new_file_extension,
                new_parent=destination_parent,
                new_workspace=destination_workspace,
                allow_overwrite=True,
            )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc
        transaction.commit()

    def support_recursive_move(self, dest_path):
        return True

    @webdav_check_right(is_content_manager)
    def delete(self):
        try:
            with new_revision(session=self.session, tm=transaction.manager, content=self.content):
                self.content_api.delete(self.content)
                self.content_api.save(self.content)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN, contextinfo=str(exc)) from exc
        transaction.commit()


class OtherFileResource(FileResource):
    """
    FileResource resource corresponding to tracim's page and thread
    """

    def __init__(
        self,
        path: str,
        environ: dict,
        content: Content,
        tracim_context: "WebdavTracimContext",
    ):
        super(OtherFileResource, self).__init__(
            path, environ, content, tracim_context=tracim_context
        )
        self.content_revision = self.content.revision
        self.content_designed = self.design()

        # workaround for consistent request as we have to return a resource with a path ending with .html
        # when entering folder for windows, but only once because when we select it again it would have .html.html
        # which is no good
        if not self.path.endswith(".html"):
            self.path += ".html"

    def __repr__(self) -> str:
        return "<DAVNonCollection: OtherFileResource (%s)" % self.content.file_name

    @webdav_check_right(is_reader)
    def get_content_length(self) -> int:
        return len(self.content_designed)

    @webdav_check_right(is_reader)
    def get_content_type(self) -> str:
        return "text/html; charset=utf-8"

    @webdav_check_right(is_reader)
    def get_display_info(self):
        return {"type": self.content.type.capitalize()}

    @webdav_check_right(is_reader)
    def get_content(self):
        # TODO - G.M - 2019-06-13 - find solution to handle properly big file here without having
        # big file in memory. see https://github.com/tracim/tracim/issues/1913
        filestream = io.BytesIO()

        filestream.write(bytes(self.content_designed, "utf-8"))
        filestream.seek(0)
        return filestream

    def design(self):
        # TODO - G.M - 2019-06-13 - find solution to handle properly big file here without having
        # big file in memory. see https://github.com/tracim/tracim/issues/1913
        if content_type_list.get_one_by_slug(self.content.type) == content_type_list.Page:
            return design_page(self.content, self.content_revision)
        if content_type_list.get_one_by_slug(self.content.type) == content_type_list.Thread:
            return design_thread(
                self.content,
                self.content_revision,
                self.content_api.get_all([self.content.content_id], content_type_list.Comment.slug),
            )
        raise NotImplementedError()
