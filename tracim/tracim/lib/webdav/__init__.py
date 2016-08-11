from wsgidav.compat import to_bytes

from tracim.lib.content import ContentApi
from tracim.model import new_revision
from tracim.model.data import ActionDescription, ContentType, Content, Workspace
from wsgidav import util

import transaction
from wsgidav import compat

class HistoryType(object):
    Deleted = 'deleted'
    Archived = 'archived'
    Standard = 'standard'
    All = 'all'


class FakeFileStream(object):
    """Fake a FileStream object that is needed by wsgidav to create or update existing files
    with new content"""

    def __init__(self, content_api: ContentApi, workspace: Workspace,
                 file_name: str='', content: Content=None, parent: Content=None):
        """

        :param file_name: the filename if the file is new
        :param content_api:
        :param workspace: content's workspace, necessary if the file is new as we've got no other way to get it
        :param content: either the content to be updated or None if it's a new file
        """
        self._buff = compat.BytesIO()

        self._file_name = file_name if file_name != '' else self._content.file_name
        self._content = content
        self._api = content_api
        self._workspace = workspace
        self._parent = parent

    def beginWrite(self, contentType) -> 'FakeFileStream':
        """Called by request_server to user as a file stream to write bits by bits content into a filestream"""
        return self

    def endWrite(self, withErrors: bool):
        """Called by request_server when finished writing everythin, wdc"""
        pass

    def write(self, s: str):
        """Called by request_server when writing content to files, we stock it in our file"""
        self._buff.write(s)

    def close(self):
        """Called by request_server when everything has been written and we either update the file or
        create a new file"""

        self._buff.seek(0)

        if self._content is None:
            self.create_file(self._buff)
        else:
            self.update_file(self._buff)

    def create_file(self, item_content):
        file = self._api.create(
            content_type=ContentType.File,
            workspace=self._workspace,
            parent=self._parent
            )

        self._api.update_file_data(
            file,
            self._file_name,
            util.guessMimeType(self._file_name),
            item_content.read()
        )

        self._api.save(file, ActionDescription.CREATION)

        transaction.commit()

    def update_file(self, item_content):
        with new_revision(self._content):
            self._api.update_file_data(
                self._content,
                self._file_name,
                util.guessMimeType(self._content.file_name),
                item_content.read()
            )
            self._api.save(self._content, ActionDescription.EDITION)

        transaction.commit()
