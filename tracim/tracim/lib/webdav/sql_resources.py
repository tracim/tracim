# coding: utf8
import transaction
import re
from datetime import datetime
from time import mktime
from os.path import normpath, dirname, basename
import mimetypes

from tracim.lib.content import ContentApi
from tracim.lib.user import UserApi
from tracim.lib.webdav import HistoryType
from tracim.lib.webdav import FakeFileStream
from tracim.lib.workspace import WorkspaceApi
from tracim.model import data, new_revision
from tracim.model.data import Content, ActionDescription
from tracim.model.data import ContentType
from tracim.lib.webdav.design import designThread, designPage

from wsgidav import compat
from wsgidav.dav_error import DAVError, HTTP_FORBIDDEN
from wsgidav.dav_provider import DAVCollection, DAVNonCollection
from wsgidav.dav_provider import _DAVResource

from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound

class Manage(object):
    """Objet qui sert à encapsuler l'exécution des actions de l'api archive/delete..."""
    def __init__(self, action_type: str, api: ContentApi, content: Content):
        self.content_api = api
        self.content = content

        self._actions = {
            ActionDescription.ARCHIVING: self.content_api.archive,
            ActionDescription.DELETION: self.content_api.delete,
            ActionDescription.UNARCHIVING: self.content_api.unarchive,
            ActionDescription.UNDELETION: self.content_api.undelete
        }

        self._to_name = {
            ActionDescription.ARCHIVING: 'archived',
            ActionDescription.DELETION: 'deleted'
        }

        self._type = action_type
        self._new_name = self.make_name()

    def action(self):
        try:
            self.content_api.get_one_by_label_and_parent(self._new_name, self.content.parent, self.content.workspace)
            raise DAVError(HTTP_FORBIDDEN)
        except NoResultFound:
            """Exécute l'action"""
            with new_revision(self.content):
                self.content_api.update_content(self.content, self._new_name)
                self._actions[self._type](self.content)
                self.content_api.save(self.content, self._type)

            transaction.commit()

    def make_name(self):
        """Créer le nouveau nom : rajoute de - archive date / retrait de - archive date suivant l'action"""
        new_name = self.content.get_label()
        extension = ''
        is_file_name = self.content.label == ''


        if is_file_name:
            extension = re.search(r'(\.[^.]+)$', new_name).group(0)
            new_name = re.sub(r'(\.[^.]+)$', '', new_name)

        if self._type in [ActionDescription.ARCHIVING, ActionDescription.DELETION]:
            new_name += ' - %s the %s' % (self._to_name[self._type], datetime.now().strftime('%d-%m-%Y at %H:%M'))
        else:
            new_name = re.sub(r'( - (%s|%s) the .*)$' % (self._to_name[ActionDescription.DELETION], self._to_name[ActionDescription.ARCHIVING]), '', new_name)

        new_name += extension

        return new_name


class Root(DAVCollection):
    """Root ressource that represents tracim's home, which contains all workspaces"""

    def __init__(self, path: str, environ: dict):
        super(Root, self).__init__(path, environ)

        self.user = UserApi(None).get_one_by_email(environ['http_authenticator.username'])
        self.workspace_api = WorkspaceApi(self.user)

    def __repr__(self) -> str:
        return '<DAVCollection: Root>'

    def getMemberNames(self) -> [str]:
        """
        This method returns the names (here workspace's labels) of all its children
        """
        return [workspace.label for workspace in self.workspace_api.get_all()]

    def getMember(self, label: str) -> DAVCollection:
        """
        This method returns the child Workspace that corresponds to a given name
        """
        try:
            workspace = self.workspace_api.get_one_by_label(label)
            workspace_path = '%s%s%s' % (self.path, '' if self.path == '/' else '/', self.provider.transform_to_display(workspace.label))

            return Workspace(workspace_path, self.environ, workspace)
        except AttributeError:
            return None

    def createEmptyResource(self, name: str):
        """
        This method is called whenever the user wants to create a DAVNonCollection resource (files in our case).

        There we don't allow to create files at the root;
        only workspaces (thus collection) can be created."""
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, name: str):
        """
        This method is called whenever the user wants to create a DAVCollection resource as a child (in our case,
        we create workspaces as this is the root).

        [For now] we don't allow to create new workspaces through
        webdav client. Though if we come to allow it, deleting the error's raise will
        make it possible."""
        # TODO : remove comment here
        # raise DAVError(HTTP_FORBIDDEN)

        new_workspace = self.workspace_api.create_workspace(name)
        self.workspace_api.save(new_workspace)

        workspace_path = '%s%s%s' % (
        self.path, '' if self.path == '/' else '/', self.provider.transform_to_display(new_workspace.label))

        transaction.commit()
        return Workspace(workspace_path, self.environ, new_workspace)

    def getMemberList(self):
        # De base on appellerait getMemberNames puis getMember, mais ça fait trop de requête alors on optimise :
        # on fait une seule requête en BDD; get_all et voilà !

        members = []
        for workspace in self.workspace_api.get_all():
            workspace_path = '%s%s%s' % (self.path, '' if self.path == '/' else '/', workspace.label)
            members.append(Workspace(workspace_path, self.environ, workspace))

        return members


class Workspace(DAVCollection):
    """Workspace resource corresponding to tracim's workspaces.
    Direct children can only be folders, though files might come later on"""

    def __init__(self, path: str, environ: dict, workspace: data.Workspace):
        super(Workspace, self).__init__(path, environ)

        self.workspace = workspace
        self.content = None
        self.user = UserApi(None).get_one_by_email(environ['http_authenticator.username'])

        self.content_api = ContentApi(self.user, show_temporary=True)

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
            if content.type != ContentType.Folder:
                self._file_count += 1
            retlist.append(content.get_label())

        return retlist

    def getMember(self, content_label: str) -> _DAVResource:

        return self.provider.getResourceInst(
            '%s/%s' % (self.path, self.provider.transform_to_display(content_label)),
            self.environ
        )

    def createEmptyResource(self, file_name: str):
        """[For now] we don't allow to create files right under workspaces.
        Though if we come to allow it, deleting the error's raise will make it possible."""
        # TODO : remove commentary here raise DAVError(HTTP_FORBIDDEN)
        if '/.deleted/' in self.path or '/.archived/' in self.path:
            raise DAVError(HTTP_FORBIDDEN)

        return FakeFileStream(
            file_name=file_name,
            content_api=self.content_api,
            workspace=self.workspace,
            content=None,
            parent=self.content
        )

    def createCollection(self, label: str) -> 'Folder':
        """Create a new folder for the current workspace. As it's not possible for the user to choose
        which types of content are allowed in this folder, we allow allow all of them.

        This method return the DAVCollection created."""

        if '/.deleted/' in self.path or '/.archived/' in self.path:
            raise DAVError(HTTP_FORBIDDEN)

        folder = self.content_api.create(
            content_type=ContentType.Folder,
            workspace=self.workspace,
            label=label,
            parent=self.content
        )

        subcontent = dict(
            folder=True,
            thread=True,
            file=True,
            page=True
        )

        self.content_api.set_allowed_content(folder, subcontent)
        self.content_api.save(folder)

        transaction.commit()

        return Folder('%s/%s' % (self.path, self.provider.transform_to_display(label)),
                      self.environ, folder,
                      self.workspace)

    def delete(self):
        """For now, it is not possible to delete a workspace through the webdav client."""
        raise DAVError(HTTP_FORBIDDEN)

    def supportRecursiveMove(self, destpath):
        return True

    def moveRecursive(self, destpath):
        if dirname(normpath(destpath)) == self.provider.root:
            self.workspace.label = basename(normpath(destpath))
            transaction.commit()
        else:
            raise DAVError(HTTP_FORBIDDEN)

    def getMemberList(self) -> [_DAVResource]:
        members = []
        parent_id = None if self.content is None else self.content.id

        childs = self.content_api.get_all(parent_id, ContentType.Any, self.workspace)

        for content in childs:
            content_path = '%s/%s' % (self.path, self.provider.transform_to_display(content.get_label()))

            if content.type == ContentType.Folder:
                members.append(Folder(content_path, self.environ, content, self.workspace))
            elif content.type == ContentType.File:
                self._file_count += 1
                members.append(File(content_path, self.environ, content))
            else:
                self._file_count += 1
                members.append(OtherFile(content_path, self.environ, content))

        if self._file_count > 0 and self.provider.show_history():
            members.append(
                HistoryFolder(
                    path=self.path + '/' + ".history",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    type=HistoryType.Standard
                )
            )

        if self.provider.show_delete():
            members.append(
                DeletedFolder(
                    path=self.path + '/' + ".deleted",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace
                )
            )

        if self.provider.show_archive():
            members.append(
                ArchivedFolder(
                    path=self.path + '/' + ".archived",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace
                )
            )
        return members


class Folder(Workspace):
    """Folder resource corresponding to tracim's folders.
    Direct children can only be either folder, files, pages or threads
    By default when creating new folders, we allow them to contain all types of content"""

    def __init__(self, path: str, environ: dict, content: data.Content, workspace: data.Workspace):
        super(Folder, self).__init__(path, environ, workspace)

        self.content = content

    def __repr__(self) -> str:
        return "<DAVCollection: Folder (%s)>" % self.content.label

    def getCreationDate(self) -> float:
        return mktime(self.content.created.timetuple())

    def getDisplayName(self) -> str:
        return self.provider.transform_to_display(self.content.get_label())

    def getLastModified(self) -> float:
        return mktime(self.content.updated.timetuple())

    def delete(self):
        Manage(ActionDescription.DELETION, self.content_api, self.content).action()

    def supportRecursiveMove(self, destpath: str):
        return True

    def moveRecursive(self, destpath: str):
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
                Manage(
                    ActionDescription.UNDELETION if self.content.is_deleted else ActionDescription.UNARCHIVING,
                    self.content_api,
                    self.content
                ).action()
            else:
                invalid_path = True
        # if the content is not deleted / archived, check if we're trying to delete / archive it by
        # moving it to a .deleted / .archived folder
        elif basename(dirname(destpath)) in ['.deleted', '.archived']:
            # same test as above ^
            dest_path = re.sub(r'/\.(deleted|archived)', '', destpath)

            if dest_path == self.path:
                Manage(
                    ActionDescription.DELETION if '.deleted' in destpath else ActionDescription.ARCHIVING,
                    self.content_api,
                    self.content
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
        parent = self.provider.get_parent_from_path(
            normpath(destpath),
            self.content_api,
            WorkspaceApi(self.user)
        )

        workspace = self.provider.get_workspace_from_path(
            normpath(destpath),
            WorkspaceApi(self.user)
        )

        with new_revision(self.content):
            if basename(destpath) != self.getDisplayName():
                self.content_api.update_content(self.content, self.provider.transform_to_bdd(basename(destpath)))
                self.content_api.save(self.content)
            else:
                try:
                    workspace_id = parent.workspace.workspace_id
                except AttributeError:
                    workspace_id = self.provider.get_workspace_from_path(
                        destpath, WorkspaceApi(self.user)
                    ).workspace_id

                if workspace_id == self.content.workspace.workspace_id:
                    self.content_api.move(self.content, parent)
                else:
                    try:
                        self.content_api.move_recursively(self.content, parent, parent.workspace)
                    except AttributeError:
                        self.content_api.move_recursively(self.content, parent, workspace)

        transaction.commit()


class HistoryFolder(Folder):

    def __init__(self, path, environ, workspace: data.Workspace, type: str, content: data.Content=None):
        super(HistoryFolder, self).__init__(path, environ, content, workspace)

        self._is_archived = type == HistoryType.Archived
        self._is_deleted = type == HistoryType.Deleted

        self.content_api = ContentApi(
            current_user=self.user,
            show_archived=self._is_archived,
            show_deleted=self._is_deleted
        )

    def __repr__(self) -> str:
        return "<DAVCollection: HistoryFolder (%s)>" % self.content.file_name

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

        return HistoryFileFolder(
            path='%s/%s' % (self.path, content.get_label()),
            environ=self.environ,
            content=content)

    def getMemberNames(self) -> [str]:
        ret = []

        content_id = None if self.content is None else self.content.id
        for content in self.content_api.get_all(content_id, ContentType.Any, self.workspace):
            if (self._is_archived and content.is_archived or
                self._is_deleted and content.is_deleted or
                not (content.is_archived or self._is_archived or content.is_deleted or self._is_deleted))\
                    and content.type != ContentType.Folder:
                ret.append(content.get_label())

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

        parent_id = None if self.content is None else self.content.id

        for content in self.content_api.get_all_with_filter(parent_id, ContentType.Any, self.workspace):
            members.append(HistoryFileFolder(
                path='%s/%s' % (self.path, content.get_label()),
                environ=self.environ,
                content=content))

        return members


class DeletedFolder(HistoryFolder):
    def __init__(self, path: str, environ: dict, workspace: data.Workspace, content: data.Content=None):
        super(DeletedFolder, self).__init__(path, environ, workspace, HistoryType.Deleted, content)

        self._file_count = 0

    def __repr__(self):
        return "<DAVCollection: DeletedFolder (%s)" % self.content.file_name

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
            path='%s/%s' % (self.path, self.provider.transform_to_display(content.get_label())),
            environ=self.environ
            )

    def getMemberNames(self) -> [str]:
        retlist = []

        for content in self.content_api.get_all(
                parent_id=self.content if self.content is None else self.content.id, content_type=ContentType.Any):
            if content.is_deleted:
                retlist.append(content.get_label())

                if content.type != ContentType.Folder:
                    self._file_count += 1

        return retlist

    def createEmptyResource(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def getMemberList(self) -> [_DAVResource]:
        members = []

        parent_id = None if self.content is None else self.content.id

        for content in self.content_api.get_all_with_filter(parent_id, ContentType.Any, self.workspace):
            content_path = '%s/%s' % (self.path, self.provider.transform_to_display(content.get_label()))

            if content.type == ContentType.Folder:
                members.append(Folder(content_path, self.environ, content, self.workspace))
            elif content.type == ContentType.File:
                self._file_count += 1
                members.append(File(content_path, self.environ, content))
            else:
                self._file_count += 1
                members.append(OtherFile(content_path, self.environ, content))

        if self._file_count > 0 and self.provider.show_history():
            members.append(
                HistoryFolder(
                    path=self.path + '/' + ".history",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    type=HistoryType.Standard
                )
            )

        return members


class ArchivedFolder(HistoryFolder):
    def __init__(self, path: str, environ: dict, workspace: data.Workspace, content: data.Content=None):
        super(ArchivedFolder, self).__init__(path, environ, workspace, HistoryType.Archived, content)

        self._file_count = 0

    def __repr__(self) -> str:
        return "<DAVCollection: ArchivedFolder (%s)" % self.content.file_name

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
            path=self.path + '/' + self.provider.transform_to_display(content.get_label()),
            environ=self.environ
        )

    def getMemberNames(self) -> [str]:
        retlist = []

        for content in self.content_api.get_all_with_filter(
                self.content if self.content is None else self.content.id, ContentType.Any):
            retlist.append(content.get_label())

            if content.type != ContentType.Folder:
                self._file_count += 1

        return retlist

    def createEmptyResource(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def getMemberList(self) -> [_DAVResource]:
        members = []

        parent_id = None if self.content is None else self.content.id

        for content in self.content_api.get_all_with_filter(parent_id, ContentType.Any, self.workspace):
            content_path = '%s/%s' % (self.path, self.provider.transform_to_display(content.get_label()))

            if content.type == ContentType.Folder:
                members.append(Folder(content_path, self.environ, content, self.workspace))
            elif content.type == ContentType.File:
                self._file_count += 1
                members.append(File(content_path, self.environ, content))
            else:
                self._file_count += 1
                members.append(OtherFile(content_path, self.environ, content))

        if self._file_count > 0 and self.provider.show_history():
            members.append(
                HistoryFolder(
                    path=self.path + '/' + ".history",
                    environ=self.environ,
                    content=self.content,
                    workspace=self.workspace,
                    type=HistoryType.Standard
                )
            )

        return members


class HistoryFileFolder(HistoryFolder):
    def __init__(self, path: str, environ: dict, content: data.Content):
        super(HistoryFileFolder, self).__init__(path, environ, content.workspace, HistoryType.All, content)

    def __repr__(self) -> str:
        return "<DAVCollection: HistoryFileFolder (%s)" % self.content.file_name

    def getDisplayName(self) -> str:
        return self.content.get_label()

    def createCollection(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def createEmptyResource(self, name) ->FakeFileStream:
        return FakeFileStream(
            content=self.content,
            content_api=self.content_api,
            file_name=name,
            workspace=self.content.workspace
        )

    def getMemberNames(self) -> [int]:
        """ Usually we would return a string, but here as it can be the same name because that's history, we get the id"""
        ret = []

        for content in self.content.revisions:
            ret.append(content.revision_id)

        return ret

    def getMember(self, item_id) -> DAVCollection:

        revision = self.content_api.get_one_revision(item_id)

        left_side = '%s/(%d - %s) ' % (self.path, revision.revision_id, revision.revision_type)

        if self.content.type == ContentType.File:
            return HistoryFile(
                path='%s%s' % (left_side, self.provider.transform_to_display(revision.file_name)),
                environ=self.environ,
                content=self.content,
                content_revision=revision)
        else:
            return HistoryOtherFile(
                path='%s%s' % (left_side, self.provider.transform_to_display(revision.get_label())),
                environ=self.environ,
                content=self.content,
                content_revision=revision)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def getMemberList(self) -> [_DAVResource]:
        members = []

        for content in self.content.revisions:

            left_side = '%s/(%d - %s) ' % (self.path, content.revision_id, content.revision_type)

            if self.content.type == ContentType.File:
                members.append(HistoryFile(
                    path='%s%s' % (left_side, self.provider.transform_to_display(content.file_name)),
                    environ=self.environ,
                    content=self.content,
                    content_revision=content)
                )
            else:
                members.append(HistoryOtherFile(
                    path='%s%s' % (left_side, self.provider.transform_to_display(content.file_name)),
                    environ=self.environ,
                    content=self.content,
                    content_revision=content)
                )

        return members


class File(DAVNonCollection):
    def __init__(self, path: str, environ: dict, content: Content):
        super(File, self).__init__(path, environ)

        self.content = content
        self.user = UserApi(None).get_one_by_email(environ['http_authenticator.username'])
        self.content_api = ContentApi(self.user)


    def getPreferredPath(self):
        fix_txt = '.txt' if self.getContentType() == 'text/plain' else mimetypes.guess_extension(self.getContentType())

        if self.content.label == '' or self.path.endswith(fix_txt):
            return self.path
        else:
            return self.path + fix_txt

    def __repr__(self) -> str:
        return "<DAVNonCollection: File (%d)>" % self.content.revision_id

    def getContentLength(self) -> int:
        return len(self.content.file_content)

    def getContentType(self) -> str:
        return self.content.file_mimetype

    def getCreationDate(self) -> float:
        return mktime(self.content.created.timetuple())

    def getDisplayName(self) -> str:
        return self.content.get_label()

    def getLastModified(self) -> float:
        return mktime(self.content.updated.timetuple())

    def getContent(self):
        filestream = compat.BytesIO()
        filestream.write(self.content.file_content)
        filestream.seek(0)

        return filestream

    def beginWrite(self, contentType: str=None) -> FakeFileStream:
        return FakeFileStream(
            content=self.content,
            content_api=self.content_api,
            file_name=self.content.get_label(),
            workspace=self.content.workspace
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
                Manage(
                    ActionDescription.UNDELETION if self.content.is_deleted else ActionDescription.UNARCHIVING,
                    self.content_api,
                    self.content
                ).action()
            else:
                invalid_path = True
        # if the content is not deleted / archived, check if we're trying to delete / archive it by
        # moving it to a .deleted / .archived folder
        elif basename(dirname(destpath)) in ['.deleted', '.archived']:
            # same test as above ^
            dest_path = re.sub(r'/\.(deleted|archived)', '', destpath)

            if dest_path == self.path:
                Manage(
                    ActionDescription.DELETION if '.deleted' in destpath else ActionDescription.ARCHIVING,
                    self.content_api,
                    self.content
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

    def move_file(self, destpath):
        parent = self.provider.get_parent_from_path(
            normpath(destpath),
            self.content_api,
            WorkspaceApi(self.user)
        )

        workspace = self.provider.get_workspace_from_path(
            normpath(destpath),
            WorkspaceApi(self.user)
        )

        with new_revision(self.content):
            if basename(destpath) != self.getDisplayName():
                self.content_api.update_content(self.content, re.sub('\.[^\.]+$', '', self.provider.transform_to_bdd(basename(destpath))))
                self.content_api.save(self.content)
            else:
                self.content_api.move(
                    item=self.content,
                    new_parent=parent,
                    must_stay_in_same_workspace=False,
                    new_workspace=workspace
                )

        transaction.commit()

    def supportRecursiveMove(self, destPath):
        return True

    def delete(self):
        Manage(ActionDescription.DELETION, self.content_api, self.content).action()


class HistoryFile(File):
    def __init__(self, path: str, environ: dict, content: data.Content, content_revision: data.ContentRevisionRO):
        super(HistoryFile, self).__init__(path, environ, content)
        self.content_revision = content_revision

    def __repr__(self) -> str:
        return "<DAVNonCollection: HistoryFile (%s-%s)" % (self.content.content_id, self.content.file_name)

    def getDisplayName(self) -> str:
        left_side = '(%d - %s) ' % (self.content_revision.revision_id, self.content_revision.revision_type)
        return '%s%s' % (left_side, self.provider.transform_to_display(self.content_revision.file_name))

    def getContent(self):
        filestream = compat.BytesIO()
        filestream.write(self.content_revision.file_content)
        filestream.seek(0)

        return filestream

    def getContentLength(self):
        return len(self.content_revision.file_content)

    def getContentType(self) -> str:
        return self.content_revision.file_mimetype

    def beginWrite(self, contentType=None):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def handleDelete(self):
        return False

    def handleCopy(self, destpath, depth_infinity):
        return True

    def handleMove(self, destpath):
        return True

    def copyMoveSingle(self, destpath, ismove):
        raise DAVError(HTTP_FORBIDDEN)


class OtherFile(File):
    def __init__(self, path: str, environ: dict, content: data.Content):
        super(OtherFile, self).__init__(path, environ, content)

        self.content_revision = self.content.revision

        self.content_designed = self.design()

        # workaroung for consistent request as we have to return a resource with a path ending with .html
        # when entering folder for windows, but only once because when we select it again it would have .html.html
        # which is no good
        if not self.path.endswith('.html'):
            self.path += '.html'

    def getDisplayName(self) -> str:
        return self.content.get_label()

    def getPreferredPath(self):
        return self.path

    def __repr__(self) -> str:
        return "<DAVNonCollection: OtherFile (%s)" % self.content.file_name

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
        if self.content.type == ContentType.Page:
            return designPage(self.content, self.content_revision)
        else:
            return designThread(
                self.content,
                self.content_revision,
                self.content_api.get_all(self.content.content_id, ContentType.Comment)
            )


class HistoryOtherFile(OtherFile):
    def __init__(self, path: str, environ: dict, content: data.Content, content_revision: data.ContentRevisionRO):
        super(HistoryOtherFile, self).__init__(path, environ, content)
        self.content_revision = content_revision
        self.content_designed = self.design()

    def __repr__(self) -> str:
        return "<DAVNonCollection: HistoryOtherFile (%s-%s)" % (self.content.file_name, self.content.id)

    def getDisplayName(self) -> str:
        left_side = '(%d - %s) ' % (self.content_revision.revision_id, self.content_revision.revision_type)
        return '%s%s' % (left_side, self.provider.transform_to_display(self.content_revision.get_label()))

    def getContent(self):
        filestream = compat.BytesIO()

        filestream.write(bytes(self.content_designed, 'utf-8'))
        filestream.seek(0)

        return filestream

    def beginWrite(self, contentType=None):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def handleDelete(self):
        return True

    def handleCopy(self, destpath, depth_infinity):
        return True

    def handleMove(self, destpath):
        return True

    def copyMoveSingle(self, destpath, ismove):
        raise DAVError(HTTP_FORBIDDEN)

