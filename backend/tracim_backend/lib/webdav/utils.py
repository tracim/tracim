# -*- coding: utf-8 -*-
import tempfile

from sqlalchemy.orm import Session
import transaction
from wsgidav import util
from wsgidav.dav_error import HTTP_FORBIDDEN
from wsgidav.dav_error import DAVError

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import TracimException
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision


class HistoryType(object):
    Deleted = "deleted"
    Archived = "archived"
    Standard = "standard"
    All = "all"


class SpecialFolderExtension(object):
    Deleted = "/.deleted"
    Archived = "/.archived"
    History = "/.history"


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

    def __init__(
        self,
        session: Session,
        content_api: ContentApi,
        workspace: Workspace,
        path: str,
        file_name: str = "",
        content: Content = None,
        parent: Content = None,
    ):
        """

        :param content_api:
        :param workspace:
        :param path:
        :param file_name:
        :param content:
        :param parent:
        """
        # TODO - G.M - 2019-06-13 - use true streaming mechanism,
        # instead of a true streaming mechanism we use
        # a temporary file to avoid big file in memory without needing to refactor all
        # upload mechanism of WebDAV
        # see https://github.com/tracim/tracim/issues/1911
        self.temp_file = tempfile.NamedTemporaryFile(suffix="tracim_webdav_upload_")
        self._session = session
        self._file_name = file_name if file_name != "" else self._content.file_name
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

    def beginWrite(self, contentType) -> "FakeFileStream":
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
        self.temp_file.write(s)

    def close(self):
        """
        Called by request_server when the file content has been written. We either add a new content or create
        a new revision
        """

        self.temp_file.seek(0)

        if self._content is None:
            self.create_file()
        else:
            self.update_file()

        transaction.commit()
        self.temp_file.close()

    def create_file(self):
        """
        Called when this is a new file; will create a new Content initialized with the correct content
        """

        is_temporary = self._file_name.startswith(".~") or self._file_name.startswith("~")
        try:
            with self._session.no_autoflush:
                file = self._api.create(
                    filename=self._file_name,
                    content_type_slug=content_type_list.File.slug,
                    workspace=self._workspace,
                    parent=self._parent,
                    is_temporary=is_temporary,
                    do_save=False,
                )
                self._api.update_file_data(
                    file, self._file_name, util.guessMimeType(self._file_name), self.temp_file
                )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN) from exc
        self._api.save(file, ActionDescription.CREATION)

    def update_file(self):
        """
        Called when we're updating an existing content; we create a new revision and update the file content
        """
        try:
            with new_revision(session=self._session, content=self._content, tm=transaction.manager):
                self._api.update_file_data(
                    self._content,
                    self._file_name,
                    util.guessMimeType(self._content.file_name),
                    self.temp_file,
                )
        except TracimException as exc:
            raise DAVError(HTTP_FORBIDDEN) from exc

        self._api.save(self._content, ActionDescription.REVISION)

    def supportEtag(self):
        return False
