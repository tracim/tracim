# coding: utf8
from datetime import datetime
from time import mktime

import transaction
from os.path import normpath, dirname, basename
from tracim.lib.content import ContentApi
from tracim.lib.webdav import HistoryType
from tracim.lib.webdav import FileStream
from tracim.lib.user import UserApi
from tracim.lib.workspace import WorkspaceApi
from wsgidav import compat
from wsgidav import util
from wsgidav.compat import PY3
from wsgidav.dav_error import DAVError, HTTP_FORBIDDEN
from wsgidav.dav_provider import DAVCollection, DAVNonCollection
from tracim.model import data, new_revision
from tracim.model.data import Content, ActionDescription
from tracim.model.data import ContentType
from wsgidav.dav_provider import _DAVResource

from tracim.lib.webdav.design import designThread, designPage

class Encapsuler(object):
    def __init__(self, type: str, api: ContentApi, content: Content):
        self._api = api
        self._content = content

        self._actions = {
            ActionDescription.ARCHIVING: self._api.archive,
            ActionDescription.DELETION: self._api.delete,
            ActionDescription.UNARCHIVING: self._api.unarchive,
            ActionDescription.UNDELETION: self._api.undelete
        }

        self._type = type

        self._new_name = self.make_name()

    def action(self):
        with new_revision(self._content):
            self._actions[self._type](self._content)

            if self._content.label == '':
                self._content.file_name = self._new_name
            else:
                self._content.label = self._new_name

            self._api.save(self._content, self._type)

        transaction.commit()

    def make_name(self):
        new_name = self._content.get_label()
        is_file_name = self._content.label == ''
        add = ''

        if self._type in [ActionDescription.ARCHIVING, ActionDescription.DELETION]:
            new_name += ' - %s the %s' % (self._type, datetime.now())
        else:
            pass

        return new_name

class Root(DAVCollection):
    def __init__(self, path: str, environ: dict):
        super(Root, self).__init__(path, environ)

        self._workspace_api = WorkspaceApi(environ['user'])

    def __repr__(self) -> str:
        return '<DAVCollection: Root>'

    def getCreationDate(self) -> float:
        return mktime(datetime.now().timetuple())

    def getDisplayName(self) -> str:
        return 'Tracim - Home'

    def getLastModified(self) -> float:
        return mktime(datetime.now().timetuple())

    def getMemberNames(self) -> [str]:
        return [workspace.label for workspace in self._workspace_api.get_all()]

    def getMember(self, label: str) -> _DAVResource:

        workspace = self._workspace_api.get_one_by_label(label)

        if not workspace:
            return None

        return Workspace(self.path + workspace.label, self.environ, workspace)

    def createEmptyResource(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)


class Workspace(DAVCollection):
    def __init__(self, path: str, environ: dict, workspace: data.Workspace):
        super(Workspace, self).__init__(path, environ)

        self._workspace = workspace
        self._content_api = ContentApi(environ['user'])

        self._file_count = 0

    def __repr__(self) -> str:
        return "<DAVCollection: Workspace (%s)>" % self._workspace.label

    def getCreationDate(self) -> float:
        return mktime(self._workspace.created.timetuple())

    def getDisplayName(self) -> str:
        return self._workspace.label

    def getLastModified(self) -> float:
        return mktime(self._workspace.updated.timetuple())

    def getMemberNames(self) -> [str]:
        retlist = []

        children = self._content_api.get_all(
            parent_id=None,
            content_type=ContentType.Any,
            workspace=self._workspace
            )

        for content in children:
            if content.type != ContentType.Folder:
                self._file_count += 1
            retlist.append(content.get_label())

        return retlist

    def getMember(self, content_label: str) -> _DAVResource:

        content = self._content_api.get_one_by_label_and_parent(
            content_label=content_label,
            workspace=self._workspace
        )

        return _CONTENTS[content.type](
            path=self.path + '/' + content.get_label(),
            environ=self.environ,
            content=content
            )

    def createEmptyResource(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, label: str) -> 'Folder':

        folder = self._content_api.create(
            content_type=ContentType.Folder,
            workspace=self._workspace,
            label=label
            )

        subcontent = dict(
            folder=True,
            thread=True,
            file=True,
            page=True
        )

        self._content_api.set_allowed_content(folder, subcontent)
        self._content_api.save(folder)

        transaction.commit()

        return Folder(self.path + '/' + label, self.environ, folder)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def copyMoveSingle(self, destpath, ismove):
        raise DAVError(HTTP_FORBIDDEN)

    def supportRecursiveMove(self, destpath):
        return False

    def moveRecursive(self, destpath):
        raise DAVError(HTTP_FORBIDDEN)

    def setLastModified(self, destpath, timestamp, dryrun):
        return False

    def getMemberList(self) -> [_DAVResource]:
        memberlist = []

        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:
            for name in self.getMemberNames():
                member = self.getMember(name)
                if member is not None:
                    memberlist.append(member)

            if memberlist != [] and self._file_count > 0:
                memberlist.append(
                    HistoryFolder(
                        path=self.path + '/' + ".history",
                        environ=self.environ,
                        content=None,
                        type=HistoryType.Standard
                        )
                    )

            memberlist.append(
                DeletedFolder(
                    path=self.path + '/' + ".deleted",
                    environ=self.environ,
                    content=None
                    )
                )

            memberlist.append(
                ArchivedFolder(
                    path=self.path + '/' + ".archived",
                    environ=self.environ,
                    content=None
                    )
                )

        return memberlist


class Folder(DAVCollection):
    def __init__(self, path: str, environ: dict, content: data.Content):
        super(Folder, self).__init__(path, environ)
        self._api = ContentApi(current_user=environ['user'])

        self._content = content

        self._file_count = 0

    def __repr__(self) -> str:
        return "<DAVCollection: Folder (%s)>" % self._content.label

    def getCreationDate(self) -> float:
        return mktime(self._content.created.timetuple())

    def getDisplayName(self) -> str:
        return self._content.get_label()

    def getLastModified(self) -> float:
        return mktime(self._content.updated.timetuple())

    def getMemberNames(self) -> [str]:
        retlist = []

        for content in self._api.get_all(self._content.id, ContentType.Any):
            if not content.is_deleted and not content.is_archived:
                if content.type != ContentType.Folder:
                    self._file_count += 1
                retlist.append(content.get_label())

        return retlist

    def getMember(self, content_label: str) -> _DAVResource:

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(
            path=self.path + '/' + content.get_label(),
            environ=self.environ
            )

    def createEmptyResource(self, file_name: str) -> FileStream:
        return FileStream(
            file_name=file_name,
            content=self._content,
            content_api=self._api,
            new_file=True
            )

    def createCollection(self, label: str) -> _DAVResource:

        folder = self._api.create(ContentType.Folder, self._content.workspace, self._content, label)

        subcontent = dict(
            folder=True,
            thread=True,
            file=True,
            page=True
        )

        self._api.set_allowed_content(folder, subcontent)
        self._api.save(folder)

        transaction.commit()

        return Folder(self.path + '/' + label, self.environ, folder)

    def delete(self):
        Encapsuler(ActionDescription.DELETION, self._api, self._content).action()

    def copyMoveSingle(self, destpath: str, ismove: bool):
        destpath = normpath(destpath)

        if ismove:
            parent = self.provider.get_parent_from_path(normpath(destpath), self._api, WorkspaceApi(self._user))

            with new_revision(self._content):
                if basename(destpath) != self._content.label:
                    self._api.update_content(self._content, basename(destpath), self._content.description)
                    self._api.save(self._content)

                if parent.workspace.workspace_id == self._content.workspace.workspace_id:
                    self._api.move(self._content, parent)
                else:
                    self._api.move_recursively(self._content, parent, parent.workspace)

            transaction.commit()
        else:
            raise DAVError("wowo")
        
    def supportRecursiveMove(self, destpath: str):
        return True

    def moveRecursive(self, destpath: str):
        destpath = normpath(destpath)

        npath = normpath(self.path)

        if dirname(destpath).endswith('.deleted') or dirname(destpath).endswith('.archived'):
            if basename(dirname(dirname(destpath))) == self._content.parent.label:
                if dirname(destpath).endswith('.deleted'):
                    Encapsuler(ActionDescription.DELETION, self._api, self._content).action()
                else:
                    Encapsuler(ActionDescription.ARCHIVING, self._api, self._content).action()
            else:
                raise DAVError(HTTP_FORBIDDEN)
        elif (dirname(npath).endswith('.deleted') or dirname(npath).endswith('.archived')) \
            and dirname(dirname(npath)) == dirname(destpath):
            if dirname(npath).endswith('.deleted'):
                Encapsuler(ActionDescription.UNDELETION, self._api, self._content).action()
            else:
                Encapsuler(ActionDescription.UNARCHIVING, self._api, self._content).action()

        else:
            self.copyMoveSingle(destpath, True)

    def setLastModified(self, destpath: str, timestamp: float, dryrun: bool):
        return False
        #self.item.updated = datetime.fromtimestamp(timestamp)
        #return True

    def getMemberList(self) -> [_DAVResource]:
        memberlist = []

        for name in self.getMemberNames():
            member = self.getMember(name)
            if member is not None:
                memberlist.append(member)

        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:
            if memberlist != [] and self._file_count > 0:
                memberlist.append(
                    HistoryFolder(
                        path=self.path + '/' + ".history",
                        environ=self.environ,
                        content=self._content,
                        type=HistoryType.Standard
                        )
                    )

            memberlist.append(
                DeletedFolder(
                    path=self.path + '/' + ".deleted",
                    environ=self.environ,
                    content=self._content
                    )
                )

            memberlist.append(
                ArchivedFolder(
                    path=self.path + '/' + ".archived",
                    environ=self.environ,
                    content=self._content
                    )
                )

        return memberlist

class HistoryFolder(Folder):
    def __init__(self, path, environ, content: data.Content, type):
        super(HistoryFolder, self).__init__(path, environ, content)

        self._archive = type == HistoryType.Archived
        self._delete = type == HistoryType.Deleted
        self._api = ContentApi(
            current_user=environ['user'],
            show_archived=self._archive,
            show_deleted=self._delete
        )

    def __repr__(self) -> str:
        return "<DAVCollection: HistoryFolder (%s)>" % self._content.file_name

    def getCreationDate(self) -> float:
        return mktime(datetime.now().timetuple())

    def getDisplayName(self) -> str:
        return '.history'

    def getLastModified(self) -> float:
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label: str) -> _DAVResource:
        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return HistoryFileFolder(
            path=self.path + '/' + content.get_label(),
            environ=self.environ,
            content=content)

    def getMemberNames(self) -> [str]:
        return [content.get_label() for content in self._api.get_all(self._content.id, ContentType.Any)\
                if (self._archive and content.is_archived
                    or self._delete and content.is_deleted
                    or not (content.is_archived
                        or self._archive
                        or content.is_deleted
                        or self._delete
                        ))
                and content.type != ContentType.Folder]

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

    def setLastModified(self, destpath: str, timestamp: float, dryrun: bool):
        return False

    def getMemberList(self) -> [_DAVResource]:
        memberlist = []
        for name in self.getMemberNames():
            member = self.getMember(name)
            if member is not None:
                memberlist.append(member)
        return memberlist


class DeletedFolder(HistoryFolder):
    def __init__(self, path: str, environ: dict, content: data.Content):
        super(DeletedFolder, self).__init__(path, environ, content, HistoryType.Deleted)

        self._api = ContentApi(
            current_user=environ['user'],
            show_deleted=True
        )

        self._file_count = 0

    def __repr__(self):
        return "<DAVCollection: DeletedFolder (%s)" % self._content.file_name

    def getCreationDate(self) -> float:
        return mktime(datetime.now().timetuple())

    def getDisplayName(self) -> str:
        return '.deleted'

    def getLastModified(self) -> float:
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label) -> _DAVResource:

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(
            path=self.path + '/' + content.get_label(),
            environ=self.environ
            )

    def getMemberNames(self) -> [str]:
        retlist = []

        for content in self._api.get_all(parent_id=self._content.id, content_type=ContentType.Any):
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

    def handleDelete(self):
        return True

    def handleCopy(self, destPath: str, depthInfinity):
        return True

    def handleMove(self, destPath: str):
        return True

    def setLastModified(self, destpath: str, timestamp: float, dryrun: bool):
        return False

    def getMemberList(self) -> [_DAVResource]:
        memberlist = []

        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:

            for name in self.getMemberNames():
                member = self.getMember(name)
                if member is not None:
                    memberlist.append(member)

            if self._file_count > 0:
                memberlist.append(
                    HistoryFolder(
                        path=self.path + '/' + ".history",
                        environ=self.environ,
                        content=self._content, 
                        type=HistoryType.Deleted
                        )
                    )

        return memberlist


class ArchivedFolder(HistoryFolder):
    def __init__(self, path: str, environ: dict, content: data.Content):
        super(ArchivedFolder, self).__init__(path, environ, content, HistoryType.Archived)

        self._api = ContentApi(
            current_user=environ['user'],
            show_archived=True
        )

        self._file_count = 0

    def __repr__(self) -> str:
        return "<DAVCollection: ArchivedFolder (%s)" % self._content.file_name

    def getCreationDate(self) -> float:
        return mktime(datetime.now().timetuple())

    def getDisplayName(self) -> str:
        return '.archived'

    def getLastModified(self) -> float:
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label) -> _DAVResource:

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(
            path=self.path + '/' + content.get_label(),
            environ=self.environ
            )

    def getMemberNames(self) -> [str]:
        retlist = []

        for content in self._api.get_all(self._content.id, ContentType.Any):
            if content.is_archived:
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

    def handleDelete(self):
        return True

    def handleCopy(self, destPath: str, depthInfinity):
        return True

    def handleMove(self, destPath: str):
        return True

    def setLastModified(self, destpath: str, timestamp: float, dryrun: bool):
        return False

    def getMemberList(self) -> [_DAVResource]:
        memberlist = []
        
        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:
            for name in self.getMemberNames():
                member = self.getMember(name)
                if member is not None:
                    memberlist.append(member)

            if self._file_count > 0:
                memberlist.append(
                    HistoryFolder(
                        path=self.path + '/' + ".history",
                        environ=self.environ,
                        content=self._content,
                        type=HistoryType.Archived
                        )
                    )

        return memberlist


class HistoryFileFolder(HistoryFolder):
    def __init__(self, path: str, environ: dict, content: data.Content):
        super(HistoryFileFolder, self).__init__(path, environ, content, HistoryType.All)

    def __repr__(self) -> str:
        return "<DAVCollection: HistoryFileFolder (%s)" % self._content.file_name

    def getDisplayName(self) -> str:
        return self._content.get_label()

    def createCollection(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def createEmptyResource(self, name) -> FileStream:
        return FileStream(
            content=self._content,
            content_api=self._api,
            file_name=name,
            new_file=False
            )

    def getMemberNames(self) -> [str]:
        return [content.revision_id for content in self._content.revisions \
                if content.revision_type in [ActionDescription.CREATION, ActionDescription.EDITION, ActionDescription.REVISION]]

    def getMember(self, item_id) -> DAVCollection:

        revision = self._api.get_one_revision(item_id)
        
        if self._content.type == ContentType.File:
            return HistoryFile(
                path=self.path + '/' + str(revision.revision_id) + '-' + revision.file_name,
                environ=self.environ,
                content=self._content, 
                content_revision=revision)
        else:
            return HistoryOtherFile(
                path=self.path + '/' + str(revision.revision_id) + '-' + revision.get_label(),
                environ=self.environ,
                content=self._content,
                content_revision=revision)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def getMemberList(self) -> [_DAVResource]:
        memberlist = []

        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:

            for name in self.getMemberNames():
                member = self.getMember(name)
                if member is not None:
                    memberlist.append(member)

        return memberlist


class File(DAVNonCollection):
    def __init__(self, path: str, environ: dict, content: Content, is_new_file: bool):
        super(File, self).__init__(path, environ)

        self._content = content

        self._api = ContentApi(
            current_user=environ['user'],
            show_archived=True,
            show_deleted=True
        )

        self.filestream = FileStream(
            content=self._content,
            content_api=self._api,
            file_name=self._content.get_label(),
            new_file=False
            )

    def __repr__(self) -> str:
        return "<DAVNonCollection: File (%s)>" % self._content.get_label()

    def getContentLength(self) -> int:
        return len(self._content.file_content)

    def getContentType(self) -> str:
        return self._content.file_mimetype

    def getCreationDate(self) -> float:
        return mktime(self._content.created.timetuple())

    def getDisplayName(self) -> str:
        return self._content.get_label()

    def getLastModified(self) -> float:
        return mktime(self._content.updated.timetuple())

    def getContent(self):
        if PY3:
            filestream = compat.BytesIO()
        else:
            filestream = compat.StringIO()
        filestream.write(self._content.file_content)
        filestream.seek(0)

        return filestream

    def beginWrite(self, contentType: str=None) -> FileStream:
        return self.filestream

    def copyMoveSingle(self, destpath: str, ismove: bool):
        destpath = normpath(destpath)

        if ismove:
            parent = self.provider.get_parent_from_path(
                normpath(destpath),
                self._api,
                WorkspaceApi(self.environ['user'])
            )

            with new_revision(self._content):
                if basename(destpath) != self._content.label:
                    self._api.update_content(self._content, basename(destpath), self._content.description)
                    self._api.save(self._content)

                self._api.move(item=self._content, new_parent=parent, must_stay_in_same_workspace=False, new_workspace=parent.workspace)

            transaction.commit()
        else:
            raise DAVError(HTTP_FORBIDDEN)

    def supportRecursiveMove(self, dest: str):
        return True

    def delete(self):
        Encapsuler(ActionDescription.DELETION, self._api, self._content).action()

    def moveRecursive(self, destpath: str):
        destpath = normpath(destpath)

        npath = normpath(self.path)

        if dirname(destpath).endswith('.deleted') or dirname(destpath).endswith('.archived'):
            if basename(dirname(dirname(destpath))) == self._content.parent.label:
                if dirname(destpath).endswith('.deleted'):
                    if self._content.label != '':
                        self._content.label += 'deleted now'
                    else:
                        self._content.file_name += 'deleted now'
                    Encapsuler(ActionDescription.DELETION, self._api, self._content).action()
                else:
                    Encapsuler(ActionDescription.ARCHIVING, self._api, self._content).action()
                    if self._content.label != '':
                        self._content.label += 'archived now'
                    else:
                        self._content.file_name += 'archived now'
            else:
                raise DAVError(HTTP_FORBIDDEN)
        elif (dirname(npath).endswith('.deleted') or dirname(npath).endswith('.archived')):
            if dirname(dirname(npath)) == dirname(destpath):
                if dirname(npath).endswith('.deleted'):
                    Encapsuler(ActionDescription.UNDELETION, self._api, self._content).action()
                    
                else:
                    Encapsuler(ActionDescription.UNARCHIVING, self._api, self._content).action()
            else:
                raise DAVError(HTTP_FORBIDDEN)
        else:
            self.copyMoveSingle(destpath, True)

    def setLastModified(self, dest: str, timestamp: float, dryrun: bool):
        self._content.updated = datetime.fromtimestamp(timestamp)
        return True

class HistoryFile(File):
    def __init__(self, path: str, environ: dict, content: data.Content, content_revision: data.ContentRevisionRO):
        super(HistoryFile, self).__init__(path, environ, content, False)
        self._content_revision = content_revision

    def __repr__(self) -> str:
        return "<DAVNonCollection: HistoryFile (%s-%s)" % (self._content.content_id, self._content.file_name)

    def getDisplayName(self) -> str:
        return str(self._content_revision.revision_id) + '-' + self._content_revision.file_name

    def beginWrite(self, contentType=None):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def handleDelete(self):
        return False

    def handleCopy(self, destPath, depthInfinity):
        return True

    def handleMove(self, destPath):
        return True

    def copyMoveSingle(self, destpath, ismove):
        raise DAVError(HTTP_FORBIDDEN)

    def setLastModified(self, dest, timestamp, dryrun):
        return False


class OtherFile(File):
    def __init__(self, path: str, environ: dict, content: data.Content):
        super(OtherFile, self).__init__(path, environ, content, False)

    def __repr__(self) -> str:
        return "<DAVNonCollection: OtherFile (%s)" % self._content.file_name

    def getContentLength(self) -> int:
        if self._content.type == ContentType.Page:
            return len(designPage(self._content, self._content.revision))
        else:
            return len(designThread(self._content, self._content.revision, self._api.get_all(self._content.content_id, ContentType.Comment)))

    def getContentType(self) -> str:
        return 'text/html'

    def getContent(self):
        if PY3:
            filestream = compat.BytesIO()
        else:
            filestream = compat.StringIO()

        if self._content.type == ContentType.Page:
            self._content_page = designPage(self._content, self._content.revision)
        else:
            self._content_page = designThread(self._content, self._content.revision, self._api.get_all(self._content.content_id, ContentType.Comment))

        filestream.write(bytes(self._content_page, 'utf-8'))
        filestream.seek(0)
        return filestream

class HistoryOtherFile(OtherFile):
    def __init__(self, path: str, environ: dict, content: data.Content, content_revision: data.ContentRevisionRO):
        super(HistoryOtherFile, self).__init__(path, environ, content)
        self._content_revision = content_revision

    def __repr__(self) -> str:
        return "<DAVNonCollection: HistoryOtherFile (%s-%s)" % (self._content.file_name, self._content.id)

    def getDisplayName(self) -> str:
        return str(self._content_revision.revision_id) + '-' + self._content_revision.get_label()

    def getContent(self):
        if PY3:
            filestream = compat.BytesIO()
        else:
            filestream = compat.StringIO()

        if self._content.type == ContentType.Page:
            self._content_page = designPage(self._content, self._content_revision)
        else:
            self._content_page = designThread(self._content, self._content_revision, self._api.get_all(self._content.content_id, ContentType.Comment))

        filestream.write(bytes(self._content_page, 'utf-8'))
        filestream.seek(0)
        return filestream

    def getName(self) -> str:
        return self._content_revision.label

    def beginWrite(self, contentType=None):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def handleDelete(self):
        return True

    def handleCopy(self, destPath, depthInfinity):
        return True

    def handleMove(self, destPath):
        return True

    def copyMoveSingle(self, destpath, ismove):
        raise DAVError(HTTP_FORBIDDEN)


_CONTENTS = {
    ContentType.Folder: Folder,
    ContentType.File: File,
    ContentType.Page: OtherFile,
    ContentType.Thread: OtherFile
}