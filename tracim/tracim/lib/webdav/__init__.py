from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

some_engine = create_engine('postgresql://arnaud:wxc@localhost/template1')
Session = sessionmaker(bind=some_engine)

from wsgidav.compat import to_bytes

from tracim.lib.content import ContentApi
from tracim.model import new_revision
from tracim.model.data import ActionDescription, ContentType, Content
from wsgidav import util

import transaction
Base.metadata.create_all(some_engine)

role = {
    'NOT_APPLICABLE': 0,
    'READER': 1,
    'CONTRIBUTOR': 2,
    'CONTENT_MANAGER': 4,
    'WORKSPACE_MANAGER': 8
}

class HistoryType(object):
    Deleted = 'deleted'
    Archived = 'archived'
    Standard = 'standard'
    All = 'all'

# not_applicable : nothing
# reader : can only read everything in designed workspace
# contributor : + create / modify files
# content_manager : + delete files / create directory / delete directory
# workspace_manager : + create workspace / delete workspace

class MyFileStream(object):
    def __init__(self, content: Content, content_api: ContentApi, file_name: str=''):
        self.buflist = []
        self._content = content
        self._api = content_api

        self._file_name = file_name if file_name != '' else self._content.file_name

    def write(self, s):
        self.buflist.append(s)

    def close(self):
        tot = to_bytes('')
        for buf in self.buflist:
            tot += buf

        with new_revision(self._content):
            self._api.update_file_data(self._content, self._file_name, util.guessMimeType(self._content.file_name), tot)
            self._api.save(self._content, ActionDescription.EDITION)

        transaction.commit()


class MyFileStream2(object):
    def __init__(self, file_name: str, content: Content, content_api: ContentApi):
        self.buflist = []
        self._file_name = file_name
        self._content = content
        self._api = content_api

    def write(self, s):
        self.buflist.append(s)

    def close(self):
        tot = to_bytes('')
        for buf in self.buflist:
            tot += buf

        file = self._api.create(ContentType.File, self._content.workspace, self._content)
        self._api.update_file_data(file, self._file_name, util.guessMimeType(self._file_name), tot)
        self._api.save(file, ActionDescription.CREATION)

        transaction.commit()