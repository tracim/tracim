# coding: utf8

import transaction
from wsgidav import util
from wsgidav import compat

from tracim.lib.content import ContentApi
from tracim.model import new_revision
from tracim.model.data import ActionDescription
from tracim.model.data import ContentType
from tracim.model.data import Content
from tracim.model.data import Workspace


class HistoryType(object):
    Deleted = 'deleted'
    Archived = 'archived'
    Standard = 'standard'
    All = 'all'


class SpecialFolderExtension(object):
    Deleted = '/.deleted'
    Archived = '/.archived'
    History = '/.history'


class FakeFileStream(object):
    """
    Fake a FileStream that we're giving to wsgidav to receive data and create files / new revisions

    There's two scenarios :
    - when a new file is created, wsgidav will call the method createEmptyResource and except to get a _DAVResource
    which should have both 'beginWrite' and 'endWrite' method implemented
    - when a file which already exists is updated, he's going to call the 'beginWrite' function of the _DAVResource
    to get a filestream and write content in it

    In the first case scenario, the transfer takes two part : it first create the resource (createEmptyResource)
    then add its content (beginWrite, write, close..). If we went without this class, we would create two revision
    of the file upon creating a new file, which is not what we want.
    """

    def __init__(self, content_api: ContentApi, workspace: Workspace, path: str,
                 file_name: str='', content: Content=None, parent: Content=None):
        """

        :param content_api:
        :param workspace:
        :param path:
        :param file_name:
        :param content:
        :param parent:
        """
        self._file_stream = compat.BytesIO()

        self._file_name = file_name if file_name != '' else self._content.file_name
        self._content = content
        self._api = content_api
        self._workspace = workspace
        self._parent = parent
        self._path = path

    def getRefUrl(self) -> str:
        """
        As wsgidav expect to receive a _DAVResource upon creating a new resource, this method's result is used
        by Windows client to establish both file's path and file's name
        """
        return self._path

    def beginWrite(self, contentType) -> 'FakeFileStream':
        """
        Called by wsgidav, it expect a filestream which possess both 'write' and 'close' operation to write
        the file content.
        """
        return self

    def endWrite(self, withErrors: bool):
        """
        Called by request_server when finished writing everything.
        As we call operation to create new content or revision in the close operation, called before endWrite, there
        is nothing to do here.
        """
        pass

    def write(self, s: str):
        """
        Called by request_server when writing content to files, we put it inside a filestream
        """
        self._file_stream.write(s)

    def close(self):
        """
        Called by request_server when the file content has been written. We either add a new content or create
        a new revision
        """

        self._file_stream.seek(0)

        if self._content is None:
            self.create_file()
        else:
            self.update_file()

        transaction.commit()

    def create_file(self):
        """
        Called when this is a new file; will create a new Content initialized with the correct content
        """

        is_temporary = self._file_name.startswith('.~') or self._file_name.startswith('~')

        file = self._api.create(
            content_type=ContentType.File,
            workspace=self._workspace,
            parent=self._parent,
            is_temporary=is_temporary
        )

        self._api.update_file_data(
            file,
            self._file_name,
            util.guessMimeType(self._file_name),
            self._file_stream.read()
        )

        self._api.save(file, ActionDescription.CREATION)

    def update_file(self):
        """
        Called when we're updating an existing content; we create a new revision and update the file content
        """

        with new_revision(self._content):
            self._api.update_file_data(
                self._content,
                self._file_name,
                util.guessMimeType(self._content.file_name),
                self._file_stream.read()
            )

            self._api.save(self._content, ActionDescription.EDITION)
