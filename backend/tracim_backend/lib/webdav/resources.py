# coding: utf8
import functools
import logging
import os
import re
import typing
from datetime import datetime
from os.path import basename
from os.path import dirname
from time import mktime

import transaction
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import MultipleResultsFound
from sqlalchemy.orm.exc import NoResultFound
from wsgidav import compat
from wsgidav.dav_error import HTTP_FORBIDDEN
from wsgidav.dav_error import DAVError
from wsgidav.dav_provider import DAVCollection
from wsgidav.dav_provider import DAVNonCollection
from wsgidav.dav_provider import _DAVResource

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import TracimException
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import AuthorizationChecker
from tracim_backend.lib.utils.authorization import can_delete_workspace
from tracim_backend.lib.utils.authorization import can_modify_workspace
from tracim_backend.lib.utils.authorization import can_move_content
from tracim_backend.lib.utils.authorization import \
    can_see_workspace_information
from tracim_backend.lib.utils.authorization import is_content_manager
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.authorization import is_trusted_user
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.utils import normpath
from tracim_backend.lib.utils.utils import webdav_convert_file_name_to_bdd
from tracim_backend.lib.utils.utils import webdav_convert_file_name_to_display
from tracim_backend.lib.webdav.design import designPage
from tracim_backend.lib.webdav.design import designThread
from tracim_backend.lib.webdav.utils import FakeFileStream
from tracim_backend.lib.webdav.utils import HistoryType
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import User
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision

logger = logging.getLogger()

if typing.TYPE_CHECKING:
    from tracim_backend.lib.webdav.dav_provider import WebdavTracimContext

def webdav_check_right(authorization_checker: AuthorizationChecker):
    def decorator(func: typing.Callable) -> typing.Callable:
        @functools.wraps(func)
        def wrapper(self: '_DAVResource', *arg, **kwarg) -> typing.Callable:
            tracim_context = self.tracim_context # type: WebdavTracimContext
            try:
                authorization_checker.check(
                    tracim_context=self.tracim_context,
                )
            except TracimException as exc:
                raise DAVError(HTTP_FORBIDDEN) from exc
            return func(self, *arg, **kwarg)
        return wrapper
    return decorator


class ManageActions(object):
    """
    This object is used to encapsulate all Deletion/Archiving related
    method as to not duplicate too much code
    """
    def __init__(self,
                 session: Session,
                 action_type: str,
                 api: ContentApi,
                 content: Content
                 ):
        self.session = session
        self.content_api = api
        self.content = content

        self._actions = {
            ActionDescription.ARCHIVING: self.content_api.archive,
            ActionDescription.DELETION: self.content_api.delete,
            ActionDescription.UNARCHIVING: self.content_api.unarchive,
            ActionDescription.UNDELETION: self.content_api.undelete
        }

        self._type = action_type

    def action(self):
        try:
            with new_revision(
                session=self.session,
                tm=transaction.manager,
                content=self.content,
            ):
                self._actions[self._type](self.content)
                self.content_api.save(self.content, self._type)
        except TracimException as exc:
                raise DAVError(HTTP_FORBIDDEN) from exc

        transaction.commit()


class RootResource(DAVCollection):
    """
    RootResource ressource that represents tracim's home, which contains all workspaces
    """

    def __init__(self, path: str, environ: dict, tracim_context: 'WebdavTracimContext'):
        super(RootResource, self).__init__(path, environ)
        self.tracim_context = tracim_context
        self.user = tracim_context.current_user
        self.session = tracim_context.dbsession
        # TODO BS 20170221: Web interface should list all workspace to. We
        # disable it here for moment. When web interface will be updated to
        # list all workspace, change this here to.
        self.workspace_api = WorkspaceApi(
            current_user=self.user,
            session=self.session,
            force_role=True,
            config=tracim_context.app_config
        )

    def __repr__(self) -> str:
        return '<DAVCollection: RootResource>'

    @webdav_check_right(is_user)
    def getMemberNames(self) -> [str]:
        """
        This method returns the names (here workspace's labels) of all its children

        Though for perfomance issue, we're not using this function anymore
        """
        return [workspace.label for workspace in self.workspace_api.get_all()]

    @webdav_check_right(is_user)
    def getMember(self, label: str) -> DAVCollection:
        """
        This method returns the child Workspace that corresponds to a given name

        Though for perfomance issue, we're not using this function anymore
        """
        try:
            workspace = self.workspace_api.get_one_by_label(label)
            workspace_path = '%s%s%s' % (self.path, '' if self.path == '/' else '/', webdav_convert_file_name_to_display(workspace.label))

            return WorkspaceResource(
                workspace_path,
                self.environ,
                workspace,
                tracim_context=self.tracim_context
            )
        except AttributeError:
            return None

    @webdav_check_right(is_trusted_user)
    def createEmptyResource(self, name: str):
        """
        This method is called whenever the user wants to create a DAVNonCollection resource (files in our case).

        There we don't allow to create files at the root;
        only workspaces (thus collection) can be created.
        """
        raise DAVError(HTTP_FORBIDDEN)

    @webdav_check_right(is_trusted_user)
    def createCollection(self, name: str):
        """
        This method is called whenever the user wants to create a DAVCollection resource as a child (in our case,
        we create workspaces as this is the root).

        [For now] we don't allow to create new workspaces through
        webdav client. Though if we come to allow it, deleting the error's raise will
        make it possible.
        """
        # TODO : remove comment here
        # raise DAVError(HTTP_FORBIDDEN)

        new_workspace = self.workspace_api.create_workspace(name)
        self.workspace_api.save(new_workspace)

        workspace_path = '%s%s%s' % (
            self.path, '' if self.path == '/' else '/', webdav_convert_file_name_to_display(new_workspace.label))

        transaction.commit()
        return WorkspaceResource(
            workspace_path,
            self.environ,
            new_workspace,
            tracim_context=self.tracim_context
        )

    @webdav_check_right(is_user)
    def getMemberList(self):
        """
        This method is called by wsgidav when requesting with a depth > 0, it will return a list of _DAVResource
        of all its direct children
        """

        members = []
        for workspace in self.workspace_api.get_all():
            workspace_path = '%s%s%s' % (self.path, '' if self.path == '/' else '/', workspace.label)
            members.append(
                WorkspaceResource(
                    path=workspace_path,
                    environ=self.environ,
                    workspace=workspace,
                    tracim_context=self.tracim_context
                )
            )

        return members


class WorkspaceResource(DAVCollection):
    """
    Workspace resource corresponding to tracim's workspaces.
    Direct children can only be folders, though files might come later on and are supported
    """

    def __init__(self,
                 path: str,
                 environ: dict,
                 workspace: Workspace,
                 tracim_context: 'WebdavTracimContext'
    ) -> None:
        super(WorkspaceResource, self).__init__(path, environ)

        self.workspace = workspace
        self.content = None
        self.tracim_context = tracim_context
        self.user = tracim_context.current_user
        self.session = tracim_context.dbsession
        self.content_api = ContentApi(
            current_user=self.user,
            session=tracim_context.dbsession,
            config=tracim_context.app_config,
            show_temporary=True
        )

        self._file_count = 0

    def __repr__(self) -> str:
        return "<DAVCollection: Workspace (%d)>" % self.workspace.workspace_id


    def getPreferredPath(self):
        return self.path

    def getCreationDate(self) -> float:
        return mktime(self.workspace.created.timetuple())

    def getDisplayName(self) -> str:
        return webdav_convert_file_name_to_display(self.workspace.label)

    def getDisplayInfo(self):
        return {
            'type': "workspace".capitalize(),
        }

    def getLastModified(self) -> float:
        return mktime(self.workspace.updated.timetuple())

    def getMemberNames(self) -> [str]:
        retlist = []

        children = self.content_api.get_all(
            parent_ids=[self.content.id] if self.content is not None else None,
            workspace=self.workspace
        )

        for content in children:
            # the purpose is to display .history only if there's at least one content's type that has a history
            if content.type != content_type_list.Folder.slug:
                self._file_count += 1
            retlist.append(content.file_name)

        return retlist

    def getMember(self, content_label: str) -> _DAVResource:

        return self.provider.getResourceInst(
            '%s/%s' % (self.path, webdav_convert_file_name_to_display(content_label)),
            self.environ
        )

    @webdav_check_right(is_contributor)
    def createEmptyResource(self, file_name: str):
        """
        [For now] we don't allow to create files right under workspaces.
        Though if we come to allow it, deleting the error's raise will make it possible.
        """
        # TODO : remove commentary here raise DAVError(HTTP_FORBIDDEN)
        if '/.deleted/' in self.path or '/.archived/' in self.path:
            raise DAVError(HTTP_FORBIDDEN)

        content = None

        # Note: To prevent bugs, check here again if resource already exist
        path = os.path.join(self.path, file_name)
        resource = self.provider.getResourceInst(path, self.environ)
        if resource:
            content = resource.content

        return FakeFileStream(
            session=self.session,
            file_name=file_name,
            content_api=self.content_api,
            workspace=self.workspace,
            content=content,
            parent=self.content,
            path=self.path + '/' + file_name
        )

    @webdav_check_right(is_content_manager)
    def createCollection(self, label: str) -> 'FolderResource':
        """
        Create a new folder for the current workspace. As it's not possible for the user to choose
        which types of content are allowed in this folder, we allow allow all of them.

        This method return the DAVCollection created.
        """

        if '/.deleted/' in self.path or '/.archived/' in self.path:
            raise DAVError(HTTP_FORBIDDEN)

        try:
            folder = self.content_api.create(
                content_type_slug=content_type_list.Folder.slug,
                workspace=self.workspace,
                label=label,
                parent=self.content
            )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN) from exc

        self.content_api.save(folder)

        transaction.commit()

        return FolderResource('%s/%s' % (self.path, webdav_convert_file_name_to_display(label)),
                              self.environ,
                              content=folder,
                              tracim_context=self.tracim_context,
                              workspace=self.workspace,
                              )

    def delete(self):
        """For now, it is not possible to delete a workspace through the webdav client."""
        # FIXME - G.M - 2018-12-11 - For an unknown reason current_workspace
        # of tracim_context is here invalid.
        self.tracim_context._current_workspace = self.workspace
        try:
            can_delete_workspace.check(self.tracim_context)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN)
        raise DAVError(HTTP_FORBIDDEN)

    def supportRecursiveMove(self, destpath):
        return True

    def moveRecursive(self, destpath):
        # INFO - G.M - 2018-12-11 - We only allow renaming
        if dirname(normpath(destpath)) == self.environ['http_authenticator.realm']:
            # FIXME - G.M - 2018-12-11 - For an unknown reason current_workspace
            # of tracim_context is here invalid.
            self.tracim_context._current_workspace = self.workspace
            try:
                can_modify_workspace.check(self.tracim_context)
            except TracimException as exc:
                raise DAVError(HTTP_FORBIDDEN)

            try:
                self.workspace.label = basename(normpath(destpath))
                self.session.add(self.workspace)
                self.session.flush()
                transaction.commit()
            except TracimException as exc:
                raise DAVError(HTTP_FORBIDDEN)

    def getMemberList(self) -> [_DAVResource]:
        members = []

        children = self.content_api.get_all(False, content_type_list.Any_SLUG, self.workspace)

        for content in children:
            content_path = '%s/%s' % (self.path, webdav_convert_file_name_to_display(content.file_name))

            if content.type == content_type_list.Folder.slug:
                members.append(
                    FolderResource(
                        path=content_path,
                        environ=self.environ,
                        workspace=self.workspace,
                        content=content,
                        tracim_context=self.tracim_context
                    )
                )
            elif content.type == content_type_list.File.slug:
                self._file_count += 1
                members.append(
                    FileResource(
                        path=content_path,
                        environ=self.environ,
                        content=content,
                        tracim_context=self.tracim_context
                    )
                )
            else:
                self._file_count += 1
                members.append(
                    OtherFileResource(
                        content_path,
                        self.environ,
                        content,
                        tracim_context=self.tracim_context
                    ))
        return members


class FolderResource(WorkspaceResource):
    """
    FolderResource resource corresponding to tracim's folders.
    Direct children can only be either folder, files, pages or threads
    By default when creating new folders, we allow them to contain all types of content
    """

    def __init__(
            self,
            path: str,
            environ: dict,
            workspace: Workspace,
            content: Content,
            tracim_context: 'WebdavTracimContext'
    ):
        super(FolderResource, self).__init__(
            path=path,
            environ=environ,
            workspace=workspace,
            tracim_context=tracim_context
        )
        self.content = content

    def __repr__(self) -> str:
        return "<DAVCollection: Folder (%s)>" % self.content.label

    @webdav_check_right(is_reader)
    def getCreationDate(self) -> float:
        return mktime(self.content.created.timetuple())

    @webdav_check_right(is_reader)
    def getDisplayName(self) -> str:
        return webdav_convert_file_name_to_display(self.content.file_name)

    @webdav_check_right(is_reader)
    def getDisplayInfo(self):
        return {
            'type': self.content.type.capitalize(),
        }

    @webdav_check_right(is_reader)
    def getLastModified(self) -> float:
        return mktime(self.content.updated.timetuple())

    @webdav_check_right(is_content_manager)
    def delete(self):
        ManageActions(
            action_type=ActionDescription.DELETION,
            api=self.content_api,
            content=self.content,
            session=self.session,
        ).action()

    def supportRecursiveMove(self, destpath: str):
        return True

    def moveRecursive(self, destpath: str):
        """
        As we support recursive move, copymovesingle won't be called, though with copy it'll be called
        but i have to check if the client ever call that function...
        """
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
            raise DAVError(HTTP_FORBIDDEN)

        # if content is either deleted or archived, we'll check that we try moving it to the parent
        # if yes, then we'll unarchive / undelete them, else the action's not allowed
        if self.content.is_deleted or self.content.is_archived:
            # we remove all archived and deleted from the path and we check to the destpath
            # has to be equal or else path not valid
            # ex: /a/b/.deleted/resource, to be valid destpath has to be = /a/b/resource (no other solution)
            current_path = re.sub(r'/\.(deleted|archived)', '', self.path)

            if current_path == destpath:
                ManageActions(
                    action_type=ActionDescription.UNDELETION if self.content.is_deleted else ActionDescription.UNARCHIVING,
                    api=self.content_api,
                    content=self.content,
                    session=self.session,
                ).action()
            else:
                invalid_path = True
        # if the content is not deleted / archived, check if we're trying to delete / archive it by
        # moving it to a .deleted / .archived folder
        elif basename(dirname(destpath)) in ['.deleted', '.archived']:
            # same test as above ^
            dest_path = re.sub(r'/\.(deleted|archived)', '', destpath)

            if dest_path == self.path:
                ManageActions(
                    action_type=ActionDescription.DELETION if '.deleted' in destpath else ActionDescription.ARCHIVING,
                    api=self.content_api,
                    content=self.content,
                    session=self.session,
                ).action()
            else:
                invalid_path = True
        # else we check if the path is good (not at the root path / not in a deleted/archived path)
        # and we move the content
        else:
            invalid_path = any(x in destpath for x in ['.deleted', '.archived'])
            invalid_path = invalid_path or any(x in self.path for x in ['.deleted', '.archived'])
            invalid_path = invalid_path or dirname(destpath) == self.environ['http_authenticator.realm']

            if not invalid_path:
                self.move_folder(destpath)

        if invalid_path:
            raise DAVError(HTTP_FORBIDDEN)

    def move_folder(self, destpath):

        workspace_api = WorkspaceApi(
            current_user=self.user,
            session=self.session,
            config=self.provider.app_config,
        )
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
            raise DAVError(HTTP_FORBIDDEN)

        destination_workspace = self.tracim_context.candidate_workspace
        try:
            destination_parent = self.tracim_context.candidate_parent_content
        except ContentNotFound as e:
            destination_parent = None
        try:
            with new_revision(
                content=self.content,
                tm=transaction.manager,
                session=self.session,
            ):
                if basename(destpath) != self.getDisplayName():
                    self.content_api.update_content(self.content, webdav_convert_file_name_to_bdd(basename(destpath)))
                    self.content_api.save(self.content)
                else:
                    if destination_workspace.workspace_id == self.content.workspace.workspace_id:
                        self.content_api.move(self.content, destination_parent)
                    else:
                        self.content_api.move_recursively(self.content, destination_parent, destination_workspace)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN) from exc

        transaction.commit()

    @webdav_check_right(is_reader)
    def getMemberList(self) -> [_DAVResource]:
        members = []
        content_api = ContentApi(
            current_user=self.user,
            config=self.provider.app_config,
            session=self.session,
        )
        visible_children = content_api.get_all(
            [self.content.content_id],
            content_type_list.Any_SLUG,
            self.workspace,
        )

        for content in visible_children:
            content_path = '%s/%s' % (self.path, webdav_convert_file_name_to_display(content.file_name))

            try:
                if content.type == content_type_list.Folder.slug:
                    members.append(
                        FolderResource(
                            path=content_path,
                            environ=self.environ,
                            workspace=self.workspace,
                            content=content,
                            tracim_context=self.tracim_context
                        )
                    )
                elif content.type == content_type_list.File.slug:
                    self._file_count += 1
                    members.append(
                        FileResource(
                            path=content_path,
                            environ=self.environ,
                            content=content,
                            tracim_context=self.tracim_context
                        ))
                else:
                    self._file_count += 1
                    members.append(
                        OtherFileResource(
                            path=content_path,
                            environ=self.environ,
                            content=content,
                            tracim_context=self.tracim_context
                        ))
            except NotImplementedError as exc:
                pass

        return members


class FileResource(DAVNonCollection):
    """
    FileResource resource corresponding to tracim's files
    """
    def __init__(
            self,
            path: str,
            environ: dict,
            content: Content,
            tracim_context: 'WebdavTracimContext'
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
        )

        # this is the property that windows client except to check if the file is read-write or read-only,
        # but i wasn't able to set this property so you'll have to look into it >.>
        # self.setPropertyValue('Win32FileAttributes', '00000021')

    def __repr__(self) -> str:
        return "<DAVNonCollection: FileResource (%d)>" % self.content.revision_id

    @webdav_check_right(is_reader)
    def getContentLength(self) -> int:
        return self.content.depot_file.file.content_length

    @webdav_check_right(is_reader)
    def getContentType(self) -> str:
        return self.content.file_mimetype

    @webdav_check_right(is_reader)
    def getCreationDate(self) -> float:
        return mktime(self.content.created.timetuple())

    @webdav_check_right(is_reader)
    def getDisplayName(self) -> str:
        return webdav_convert_file_name_to_display(self.content.file_name)

    @webdav_check_right(is_reader)
    def getDisplayInfo(self):
        return {
            'type': self.content.type.capitalize(),
        }

    @webdav_check_right(is_reader)
    def getLastModified(self) -> float:
        return mktime(self.content.updated.timetuple())

    @webdav_check_right(is_reader)
    def getContent(self) -> typing.BinaryIO:
        filestream = compat.BytesIO()
        filestream.write(self.content.depot_file.file.read())
        filestream.seek(0)

        return filestream

    def beginWrite(self, contentType: str=None) -> FakeFileStream:
        return FakeFileStream(
            content=self.content,
            content_api=self.content_api,
            file_name=self.content.file_name,
            workspace=self.content.workspace,
            path=self.path,
            session=self.session,
        )


    def moveRecursive(self, destpath):
        """As we support recursive move, copymovesingle won't be called, though with copy it'll be called
            but i have to check if the client ever call that function..."""
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
            raise DAVError(HTTP_FORBIDDEN)

        invalid_path = False

        # if content is either deleted or archived, we'll check that we try moving it to the parent
        # if yes, then we'll unarchive / undelete them, else the action's not allowed
        if self.content.is_deleted or self.content.is_archived:
            # we remove all archived and deleted from the path and we check to the destpath
            # has to be equal or else path not valid
            # ex: /a/b/.deleted/resource, to be valid destpath has to be = /a/b/resource (no other solution)
            current_path = re.sub(r'/\.(deleted|archived)', '', self.path)

            if current_path == destpath:
                ManageActions(
                    action_type=ActionDescription.UNDELETION if self.content.is_deleted else ActionDescription.UNARCHIVING,
                    api=self.content_api,
                    content=self.content,
                    session=self.session,
                ).action()
            else:
                invalid_path = True
        # if the content is not deleted / archived, check if we're trying to delete / archive it by
        # moving it to a .deleted / .archived folder
        elif basename(dirname(destpath)) in ['.deleted', '.archived']:
            # same test as above ^
            dest_path = re.sub(r'/\.(deleted|archived)', '', destpath)

            if dest_path == self.path:
                ManageActions(
                    action_type=ActionDescription.DELETION if '.deleted' in destpath else ActionDescription.ARCHIVING,
                    api=self.content_api,
                    content=self.content,
                    session=self.session,
                ).action()
            else:
                invalid_path = True
        # else we check if the path is good (not at the root path / not in a deleted/archived path)
        # and we move the content
        else:
            invalid_path = any(x in destpath for x in ['.deleted', '.archived'])
            invalid_path = invalid_path or any(x in self.path for x in ['.deleted', '.archived'])
            invalid_path = invalid_path or dirname(destpath) == self.environ['http_authenticator.realm']

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
            raise DAVError(HTTP_FORBIDDEN)

        try:
            with new_revision(
                content=self.content,
                tm=transaction.manager,
                session=self.session,
            ):
                # INFO - G.M - 2018-03-09 - First, renaming file if needed
                if basename(destpath) != self.getDisplayName():

                    new_filename = webdav_convert_file_name_to_bdd(basename(destpath))
                    regex_file_extension = re.compile(
                        '(?P<label>.*){}'.format(
                            re.escape(self.content.file_extension)))
                    same_extension = regex_file_extension.match(new_filename)
                    if same_extension:
                        new_label = same_extension.group('label')
                        new_file_extension = self.content.file_extension
                    else:
                        new_label, new_file_extension = os.path.splitext(
                            new_filename)

                    self.content_api.update_content(
                        self.content,
                        new_label=new_label,
                    )
                    self.content.file_extension = new_file_extension
                    self.content_api.save(self.content)

                # INFO - G.M - 2018-03-09 - Moving file if needed
                destination_workspace = self.tracim_context.candidate_workspace
                try:
                    destination_parent = self.tracim_context.candidate_parent_content
                except ContentNotFound:
                    destination_parent = None
                if destination_parent != parent or destination_workspace != workspace:  # nopep8
                    #  INFO - G.M - 12-03-2018 - Avoid moving the file "at the same place"  # nopep8
                    #  if the request does not result in a real move.
                    self.content_api.move(
                        item=self.content,
                        new_parent=destination_parent,
                        must_stay_in_same_workspace=False,
                        new_workspace=destination_workspace
                    )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN) from exc

        transaction.commit()

    def copyMoveSingle(self, destpath, isMove):
        if isMove:
            # INFO - G.M - 12-03-2018 - This case should not happen
            # As far as moveRecursive method exist, all move should not go
            # through this method. If such case appear, try replace this to :
            ####
            # self.move_file(destpath)
            # return
            ####
            raise NotImplemented('Feature not available')

        destpath = normpath(destpath)
        self.tracim_context.set_destpath(destpath)
        try:
            can_move_content.check(self.tracim_context)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN)

        new_filename = webdav_convert_file_name_to_bdd(basename(destpath))
        regex_file_extension = re.compile(
            '(?P<label>.*){}'.format(re.escape(self.content.file_extension)))
        same_extension = regex_file_extension.match(new_filename)
        if same_extension:
            new_label = same_extension.group('label')
            new_file_extension = self.content.file_extension
        else:
           new_label, new_file_extension = os.path.splitext(new_filename)

        self.tracim_context.set_destpath(destpath)
        destination_workspace = self.tracim_context.candidate_workspace
        try:
            destination_parent = self.tracim_context.candidate_parent_content
        except ContentNotFound as e:
            destination_parent = None
        workspace = self.content.workspace
        parent = self.content.parent
        try:
            new_content = self.content_api.copy(
                item=self.content,
                new_label=new_label,
                new_file_extension=new_file_extension,
                new_parent=destination_parent,
                new_workspace=destination_workspace
            )
            self.content_api.copy_children(self.content, new_content)
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN) from exc
        transaction.commit()

    def supportRecursiveMove(self, destpath):
        return True

    @webdav_check_right(is_content_manager)
    def delete(self):
        ManageActions(
            action_type=ActionDescription.DELETION,
            api=self.content_api,
            content=self.content,
            session=self.session,
        ).action()

class OtherFileResource(FileResource):
    """
    FileResource resource corresponding to tracim's page and thread
    """
    def __init__(self, path: str, environ: dict, content: Content, tracim_context: 'WebdavTracimContext'):
        super(OtherFileResource, self).__init__(path, environ, content, tracim_context=tracim_context)

        self.content_revision = self.content.revision

        self.content_designed = self.design()

        # workaround for consistent request as we have to return a resource with a path ending with .html
        # when entering folder for windows, but only once because when we select it again it would have .html.html
        # which is no good
        if not self.path.endswith('.html'):
            self.path += '.html'

    @webdav_check_right(is_reader)
    def getDisplayName(self) -> str:
        return webdav_convert_file_name_to_display(self.content.file_name)

    @webdav_check_right(is_reader)
    def getPreferredPath(self):
        return self.path

    def __repr__(self) -> str:
        return "<DAVNonCollection: OtherFileResource (%s)" % self.content.file_name

    @webdav_check_right(is_reader)
    def getContentLength(self) -> int:
        return len(self.content_designed)

    @webdav_check_right(is_reader)
    def getContentType(self) -> str:
        return 'text/html; charset=utf-8'

    @webdav_check_right(is_reader)
    def getContent(self):
        filestream = compat.BytesIO()

        filestream.write(bytes(self.content_designed, 'utf-8'))
        filestream.seek(0)
        return filestream

    @webdav_check_right(is_reader)
    def getDisplayInfo(self):
        return {
            'type': self.content.type.capitalize(),
        }

    def design(self):
        if self.content.type == content_type_list.Page.slug:
            return designPage(self.content, self.content_revision)
        else:
            return designThread(
                self.content,
                self.content_revision,
                self.content_api.get_all([self.content.content_id], content_type_list.Comment.slug)
            )
