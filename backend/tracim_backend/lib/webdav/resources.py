# coding: utf8
import logging

import os

import transaction
import typing
import re
from datetime import datetime
from time import mktime
from os.path import dirname, basename

from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.webdav.utils import transform_to_display, HistoryType, \
    FakeFileStream
from tracim_backend.lib.webdav.utils import transform_to_bdd
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.contents import CONTENT_TYPES
from tracim_backend.models.data import User, ContentRevisionRO
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import Content
from tracim_backend.models.data import ActionDescription
from tracim_backend.lib.webdav.design import designThread, designPage

from wsgidav import compat
from wsgidav.dav_error import DAVError, HTTP_FORBIDDEN
from wsgidav.dav_provider import DAVCollection, DAVNonCollection
from wsgidav.dav_provider import _DAVResource
from tracim_backend.lib.webdav.utils import normpath

from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound

from tracim_backend.models.revision_protection import new_revision

logger = logging.getLogger()


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
        with new_revision(
            session=self.session,
            tm=transaction.manager,
            content=self.content,
        ):
            self._actions[self._type](self.content)
            self.content_api.save(self.content, self._type)

        transaction.commit()


class RootResource(DAVCollection):
    """
    RootResource ressource that represents tracim's home, which contains all workspaces
    """

    def __init__(self, path: str, environ: dict, user: User, session: Session):
        super(RootResource, self).__init__(path, environ)

        self.user = user
        self.session = session
        # TODO BS 20170221: Web interface should list all workspace to. We
        # disable it here for moment. When web interface will be updated to
        # list all workspace, change this here to.
        self.workspace_api = WorkspaceApi(
            current_user=self.user,
            session=session,
            force_role=True,
            config=self.provider.app_config
        )

    def __repr__(self) -> str:
        return '<DAVCollection: RootResource>'

    def getMemberNames(self) -> [str]:
        """
        This method returns the names (here workspace's labels) of all its children

        Though for perfomance issue, we're not using this function anymore
        """
        return [workspace.label for workspace in self.workspace_api.get_all()]

    def getMember(self, label: str) -> DAVCollection:
        """
        This method returns the child Workspace that corresponds to a given name

        Though for perfomance issue, we're not using this function anymore
        """
        try:
            workspace = self.workspace_api.get_one_by_label(label)
            workspace_path = '%s%s%s' % (self.path, '' if self.path == '/' else '/', transform_to_display(workspace.label))

            return WorkspaceResource(
                workspace_path,
                self.environ,
                workspace,
                session=self.session,
                user=self.user,
            )
        except AttributeError:
            return None

    def createEmptyResource(self, name: str):
        """
        This method is called whenever the user wants to create a DAVNonCollection resource (files in our case).

        There we don't allow to create files at the root;
        only workspaces (thus collection) can be created.
        """
        raise DAVError(HTTP_FORBIDDEN)

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
        self.path, '' if self.path == '/' else '/', transform_to_display(new_workspace.label))

        transaction.commit()
        return WorkspaceResource(
            workspace_path,
            self.environ,
            new_workspace,
            user=self.user,
            session=self.session,
        )

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
                    user=self.user,
                    session=self.session,
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
                 user: User,
                 session: Session
    ) -> None:
        super(WorkspaceResource, self).__init__(path, environ)

        self.workspace = workspace
        self.content = None
        self.user = user
        self.session = session
        self.content_api = ContentApi(
            current_user=self.user,
            session=session,
            config=self.provider.app_config,
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
        return self.workspace.label

    def getLastModified(self) -> float:
        return mktime(self.workspace.updated.timetuple())

    def getMemberNames(self) -> [str]:
        retlist = []

        children = self.content_api.get_all(
            parent_id=self.content.id if self.content is not None else None,
            workspace=self.workspace
        )

        for content in children:
            # the purpose is to display .history only if there's at least one content's type that has a history
            if content.type != CONTENT_TYPES.Folder.slug:
                self._file_count += 1
            retlist.append(content.get_label_as_file())

        return retlist

    def getMember(self, content_label: str) -> _DAVResource:

        return self.provider.getResourceInst(
            '%s/%s' % (self.path, transform_to_display(content_label)),
            self.environ
        )

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

    def createCollection(self, label: str) -> 'FolderResource':
        """
        Create a new folder for the current workspace. As it's not possible for the user to choose
        which types of content are allowed in this folder, we allow allow all of them.

        This method return the DAVCollection created.
        """

        if '/.deleted/' in self.path or '/.archived/' in self.path:
            raise DAVError(HTTP_FORBIDDEN)

        folder = self.content_api.create(
            content_type_slug=CONTENT_TYPES.Folder.slug,
            workspace=self.workspace,
            label=label,
            parent=self.content
        )

        self.content_api.save(folder)

        transaction.commit()

        return FolderResource('%s/%s' % (self.path, transform_to_display(label)),
                              self.environ,
                              content=folder,
                              session=self.session,
                              user=self.user,
                              workspace=self.workspace,
                              )

    def delete(self):
        """For now, it is not possible to delete a workspace through the webdav client."""
        raise DAVError(HTTP_FORBIDDEN)

    def supportRecursiveMove(self, destpath):
        return True

    def moveRecursive(self, destpath):
        if dirname(normpath(destpath)) == self.environ['http_authenticator.realm']:
            self.workspace.label = basename(normpath(destpath))
            transaction.commit()
        else:
            raise DAVError(HTTP_FORBIDDEN)

    def getMemberList(self) -> [_DAVResource]:
        members = []

        children = self.content_api.get_all(False, CONTENT_TYPES.Any_SLUG, self.workspace)

        for content in children:
            content_path = '%s/%s' % (self.path, transform_to_display(content.get_label_as_file()))

            if content.type == CONTENT_TYPES.Folder.slug:
                members.append(
                    FolderResource(
                        path=content_path,
                        environ=self.environ,
                        workspace=self.workspace,
                        user=self.user,
                        content=content,
                        session=self.session,
                    )
                )
            elif content.type == CONTENT_TYPES.File.slug:
                self._file_count += 1
                members.append(
                    FileResource(
                        path=content_path,
                        environ=self.environ,
                        content=content,
                        user=self.user,
                        session=self.session,
                    )
                )
            else:
                self._file_count += 1
                members.append(
                    OtherFileResource(
                        content_path,
                        self.environ,
                        content,
                        session=self.session,
                        user=self.user,
                    ))

        if self._file_count > 0 and self.provider.show_history():
            members.append(
                HistoryFolderResource(
                    path=self.path + '/' + ".history",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    type=HistoryType.Standard,
                    session=self.session,
                    user=self.user,
                )
            )

        if self.provider.show_delete():
            members.append(
                DeletedFolderResource(
                    path=self.path + '/' + ".deleted",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    session=self.session,
                    user=self.user,
                )
            )

        if self.provider.show_archive():
            members.append(
                ArchivedFolderResource(
                    path=self.path + '/' + ".archived",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    user=self.user,
                    session=self.session,
                )
            )

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
            user: User,
            session: Session
    ):
        super(FolderResource, self).__init__(
            path=path,
            environ=environ,
            workspace=workspace,
            user=user,
            session=session,
        )
        self.content = content

    def __repr__(self) -> str:
        return "<DAVCollection: Folder (%s)>" % self.content.label

    def getCreationDate(self) -> float:
        return mktime(self.content.created.timetuple())

    def getDisplayName(self) -> str:
        return transform_to_display(self.content.get_label_as_file())

    def getLastModified(self) -> float:
        return mktime(self.content.updated.timetuple())

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
                self.move_folder(destpath)

        if invalid_path:
            raise DAVError(HTTP_FORBIDDEN)

    def move_folder(self, destpath):

        workspace_api = WorkspaceApi(
            current_user=self.user,
            session=self.session,
            config=self.provider.app_config,
        )
        workspace = self.provider.get_workspace_from_path(
            normpath(destpath), workspace_api
        )

        parent = self.provider.get_parent_from_path(
            normpath(destpath),
            self.content_api,
            workspace
        )

        with new_revision(
            content=self.content,
            tm=transaction.manager,
            session=self.session,
        ):
            if basename(destpath) != self.getDisplayName():
                self.content_api.update_content(self.content, transform_to_bdd(basename(destpath)))
                self.content_api.save(self.content)
            else:
                if workspace.workspace_id == self.content.workspace.workspace_id:
                    self.content_api.move(self.content, parent)
                else:
                    self.content_api.move_recursively(self.content, parent, workspace)

        transaction.commit()

    def getMemberList(self) -> [_DAVResource]:
        members = []
        content_api = ContentApi(
            current_user=self.user,
            config=self.provider.app_config,
            session=self.session,
        )
        visible_children = content_api.get_all(
            self.content.content_id,
            CONTENT_TYPES.Any_SLUG,
            self.workspace,
        )

        for content in visible_children:
            content_path = '%s/%s' % (self.path, transform_to_display(content.get_label_as_file()))

            try:
                if content.type == CONTENT_TYPES.Folder.slug:
                    members.append(
                        FolderResource(
                            path=content_path,
                            environ=self.environ,
                            workspace=self.workspace,
                            content=content,
                            user=self.user,
                            session=self.session,
                        )
                    )
                elif content.type == CONTENT_TYPES.File.slug:
                    self._file_count += 1
                    members.append(
                        FileResource(
                            path=content_path,
                            environ=self.environ,
                            content=content,
                            user=self.user,
                            session=self.session,
                        ))
                else:
                    self._file_count += 1
                    members.append(
                        OtherFileResource(
                            path=content_path,
                            environ=self.environ,
                            content=content,
                            user=self.user,
                            session=self.session,
                        ))
            except NotImplementedError as exc:
                pass
            # except Exception as exc:
            #     logger.exception(
            #         'Unable to construct member {}'.format(
            #             content_path,
            #         ),
            #         exc_info=True,
            #     )

        if self._file_count > 0 and self.provider.show_history():
            members.append(
                HistoryFolderResource(
                    path=self.path + '/' + ".history",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    type=HistoryType.Standard,
                    user=self.user,
                    session=self.session,
                )
            )

        if self.provider.show_delete():
            members.append(
                DeletedFolderResource(
                    path=self.path + '/' + ".deleted",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    user=self.user,
                    session=self.session,
                )
            )

        if self.provider.show_archive():
            members.append(
                ArchivedFolderResource(
                    path=self.path + '/' + ".archived",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    user=self.user,
                    session=self.session,
                )
            )

        return members

# TODO - G.M - 02-05-2018 - Check these object (History/Deleted/Archived Folder)
# Those object are now not in used by tracim and also not tested,


class HistoryFolderResource(FolderResource):
    """
    A virtual resource which contains a sub-folder for every files (DAVNonCollection) contained in the parent
    folder
    """
    
    def __init__(self,
                 path,
                 environ,
                 workspace: Workspace,
                 user: User,
                 session: Session,
                 content: Content=None,
                 type: str=HistoryType.Standard
    ) -> None:
        super(HistoryFolderResource, self).__init__(
            path=path,
            environ=environ,
            workspace=workspace,
            content=content,
            user=user,
            session=session,
        )

        self._is_archived = type == HistoryType.Archived
        self._is_deleted = type == HistoryType.Deleted

        self.content_api = ContentApi(
            current_user=self.user,
            show_archived=self._is_archived,
            show_deleted=self._is_deleted,
            session=self.session,
            config=self.provider.app_config,
        )

    def __repr__(self) -> str:
        return "<DAVCollection: HistoryFolderResource (%s)>" % self.content.file_name

    def getCreationDate(self) -> float:
        return mktime(datetime.now().timetuple())

    def getDisplayName(self) -> str:
        return '.history'

    def getLastModified(self) -> float:
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label: str) -> _DAVResource:
        content = self.content_api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self.content
        )

        return HistoryFileFolderResource(
            path='%s/%s' % (self.path, content.get_label_as_file()),
            environ=self.environ,
            content=content,
            session=self.session,
            user=self.user,
        )

    def getMemberNames(self) -> [str]:
        ret = []

        content_id = None if self.content is None else self.content.id
        for content in self.content_api.get_all(content_id, CONTENT_TYPES.Any_SLUG, self.workspace):
            if (self._is_archived and content.is_archived or
                self._is_deleted and content.is_deleted or
                not (content.is_archived or self._is_archived or content.is_deleted or self._is_deleted))\
                    and content.type != CONTENT_TYPES.Folder.slug:
                ret.append(content.get_label_as_file())

        return ret

    def createEmptyResource(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def handleDelete(self):
        return True

    def handleCopy(self, destPath: str, depthInfinity):
        return True

    def handleMove(self, destPath: str):
        return True

    def getMemberList(self) -> [_DAVResource]:
        members = []
        
        if self.content:
            children = self.content.children
        else:
            children = self.content_api.get_all(False, CONTENT_TYPES.Any_SLUG, self.workspace)
        
        for content in children:
            if content.is_archived == self._is_archived and content.is_deleted == self._is_deleted:
                members.append(HistoryFileFolderResource(
                    path='%s/%s' % (self.path, content.get_label_as_file()),
                    environ=self.environ,
                    content=content,
                    user=self.user,
                    session=self.session,
                ))

        return members


class DeletedFolderResource(HistoryFolderResource):
    """
    A virtual resources which exists for every folder or workspaces which contains their deleted children
    """

    def __init__(
            self,
            path: str,
            environ: dict,
            workspace: Workspace,
            user: User,
            session: Session,
            content: Content=None
    ):
        super(DeletedFolderResource, self).__init__(
            path=path,
            environ=environ,
            workspace=workspace,
            user=user,
            content=content,
            session=session,
            type=HistoryType.Deleted
        )

        self._file_count = 0

    def __repr__(self):
        return "<DAVCollection: DeletedFolderResource (%s)" % self.content.file_name

    def getCreationDate(self) -> float:
        return mktime(datetime.now().timetuple())

    def getDisplayName(self) -> str:
        return '.deleted'

    def getLastModified(self) -> float:
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label) -> _DAVResource:

        content = self.content_api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self.content
        )

        return self.provider.getResourceInst(
            path='%s/%s' % (self.path, transform_to_display(content.get_label_as_file())),
            environ=self.environ
            )

    def getMemberNames(self) -> [str]:
        retlist = []

        if self.content:
            children = self.content.children
        else:
            children = self.content_api.get_all(False, CONTENT_TYPES.Any_SLUG, self.workspace)

        for content in children:
            if content.is_deleted:
                retlist.append(content.get_label_as_file())

                if content.type != CONTENT_TYPES.Folder.slug:
                    self._file_count += 1

        return retlist

    def getMemberList(self) -> [_DAVResource]:
        members = []

        if self.content:
            children = self.content.children
        else:
            children = self.content_api.get_all(False, CONTENT_TYPES.Any_SLUG, self.workspace)

        for content in children:
            if content.is_deleted:
                content_path = '%s/%s' % (self.path, transform_to_display(content.get_label_as_file()))

                if content.type == CONTENT_TYPES.Folder.slug:
                    members.append(
                        FolderResource(
                            content_path,
                            self.environ,
                            self.workspace,
                            content,
                            user=self.user,
                            session=self.session,
                        ))
                elif content.type == CONTENT_TYPES.File.slug:
                    self._file_count += 1
                    members.append(
                        FileResource(
                            content_path,
                            self.environ,
                            content,
                            user=self.user,
                            session=self.session,
                        )
                    )
                else:
                    self._file_count += 1
                    members.append(
                        OtherFileResource(
                            content_path,
                            self.environ,
                            content,
                            user=self.user,
                            session=self.session,
                    ))

        if self._file_count > 0 and self.provider.show_history():
            members.append(
                HistoryFolderResource(
                    path=self.path + '/' + ".history",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    user=self.user,
                    type=HistoryType.Standard,
                    session=self.session,
                )
            )

        return members


class ArchivedFolderResource(HistoryFolderResource):
    """
    A virtual resources which exists for every folder or workspaces which contains their archived children
    """
    def __init__(
            self,
            path: str,
            environ: dict,
            workspace: Workspace,
            user: User,
            session: Session,
            content: Content=None
    ):
        super(ArchivedFolderResource, self).__init__(
            path=path,
            environ=environ,
            workspace=workspace,
            user=user,
            content=content,
            session=session,
            type=HistoryType.Archived
        )

        self._file_count = 0

    def __repr__(self) -> str:
        return "<DAVCollection: ArchivedFolderResource (%s)" % self.content.file_name

    def getCreationDate(self) -> float:
        return mktime(datetime.now().timetuple())

    def getDisplayName(self) -> str:
        return '.archived'

    def getLastModified(self) -> float:
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label) -> _DAVResource:

        content = self.content_api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self.content
        )

        return self.provider.getResourceInst(
            path=self.path + '/' + transform_to_display(content.get_label_as_file()),
            environ=self.environ
        )

    def getMemberNames(self) -> [str]:
        retlist = []

        for content in self.content_api.get_all_with_filter(
                self.content if self.content is None else self.content.id, CONTENT_TYPES.Any_SLUG):
            retlist.append(content.get_label_as_file())

            if content.type != CONTENT_TYPES.Folder.slug:
                self._file_count += 1

        return retlist

    def getMemberList(self) -> [_DAVResource]:
        members = []

        if self.content:
            children = self.content.children
        else:
            children = self.content_api.get_all(False, CONTENT_TYPES.Any_SLUG, self.workspace)

        for content in children:
            if content.is_archived:
                content_path = '%s/%s' % (self.path, transform_to_display(content.get_label_as_file()))

                if content.type == CONTENT_TYPES.Folder.slug:
                    members.append(
                        FolderResource(
                            content_path,
                            self.environ,
                            self.workspace,
                            content,
                            user=self.user,
                            session=self.session,
                        ))
                elif content.type == CONTENT_TYPES.File.slug:
                    self._file_count += 1
                    members.append(
                        FileResource(
                            content_path,
                            self.environ,
                            content,
                            user=self.user,
                            session=self.session,
                        ))
                else:
                    self._file_count += 1
                    members.append(
                        OtherFileResource(
                            content_path,
                            self.environ,
                            content,
                            user=self.user,
                            session=self.session,
                        ))

        if self._file_count > 0 and self.provider.show_history():
            members.append(
                HistoryFolderResource(
                    path=self.path + '/' + ".history",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    user=self.user,
                    type=HistoryType.Standard,
                    session=self.session,
                )
            )

        return members


class HistoryFileFolderResource(HistoryFolderResource):
    """
    A virtual resource that contains for a given content (file/page/thread) all its revisions
    """

    def __init__(
            self,
            path: str,
            environ: dict,
            content: Content,
            user: User,
            session: Session
    ) -> None:
        super(HistoryFileFolderResource, self).__init__(
            path=path,
            environ=environ,
            workspace=content.workspace,
            content=content,
            user=user,
            session=session,
            type=HistoryType.All,
        )

    def __repr__(self) -> str:
        return "<DAVCollection: HistoryFileFolderResource (%s)" % self.content.file_name

    def getDisplayName(self) -> str:
        return self.content.get_label_as_file()

    def createCollection(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def getMemberNames(self) -> [int]:
        """
        Usually we would return a string, but here as we're working with different
        revisions of the same content, we'll work with revision_id
        """
        ret = []

        for content in self.content.revisions:
            ret.append(content.revision_id)

        return ret

    def getMember(self, item_id) -> DAVNonCollection:

        revision = self.content_api.get_one_revision(item_id)

        left_side = '%s/(%d - %s) ' % (self.path, revision.revision_id, revision.revision_type)

        if self.content.type == CONTENT_TYPES.File.slug:
            return HistoryFileResource(
                path='%s%s' % (left_side, transform_to_display(revision.file_name)),
                environ=self.environ,
                content=self.content,
                content_revision=revision,
                session=self.session,
                user=self.user,
            )
        else:
            return HistoryOtherFile(
                path='%s%s' % (left_side, transform_to_display(revision.get_label_as_file())),
                environ=self.environ,
                content=self.content,
                content_revision=revision,
                session=self.session,
                user=self.user,
            )

    def getMemberList(self) -> [_DAVResource]:
        members = []

        for content in self.content.revisions:

            left_side = '%s/(%d - %s) ' % (self.path, content.revision_id, content.revision_type)

            if self.content.type == CONTENT_TYPES.File.slug:
                members.append(HistoryFileResource(
                    path='%s%s' % (left_side, transform_to_display(content.file_name)),
                    environ=self.environ,
                    content=self.content,
                    content_revision=content,
                    user=self.user,
                    session=self.session,
                    )
                )
            else:
                members.append(HistoryOtherFile(
                    path='%s%s' % (left_side, transform_to_display(content.file_name)),
                    environ=self.environ,
                    content=self.content,
                    content_revision=content,
                    user=self.user,
                    session=self.session,
                    )
                )

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
            user: User,
            session: Session,
    ) -> None:
        super(FileResource, self).__init__(path, environ)

        self.content = content
        self.user = user
        self.session = session
        self.content_api = ContentApi(
            current_user=self.user,
            config=self.provider.app_config,
            session=self.session,
        )

        # this is the property that windows client except to check if the file is read-write or read-only,
        # but i wasn't able to set this property so you'll have to look into it >.>
        # self.setPropertyValue('Win32FileAttributes', '00000021')

    def __repr__(self) -> str:
        return "<DAVNonCollection: FileResource (%d)>" % self.content.revision_id

    def getContentLength(self) -> int:
        return self.content.depot_file.file.content_length

    def getContentType(self) -> str:
        return self.content.file_mimetype

    def getCreationDate(self) -> float:
        return mktime(self.content.created.timetuple())

    def getDisplayName(self) -> str:
        return self.content.file_name

    def getLastModified(self) -> float:
        return mktime(self.content.updated.timetuple())

    def getContent(self) -> typing.BinaryIO:
        filestream = compat.BytesIO()
        filestream.write(self.content.depot_file.file.read())
        filestream.seek(0)

        return filestream

    def beginWrite(self, contentType: str=None) -> FakeFileStream:
        return FakeFileStream(
            content=self.content,
            content_api=self.content_api,
            file_name=self.content.get_label_as_file(),
            workspace=self.content.workspace,
            path=self.path,
            session=self.session,
        )

    def moveRecursive(self, destpath):
        """As we support recursive move, copymovesingle won't be called, though with copy it'll be called
            but i have to check if the client ever call that function..."""
        destpath = normpath(destpath)

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

        with new_revision(
            content=self.content,
            tm=transaction.manager,
            session=self.session,
        ):
            # INFO - G.M - 2018-03-09 - First, renaming file if needed
            if basename(destpath) != self.getDisplayName():
                new_given_file_name = transform_to_bdd(basename(destpath))
                new_file_name, new_file_extension = \
                    os.path.splitext(new_given_file_name)

                self.content_api.update_content(
                    self.content,
                    new_file_name,
                )
                self.content.file_extension = new_file_extension
                self.content_api.save(self.content)

            # INFO - G.M - 2018-03-09 - Moving file if needed
            workspace_api = WorkspaceApi(
                current_user=self.user,
                session=self.session,
                config=self.provider.app_config,
                )
            content_api = ContentApi(
                current_user=self.user,
                session=self.session,
                config=self.provider.app_config
            )

            destination_workspace = self.provider.get_workspace_from_path(
                destpath,
                workspace_api,
            )
            destination_parent = self.provider.get_parent_from_path(
                destpath,
                content_api,
                destination_workspace,
            )
            if destination_parent != parent or destination_workspace != workspace:  # nopep8
                #  INFO - G.M - 12-03-2018 - Avoid moving the file "at the same place"  # nopep8
                #  if the request does not result in a real move.
                self.content_api.move(
                    item=self.content,
                    new_parent=destination_parent,
                    must_stay_in_same_workspace=False,
                    new_workspace=destination_workspace
                )

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

            raise NotImplemented

        new_file_name = None
        new_file_extension = None

        # Inspect destpath
        if basename(destpath) != self.getDisplayName():
            new_given_file_name = transform_to_bdd(basename(destpath))
            new_file_name, new_file_extension = \
                os.path.splitext(new_given_file_name)

        workspace_api = WorkspaceApi(
            current_user=self.user,
            session=self.session,
            config=self.provider.app_config,
        )
        content_api = ContentApi(
            current_user=self.user,
            session=self.session,
            config=self.provider.app_config
        )
        destination_workspace = self.provider.get_workspace_from_path(
            destpath,
            workspace_api,
        )
        destination_parent = self.provider.get_parent_from_path(
            destpath,
            content_api,
            destination_workspace,
        )
        workspace = self.content.workspace
        parent = self.content.parent
        new_content = self.content_api.copy(
            item=self.content,
            new_label=new_file_name,
            new_parent=destination_parent,
        )
        self.content_api.copy_children(self.content, new_content)
        transaction.commit()

    def supportRecursiveMove(self, destPath):
        return True

    def delete(self):
        ManageActions(
            action_type=ActionDescription.DELETION,
            api=self.content_api,
            content=self.content,
            session=self.session,
        ).action()


class HistoryFileResource(FileResource):
    """
    A virtual resource corresponding to a specific tracim's revision's file
    """
    def __init__(self, path: str, environ: dict, content: Content, user: User, session: Session, content_revision: ContentRevisionRO):
        super(HistoryFileResource, self).__init__(path, environ, content, user=user, session=session)
        self.content_revision = content_revision

    def __repr__(self) -> str:
        return "<DAVNonCollection: HistoryFileResource (%s-%s)" % (self.content.content_id, self.content.file_name)

    def getDisplayName(self) -> str:
        left_side = '(%d - %s) ' % (self.content_revision.revision_id, self.content_revision.revision_type)
        return '%s%s' % (left_side, transform_to_display(self.content_revision.file_name))

    def getContent(self):
        filestream = compat.BytesIO()
        filestream.write(self.content_revision.depot_file.file.read())
        filestream.seek(0)

        return filestream

    def getContentLength(self):
        return self.content_revision.depot_file.file.content_length

    def getContentType(self) -> str:
        return self.content_revision.file_mimetype

    def beginWrite(self, contentType=None):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def copyMoveSingle(self, destpath, ismove):
        raise DAVError(HTTP_FORBIDDEN)


class OtherFileResource(FileResource):
    """
    FileResource resource corresponding to tracim's page and thread
    """
    def __init__(self, path: str, environ: dict, content: Content, user:User, session: Session):
        super(OtherFileResource, self).__init__(path, environ, content, user=user, session=session)

        self.content_revision = self.content.revision

        self.content_designed = self.design()

        # workaround for consistent request as we have to return a resource with a path ending with .html
        # when entering folder for windows, but only once because when we select it again it would have .html.html
        # which is no good
        if not self.path.endswith('.html'):
            self.path += '.html'

    def getDisplayName(self) -> str:
        return self.content.get_label_as_file()

    def getPreferredPath(self):
        return self.path

    def __repr__(self) -> str:
        return "<DAVNonCollection: OtherFileResource (%s)" % self.content.file_name

    def getContentLength(self) -> int:
        return len(self.content_designed)

    def getContentType(self) -> str:
        return 'text/html'

    def getContent(self):
        filestream = compat.BytesIO()

        filestream.write(bytes(self.content_designed, 'utf-8'))
        filestream.seek(0)
        return filestream

    def design(self):
        if self.content.type == CONTENT_TYPES.Page.slug:
            return designPage(self.content, self.content_revision)
        else:
            return designThread(
                self.content,
                self.content_revision,
                self.content_api.get_all(self.content.content_id, CONTENT_TYPES.Comment.slug)
            )


class HistoryOtherFile(OtherFileResource):
    """
    A virtual resource corresponding to a specific tracim's revision's page and thread
    """
    def __init__(self,
                 path: str,
                 environ: dict,
                 content: Content,
                 user:User,
                 content_revision: ContentRevisionRO,
                 session: Session):
        super(HistoryOtherFile, self).__init__(
            path,
            environ,
            content,
            user=user,
            session=session
        )
        self.content_revision = content_revision
        self.content_designed = self.design()

    def __repr__(self) -> str:
        return "<DAVNonCollection: HistoryOtherFile (%s-%s)" % (self.content.file_name, self.content.id)

    def getDisplayName(self) -> str:
        left_side = '(%d - %s) ' % (self.content_revision.revision_id, self.content_revision.revision_type)
        return '%s%s' % (left_side, transform_to_display(self.content_revision.get_label_as_file()))

    def getContent(self):
        filestream = compat.BytesIO()

        filestream.write(bytes(self.content_designed, 'utf-8'))
        filestream.seek(0)

        return filestream

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def copyMoveSingle(self, destpath, ismove):
        raise DAVError(HTTP_FORBIDDEN)
