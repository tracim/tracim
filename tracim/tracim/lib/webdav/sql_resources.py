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
from tracim.model.data import Content, ActionDescription, VirtualEvent
from tracim.model.data import ContentType
from wsgidav.dav_provider import DAVResource

_CONTENTS = {
    ContentType.Folder: Folder,
    ContentType.File: File,
    ContentType.Page: OtherFile,
    ContentType.Thread: OtherFile
}

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

    def action(self):
        with new_revision(self._content):
            self._actions[self._type](self._content)
            self._api.save(self._content, self._type)

        transaction.commit()


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

    def getMember(self, label: str) -> Workspace:

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

    def getMember(self, content_label: str) -> DAVResource:

        content = self._content_api.get_one_by_label_and_parent(
            content_label=content_label,
            workspace=self._workspace
        )

        return _CONTENTS[content.type](
            path=self.path + content.get_label(),
            environ=self.environ,
            content=content
            )

    def createEmptyResource(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, label: str) -> Folder:

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

        return Folder(self.path + label, self.environ, folder)

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

    def getMemberList(self) -> [DAVResource]:
        memberlist = []

        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:
            for name in self.getMemberNames():
                member = self.getMember(name)
                if member is not None:
                    memberlist.append(member)

            if memberlist != [] and self._file_count > 0:
                memberlist.append(
                    HistoryFolder(
                        path=self.path + ".history",
                        environ=self.environ,
                        content=self._content,
                        type=HistoryType.Standard
                        )
                    )

            memberlist.append(
                DeletedFolder(
                    path=self.path + ".deleted",
                    environ=self.environ,
                    content=self._content
                    )
                )

            memberlist.append(
                ArchivedFolder(
                    path=self.path + ".archived",
                    environ=self.environ,
                    content=self._content
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

    def getMember(self, content_label: str) -> DAVResource:

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(
            path=self.path + content.get_label(),
            environ=self.environ
            )

    def createEmptyResource(self, file_name: str) -> FileStream:
        return FileStream(
            file_name=file_name,
            content=self._content,
            content_api=self._api,
            new_file=True
            )

    def createCollection(self, label: str) -> Folder:

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

        return Folder(self.path + label, self.environ, folder)

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

    def getMemberList(self) -> [DAVResource]:
        memberlist = []

        for name in self.getMemberNames():
            member = self.getMember(name)
            if member is not None:
                memberlist.append(member)

        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:
            if memberlist != [] and self._file_count > 0:
                memberlist.append(
                    HistoryFolder(
                        path=self.path + ".history",
                        environ=self.environ,
                        content=self._content,
                        type=HistoryType.Standard
                        )
                    )

            memberlist.append(
                DeletedFolder(
                    path=self.path + ".deleted",
                    environ=self.environ,
                    content=self._content
                    )
                )

            memberlist.append(
                ArchivedFolder(
                    path=self.path + ".archived",
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

    def getMember(self, content_label: str) -> HistoryFileFolder:
        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return HistoryFileFolder(
            path=self.path + content.get_label(),
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

    def getMemberList(self) -> [HistoryFileFolder]:
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
            current_user=self._user,
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

    def getMember(self, content_label) -> DAVResource:

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(
            path=self.path + content.get_label(),
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

    def getMemberList(self) -> [DAVResource]:
        memberlist = []

        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:

            for name in self.getMemberNames():
                member = self.getMember(name)
                if member is not None:
                    memberlist.append(member)

            if self._file_count > 0:
                memberlist.append(
                    HistoryFolder(
                        path=self.path + ".history",
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

    def getMember(self, content_label) -> DAVResource:

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(
            path=self.path + content.get_label(),
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

    def getMemberList(self) -> [DAVResource]:
        memberlist = []
        
        if self.environ['REQUEST_METHOD'] not in ['MOVE', 'COPY', 'DELETE']:
            for name in self.getMemberNames():
                member = self.getMember(name)
                if member is not None:
                    memberlist.append(member)

            if self._file_count > 0:
                memberlist.append(
                    HistoryFolder(
                        path=self.path + ".history",
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
                path=self.path + str(rev.revision_id) + '-' + rev.file_name,
                environ=self.environ,
                content=self._content, 
                content_revision=revision)
        else:
            return HistoryOtherFile(
                path=self.path + str(rev.revision_id) + '-' + rev.get_label(),
                environ=self.environ,
                content=self._content,
                content_revision=revision)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)


class File(DAVNonCollection):
    def __init__(self, path: str, environ: environ, content: Content, is_new_file: bool):
        super(File, self).__init__(path, environ)

        self._content = content

        self._api = ContentApi(
            current_user=environ['user'],
            show_archived=True,
            show_deleted=True
        )

        self.filestream = MyFileStream(content=self._content, content_api=self._api)

    def __repr__(self) -> str:
        return "<DAVNonCollectio: File (%s)>" % self._content.get_label()

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

    def beginWrite(self, contentType: str=None) -> MyFileStream:
        return self.filestream

    def copyMoveSingle(self, destpath: str, ismove: bool):
        destpath = normpath(destpath)

        if ismove:
            parent = self.provider.get_parent_from_path(normpath(destpath), self._api, WorkspaceApi(self._user))

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
                    Encapsuler(ActionDescription.DELETION, self._api, self._content).action()
                else:
                    Encapsuler(ActionDescription.ARCHIVING, self._api, self._content).action()
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
        return True

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
            return len(self.designPage(self._content))
        else:
            return len(self.designThread(self._content))

    def getContentType(self) -> str:
        return 'text/html'

    def getContent(self):
        if PY3:
            filestream = compat.BytesIO()
        else:
            filestream = compat.StringIO()

        if self._content.type == ContentType.Page:
            self._content_page = self.designPage(self._content)
        else:
            self._content_page = self.designThread(self._content)

        filestream.write(bytes(self._content_page, 'utf-8'))
        filestream.seek(0)
        return filestream

    def designPage(self, content: data.Content) -> str:
        #f = open('wsgidav/addons/webdav/style.css', 'r')
        style = ''#f.read()
        #f.close()

        hist = self._content.get_history()
        histHTML = '<table class="table table-striped table-hover">'
        for event in hist:
            if isinstance(event, VirtualEvent):
                date = event.create_readable_date()
                _LABELS = {
                    'archiving': 'Item archived',
                    'content-comment': 'Item commented',
                    'creation': 'Item created',
                    'deletion': 'Item deleted',
                    'edition': 'item modified',
                    'revision': 'New revision',
                    'status-update': 'New status',
                    'unarchiving': 'Item unarchived',
                    'undeletion': 'Item undeleted',
                    'move': 'Item moved'
                }

                label = _LABELS[event.type.id]

                histHTML += '''
                <tr>
                    <td class="my-align"><span class="label label-default"><i class="fa %s"></i> %s</span></td>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%s</td>
                </tr>
                ''' % (event.type.icon,
                       label,
                       date,
                       event.owner.display_name,
                       '''<span><a href="#">View revision</a></span>''' if event.type.id == 'revision' else '')

        histHTML+='</table>'

        #pdf = pdfkit.from_string(self._content.description, False)

        file = '''
<html>
<head>
	<title>%s</title>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css">
	<link rel="stylesheet" href="/home/arnaud/Documents/css/style.css">
	<script type="text/javascript" src="/home/arnaud/Documents/css/script.js"></script>
</head>
<body>
    <div id="left" class="col-lg-8 col-md-12 col-sm-12 col-xs-12">
        <div class="title page">
            <div class="title-text">
                <i class="fa fa-file-text-o title-icon page"></i>
                <h1>%s</h1>
                <h6>page created on <b>%s</b> by <b>%s</b></h6>
            </div>
            <div class="pull-right">
                <div class="btn-group btn-group-vertical">
                    <a class="btn btn-default" onclick="download_pdf()">
                        <i class="fa fa-download"></i> Download as pdf</a>
                    </a>
                    <a class="btn btn-default">
                        <i class="fa fa-external-link"></i> Access webdav</a>
                    </a>
                </div>
            </div>
        </div>
        <div class="content col-xs-12 col-sm-12 col-md-12 col-lg-12">
            %s
        </div>
    </div>
    <div id="right" class="col-lg-4 col-md-12 col-sm-12 col-xs-12">
        <h4>History</h4>
        %s
    </div>
    <script>
        function download_pdf() {
            download("%s", "%s.pdf", "application/pdf")
        }
    </script>
</body>
</html>
        ''' % (content.label,
               content.label,
               self._content.created.strftime("%B %d, %Y at %H:%m"),
               self._content.owner.display_name,
               content.description,
               histHTML,
               "Meh.",
               self._content.label)

        return file

    def designThread(self, content: data.Content) -> str:

        comments = self._api.get_all(self._content.content_id, ContentType.Comment)
        hist = self._content.get_history()

        allT = []
        allT += comments
        allT += hist
        allT.sort(key=lambda x: x.created, reverse=True)

        disc = ''
        participants = {}
        for t in allT:
            if t.type == ContentType.Comment:
                disc += '''
                    <div class="row comment comment-row">
                        <i class="fa fa-comment-o comment-icon"></i>
                            <div class="comment-content">
                            <h5>
                                <span class="comment-author"><b>%s</b> wrote :</span>
                                <div class="pull-right text-right">%s</div>
                            </h5>
                            %s
                        </div>
                    </div>
                    ''' % (t.owner.display_name, t.create_readable_date(), t.description)

                if t.owner.display_name not in participants:
                    participants[t.owner.display_name] = [1, t.created]
                else:
                    participants[t.owner.display_name][0] += 1
            else:
                if isinstance(t, VirtualEvent) and t.type.id != 'comment':
                    _LABELS = {
                        'archiving': 'Item archived',
                        'content-comment': 'Item commented',
                        'creation': 'Item created',
                        'deletion': 'Item deleted',
                        'edition': 'item modified',
                        'revision': 'New revision',
                        'status-update': 'New status',
                        'unarchiving': 'Item unarchived',
                        'undeletion': 'Item undeleted',
                        'move': 'Item moved',
                        'comment' : 'hmmm'
                    }

                    label = _LABELS[t.type.id]

                    disc += '''
                    <div class="row comment comment-row">
                        <i class="fa %s comment-icon"></i>
                            <div class="comment-content">
                            <h5>
                                <span class="comment-author"><b>%s</b></span>
                                <div class="pull-right text-right">%s</div>
                            </h5>
                            %s %s
                        </div>
                    </div>
                    ''' % (t.type.icon,
                           t.owner.display_name,
                           t.create_readable_date(),
                           label,
                           '''<span><a href="#">(View revision)</a></span>''' if t.type.id == 'revision' else '')

        page = '''
<html>
<head>
	<title>%s</title>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css">
	<link rel="stylesheet" href="/home/arnaud/Documents/css/style.css">
	<script type="text/javascript" src="/home/arnaud/Documents/css/script.js"></script>
</head>
<body>
    <div id="left" class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <div class="title thread">
            <div class="title-text">
                <i class="fa fa-comments-o title-icon thread"></i>
                <h1>%s</h1>
                <h6>thread created on <b>%s</b> by <b>%s</b></h6>
            </div>
            <div class="pull-right">
                <div class="btn-group btn-group-vertical">
                    <a class="btn btn-default" onclick="download_pdf()">
                        <i class="fa fa-download"></i> Download as pdf</a>
                    </a>
                    <a class="btn btn-default">
                        <i class="fa fa-external-link"></i> Access webdav</a>
                    </a>
                </div>
            </div>
        </div>
        <div class="content col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <div class="description">
                <span class="description-text">%s</span>
            </div>
            %s
        </div>
    </div>
</body>
</html>
        ''' % (content.label,
               content.label,
               self._content.created.strftime("%B %d, %Y at %H:%m"),
               self._content.owner.display_name,
               content.description,
               disc)

        return page


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
            self._content_page = self.designPage(self._content_revision)
        else:
            self._content_page = self.designThread(self._content_revision)

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
