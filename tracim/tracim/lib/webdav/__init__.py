from wsgidav.compat import to_bytes

from tracim.lib.content import ContentApi
from tracim.model import new_revision
from tracim.model.data import ActionDescription, ContentType, Content
from wsgidav import util

import transaction

class HistoryType(object):
    Deleted = 'deleted'
    Archived = 'archived'
    Standard = 'standard'
    All = 'all'


class FileStream(object):
    def __init__(self, file_name: str, content: Content, content_api: ContentApi, new_file: bool):
        self._buffer = []
        self._file_name = file_name if file_name != '' else self._content.file_name
        self._content = content
        self._api = content_api

    def beginWrite(self, contentType) -> FileStream:
        return self

    def endWrite(self, withErrors: bool):
        pass

    def write(self, s: str):
        self._buffer.append(s)

    def close(self):
        item_content = b''

        for part in self._buffer:
            item_content += part

        if new_file:
            file = self._api.create(
                content_type=ContentType.File,
                workspace=self._content.workspace,
                parent=self._content
                )

            self._api.update_file_data(
                file,
                self._file_name,
                util.guessMimeType(self._file_name),
                item_content
                )

            self._api.save(file, ActionDescription.CREATION)

        else:
            with new_revision(self._content):
                self._api.update_file_data(
                    self._content,
                    self._file_name,
                    util.guessMimeType(self._content.file_name),
                    item_content)
                self._api.save(self._content, ActionDescription.EDITION)

        transaction.commit()