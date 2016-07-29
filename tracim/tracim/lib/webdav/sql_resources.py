# coding: utf8
from datetime import datetime
from time import mktime

import transaction
from os.path import normpath, dirname, basename
from tracim.lib.content import ContentApi
from tracim.lib.webdav import HistoryType
from tracim.lib.webdav import MyFileStream, MyFileStream2
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
    def __init__(self, path, environ):
        super(Root, self).__init__(path, environ)

        self._user = UserApi(None).get_one_by_email(environ['http_authenticator.username'])
        self._api = WorkspaceApi(self._user)

    def __repr__(self):
        return 'Root folder'

    def __eq__(self, other):
        return self.getDisplayName() == other.getDisplayName()

    def getCreationDate(self):
        return mktime(datetime.now().timetuple())

    def getDisplayName(self):
        return 'Tracim - Home'

    def getLastModified(self):
        return mktime(datetime.now().timetuple())

    def getMemberNames(self) -> [str]:
        return [workspace.label for workspace in self._api.get_all()]

    def getMember(self, label: str):
        #  todo : None = return None ?
        workspace = self._api.get_one_by_label(label)

        return None if workspace is None else Workspace(self.path + workspace.label, self.environ, workspace)

    def createEmptyResource(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, name: str):
        raise DAVError(HTTP_FORBIDDEN)


class Workspace(DAVCollection):
    def __init__(self, path, environ, workspace: data.Workspace):
        super(Workspace, self).__init__(path, environ)
        self._workspace = workspace
        self._api = ContentApi(
            current_user=UserApi(None).get_one_by_email(environ['http_authenticator.username'])
        )

        self._deleted_count = 0
        self._archived_count = 0
        self._file_count = 0

    def __repr__(self):
        return "Workspace: %s" % self._workspace.label

    def __eq__(self, other):
        return self.path == other.path

    def getCreationDate(self):
        return mktime(self._workspace.created.timetuple())

    def getDisplayName(self):
        return self._workspace.label

    def getLastModified(self):
        return mktime(self._workspace.updated.timetuple())

    def getMemberNames(self):
        retlist = []

        for content in self._api.get_all(None, ContentType.Any, self._workspace):
            if content.is_deleted:
                self._deleted_count += 1
            elif content.is_archived:
                self._archived_count += 1
            else:
                if content.type != ContentType.Folder:
                    self._file_count += 1
                retlist.append(content.get_label())

        return retlist

    def getMember(self, content_label):

        if content_label=='':
            return None

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            workspace=self._workspace
        )

        print("ok : ", content_label)
        return Folder(self.path + content.get_label(), self.environ, content)

    def createEmptyResource(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, label):

        folder = self._api.create(ContentType.Folder, self._workspace, None, label)

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
        raise DAVError(HTTP_FORBIDDEN)

    def copyMoveSingle(self, destpath, ismove):
        raise DAVError(HTTP_FORBIDDEN)

    def supportRecursiveMove(self, destpath):
        return False

    def moveRecursive(self, destpath):
        raise DAVError(HTTP_FORBIDDEN)

    def setLastModified(self, destpath, timestamp, dryrun):
        return False

    def getMemberList(self):
        memberlist = []


        if self.environ['REQUEST_METHOD'] not in ['MOVE, COPY, DELETE']:
            for name in self.getMemberNames():
                member = self.getMember(name)
                if member is not None:
                    memberlist.append(member)
            """
            if memberlist != [] and self._file_count > 0:
                memberlist.append(
                    HistoryFolder(self.path + ".history", self.environ, self._content, HistoryType.Standard))

            if self._deleted_count > 0:
                memberlist.append(DeletedFolder(self.path + ".deleted", self.environ, self._content))

            if self._archived_count > 0:
                memberlist.append(ArchivedFolder(self.path + ".archived", self.environ, self._content))
            """

        return memberlist


class Folder(DAVCollection):
    def __init__(self, path, environ, content: data.Content):
        super(Folder, self).__init__(path, environ)
        self._user = UserApi(None).get_one_by_email(environ['http_authenticator.username'])
        self._api = ContentApi(
            current_user=self._user,
            show_archived=True,
            show_deleted=True
        )

        self._content = content

        self._archived_count = 0
        self._deleted_count = 0
        self._file_count = 0

    def __repr__(self):
        return "Folder: %s" % self._content.label

    def __eq__(self, other):
        return self._content.id == other.content.id and self._content.revision_id == self._content.revision_id

    def getCreationDate(self):
        return mktime(self._content.created.timetuple())

    def getDisplayName(self):
        return self._content.get_label()

    def getLastModified(self):
        return mktime(self._content.updated.timetuple())

    def getMemberNames(self):
        retlist = []

        for content in self._api.get_all(self._content.id, ContentType.Any):
            if not content.is_deleted and not content.is_archived:
                if content.type != ContentType.Folder:
                    self._file_count += 1
                retlist.append(content.get_label())

        return retlist
        # that's looked good though :( return [content.get_label() for content in self._api.get_all(self._content.id, ContentType.Any)]

    def getMember(self, content_label):

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(self.path + content.get_label(), self.environ)

    def createEmptyResource(self, file_name):
        return DummyResource(file_name=file_name, content=self._content, content_api=self._api)

    def createCollection(self, label):

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

    def copyMoveSingle(self, destpath, ismove):
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
        
    def supportRecursiveMove(self, destpath):
        return True

    def moveRecursive(self, destpath):
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

    def setLastModified(self, destpath, timestamp, dryrun):
        return False
        #self.item.updated = datetime.fromtimestamp(timestamp)
        #return True

    def getMemberList(self):
        memberlist = []

        for name in self.getMemberNames():
            member = self.getMember(name)
            if member is not None:
                memberlist.append(member)

        if self.environ['REQUEST_METHOD'] not in ['MOVE, COPY, DELETE']:
            if memberlist != [] and self._file_count > 0:
                memberlist.append(HistoryFolder(self.path + ".history", self.environ, self._content, HistoryType.Standard))

            memberlist.append(DeletedFolder(self.path + ".deleted", self.environ, self._content))
            memberlist.append(ArchivedFolder(self.path + ".archived", self.environ, self._content))

        return memberlist


class HistoryFolder(Folder):
    def __init__(self, path, environ, content: data.Content, type):
        super(HistoryFolder, self).__init__(path, environ, content)

        self._archive = type == HistoryType.Archived
        self._delete = type == HistoryType.Deleted
        self._api = ContentApi(
            current_user=self._user,
            show_archived=self._archive,
            show_deleted=self.delete
        )

    def __repr__(self):
        return "Folder history of : %s" % self._content.file_name

    def __eq__(self, other):
        return self._content.id == other.content.id

    def getCreationDate(self):
        return mktime(datetime.now().timetuple())

    def getDisplayName(self):
        return '.history'

    def getLastModified(self):
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label):
        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return HistoryFileFolder(self.path + content.get_label(), self.environ, content)

    def getMemberNames(self):
        return [content.get_label() for content in self._api.get_all(self._content.id, ContentType.Any)\
                if (self._archive and content.is_archived
                    or self._delete and content.is_deleted
                    or not (content.is_archived or self._archive or content.is_deleted or self._delete))
                and content.type != ContentType.Folder]

    def createEmptyResource(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def createCollection(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)

    def handleDelete(self):
        return True

    def handleCopy(self, destPath, depthInfinity):
        return True

    def handleMove(self, destPath):
        return True

    def setLastModified(self, destpath, timestamp, dryrun):
        return False

    def getMemberList(self):
        memberlist = []
        for name in self.getMemberNames():
            member = self.getMember(name)
            if member is not None:
                memberlist.append(member)
        return memberlist


class DeletedFolder(HistoryFolder):
    def __init__(self, path, environ, content: data.Content):
        super(DeletedFolder, self).__init__(path, environ, content, HistoryType.Deleted)

        self._api = ContentApi(
            current_user=self._user,
            show_deleted=True
        )

        self._file_count = 0

    def __repr__(self):
        return "Folder history of : %s" % self._content.file_name

    def __eq__(self, other):
        return self._content.id == other.content.id

    def getCreationDate(self):
        return mktime(datetime.now().timetuple())

    def getDisplayName(self):
        return '.deleted'

    def getLastModified(self):
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label):

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(self.path + content.get_label(), self.environ)

    def getMemberNames(self):
        retlist = []
        for content in self._api.get_all(self._content.id, ContentType.Any):
            if content.is_deleted:
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

    def handleCopy(self, destPath, depthInfinity):
        return True

    def handleMove(self, destPath):
        return True

    def setLastModified(self, destpath, timestamp, dryrun):
        return False

    def getMemberList(self):
        memberlist = []
        for name in self.getMemberNames():
            member = self.getMember(name)
            if member is not None:
                memberlist.append(member)

        if self._file_count > 0 and self.environ['REQUEST_METHOD'] not in ['MOVE, COPY, DELETE']:
            memberlist.append(HistoryFolder(self.path + ".history", self.environ, self._content, HistoryType.Deleted))

        return memberlist


class ArchivedFolder(HistoryFolder):
    def __init__(self, path, environ, content):
        super(ArchivedFolder, self).__init__(path, environ, content, HistoryType.Archived)

        self._api = ContentApi(
            current_user=self._user,
            show_archived=True
        )

        self._file_count = 0

    def __repr__(self):
        return "Folder history of : %s" % self._content.file_name

    def __eq__(self, other):
        return self._content.id == other.item.id

    def getCreationDate(self):
        return mktime(datetime.now().timetuple())

    def getDisplayName(self):
        return '.archived'

    def getLastModified(self):
        return mktime(datetime.now().timetuple())

    def getMember(self, content_label):

        content = self._api.get_one_by_label_and_parent(
            content_label=content_label,
            content_parent=self._content
        )

        return self.provider.getResourceInst(self.path + content.get_label(), self.environ)

    def getMemberNames(self):
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

    def handleCopy(self, destPath, depthInfinity):
        return True

    def handleMove(self, destPath):
        return True

    def setLastModified(self, destpath, timestamp, dryrun):
        return False

    def getMemberList(self):
        memberlist = []
        for name in self.getMemberNames():
            member = self.getMember(name)
            if member is not None:
                memberlist.append(member)

        if self._file_count > 0 and self.environ['REQUEST_METHOD'] not in ['MOVE, COPY, DELETE']:
            memberlist.append(HistoryFolder(self.path + ".history", self.environ, self._content, HistoryType.Archived))

        return memberlist


class HistoryFileFolder(HistoryFolder):
    def __init__(self, path, environ, content):
        super(HistoryFileFolder, self).__init__(path, environ, content, HistoryType.All)

    def __repr__(self):
        return "File folder history of : %s" % self._content.file_name

    def getDisplayName(self):
        return self._content.get_label()

    def createCollection(self, name):
        raise DAVError(HTTP_FORBIDDEN)

    def createEmptyResource(self, name):
        return DummyResource2(content=self._content, content_api=self._api, file_name=name)

    def getMemberNames(self):
        return [content.revision_id for content in self._content.revisions]

    def getMember(self, item_id):
        rev = None
        for revision in self._content.revisions:
            if revision.revision_id == item_id:
                rev = revision
                break

        if self._content.type == ContentType.File:
            return HistoryFile(self.path + str(rev.revision_id) + '-' + rev.file_name, self.environ, self._content, rev)
        else:
            return HistoryOtherFile(self.path + str(rev.revision_id) + '-' + rev.get_label(), self.environ, self._content, rev)

    def delete(self):
        raise DAVError(HTTP_FORBIDDEN)


class DummyResource(object):
    def __init__(self, file_name: str, content: Content, content_api: ContentApi):
        self._file_name = file_name
        self._content = content
        self._api = content_api

    def beginWrite(self, contentType) -> MyFileStream2:
        return MyFileStream2(file_name=self._file_name, content=self._content, content_api=self._api)

    def endWrite(self, withErrors):
        pass


class DummyResource2(object):
    def __init__(self, content: Content, content_api: ContentApi, file_name: str=''):
        self._content = content
        self._api = content_api
        self._file_name = file_name

    def beginWrite(self, contentType) -> MyFileStream:
        return MyFileStream(content=self._content, content_api=self._api, file_name=self._file_name)

    def endWrite(self, withErrors: bool):
        pass


class File(DAVNonCollection):
    def __init__(self, path, environ, content: Content, is_new_file: bool):
        super(File, self).__init__(path, environ)

        self._content = content

        self._user = UserApi(None).get_one_by_email(environ['http_authenticator.username'])
        self._api = ContentApi(
            current_user=self._user,
            show_archived=True,
            show_deleted=True
        )

        self.filestream = MyFileStream(content=self._content, content_api=self._api)

    def __repr__(self):
        return "File: %s" % self._content.get_label()

    def __eq__(self, other):
        return self._content.id == other.item.id

    def getContentLength(self):
        return len(self._content.file_content)

    # todo from db
    def getContentType(self):
        return util.guessMimeType(self._content.file_name)

    def getCreationDate(self):
        return mktime(self._content.created.timetuple())

    def getDisplayName(self):
        return self._content.get_label()

    def getLastModified(self):
        return mktime(self._content.updated.timetuple())

    def getContent(self):
        if PY3:
            filestream = compat.BytesIO()
        else:
            filestream = compat.StringIO()
        filestream.write(self._content.file_content)
        filestream.seek(0)

        return filestream

    def beginWrite(self, contentType=None):
        return self.filestream

    def copyMoveSingle(self, destpath, ismove):
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
            raise DAVError("wowo")

    def supportRecursiveMove(self, dest):
        return True

    def delete(self):
        Encapsuler(ActionDescription.DELETION, self._api, self._content).action()

    def moveRecursive(self, destpath):
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

    def setLastModified(self, dest, timestamp, dryrun):
        self._content.updated = datetime.fromtimestamp(timestamp)
        return True


def create_readable_date(some_date):
    aff = ''

    delta = datetime.now() - some_date

    if delta.days > 0:
        if delta.days >= 365:
            aff = '%d year%s ago' % (delta.days/365, 's' if delta.days/365>=2 else '')
        elif delta.days >= 30:
            aff = '%d month%s ago' % (delta.days/30, 's' if delta.days/30>=2 else '')
        else:
            aff = '%d day%s ago' % (delta.days, 's' if delta.days>=2 else '')
    else:
        if delta.seconds < 60:
            aff = '%d second%s ago' % (delta.seconds, 's' if delta.seconds>1 else '')
        elif delta.seconds/60 < 60:
            aff = '%d minute%s ago' % (delta.seconds/60, 's' if delta.seconds/60>=2 else '')
        else:
            aff = '%d hour%s ago' % (delta.seconds/3600, 's' if delta.seconds/3600>=2 else '')

    return aff

class HistoryFile(File):
    def __init__(self, path, environ, content: data.Content, content_revision: data.ContentRevisionRO):
        super(HistoryFile, self).__init__(path, environ, content, False)
        self._content_revision = content_revision

    def __repr__(self):
        return "File history: %s-%s" % (self._content.content_id, self._content.file_name)

    def getDisplayName(self):
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
    def __init__(self, path, environ, content: Content):
        super(OtherFile, self).__init__(path, environ, content, False)

    def __repr__(self):
        return "File: %s" % self._content.file_name

    def getContentLength(self):
        if self._content.type == ContentType.Page:
            return len(self.designPage(self._content))
        else:
            return len(self.designThread(self._content))

    def getContentType(self):
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

    def designPage(self, content):
        #f = open('wsgidav/addons/webdav/style.css', 'r')
        style = ''#f.read()
        #f.close()

        hist = self._content.get_history()
        histHTML = '<table class="table table-striped table-hover">'
        for event in hist:
            if isinstance(event, VirtualEvent):
                date = create_readable_date(event.created)
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
                <tr class="%s">
                    <td class="my-align"><span class="label label-default"><i class="fa %s"></i> %s</span></td>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%s</td>
                </tr>
                ''' % ('warning' if event.id == content.revision_id else '',
                       event.type.icon,
                       label,
                       date,
                       event.owner.display_name,
                       '<i class="fa fa-caret-left"></i> shown' if event.id == content.revision_id else '''<span><a class="revision-link" href="/.history/%s/%s-%s">(View revision)</a></span>''' % (self._content.label, event.id, event.ref_object.label) if event.type.id == 'revision' else '')

        histHTML+='</table>'

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
                    <a class="btn btn-default">
                        <i class="fa fa-external-link"></i> View in tracim</a>
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
    <script type="text/javascript">
        window.onload = function() {
            elems = document.getElementsByClassName('revision-link');
            for(var i = 0; i<elems.length; i++) {
                test = window.location.href
                test += "/.." + elems[i].href.replace(/file:\/\//, "")
                elems[i].href = test
            }
        }
    </script>
</body>
</html>
        ''' % (content.label,
               content.label,
               self._content.created.strftime("%B %d, %Y at %H:%m"),
               self._content.owner.display_name,
               content.description,
               histHTML)

        return file

    def designThread(self, content):

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
                    ''' % (t.owner.display_name, create_readable_date(t.created), t.description)

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
                           create_readable_date(t.created),
                           label,
                           '''<span><a class="revision-link" href="/.history/%s/%s-%s">(View revision)</a></span>''' % (
                               self._content.label,
                               t.id,
                               t.ref_object.label) if t.type.id == 'revision' else '')

        descP = ''
        for name, infos in participants.items():
            descP = '''
            <div><b>%s</b> - %d message%s - last %s</div>
            ''' % (name,
                 infos[0],
                 's' if infos[0]>1 else '',
                   create_readable_date(infos[1]))

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
    <div id="left" class="col-lg-8 col-md-12 col-sm-12 col-xs-12">
        <div class="title thread">
            <div class="title-text">
                <i class="fa fa-comments-o title-icon thread"></i>
                <h1>%s</h1>
                <h6>thread created on <b>%s</b> by <b>%s</b></h6>
            </div>
            <div class="pull-right">
                <div class="btn-group btn-group-vertical">
                    <a class="btn btn-default">
                        <i class="fa fa-external-link"></i> View in tracim</a>
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
    <div id="right" class="col-lg-4 col-md-12 col-sm-12 col-xs-12">
        <h4>Participants</h4>
        %s
    </div>
    <script type="text/javascript">
        window.onload = function() {
            elems = document.getElementsByClassName('revision-link');
            for(var i = 0; i<elems.length; i++) {
                test = window.location.href
                test += "/.." + elems[i].href.replace(/file:\/\//, "")
                elems[i].href = test
            }
        }
    </script>
</body>
</html>
        ''' % (content.label,
               content.label,
               self._content.created.strftime("%B %d, %Y at %H:%m"),
               self._content.owner.display_name,
               content.description,
               disc,
               descP)

        return page


class HistoryOtherFile(OtherFile):
    def __init__(self, path, environ, content: data.Content, content_revision: data.ContentRevisionRO):
        super(HistoryOtherFile, self).__init__(path, environ, content)
        self._content_revision = content_revision

    def __repr__(self):
        return "File history: %s-%s" % (self._content.file_name, self._content.id)

    def getDisplayName(self):
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

    def getName(self):
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
