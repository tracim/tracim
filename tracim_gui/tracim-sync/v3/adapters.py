# coding: utf-8

import json

from enum import Enum
import requests


from tracim_sync_exceptions import ConnectionException


class ContentType(Enum):

    FOLDER = 'folder'
    DOCUMENT = 'html-document'
    THREAD = 'thread'
    FILE = 'file'
    COMMENT = 'comment'


class Url(Enum):

    WORKSPACE = "{remote}/api/v2/workspaces"
    CONTENT = "{remote}/api/v2/workspaces/{workspace_id}/contents"
    FOLDER = "{remote}/api/v2/workspaces/{workspace_id}/folders/{content_id}"
    FILE = "{remote}/api/v2/workspaces/{workspace_id}/files/{content_id}"
    THREAD = "{remote}/api/v2/workspaces/{workspace_id}/threads/{content_id}"  # nopep8
    DOCUMENT = "{remote}/api/v2/workspaces/{workspace_id}/html-documents/{content_id}"  # nopep8
    WEBDAV_FILE = "{webdav}/{file_path}/"


class ContentAdapter(object):

    _revision_id = None
    content_model = None

    def __init__(self, instance_label, workspace_label, content: dict):
        self.content = content
        self.instance_label = instance_label
        self.workspace_label = workspace_label

    @property
    def content_id(self) -> int:
        return int(self.content.get('content_id'))

    @property
    def label(self) -> str:
        return self.content.get('label')

    @property
    def parent_id(self) -> int:
        try:
            return int(self.content.get('parent_id'))
        except TypeError:
            return None

    @property
    def filename(self) -> str:
        return self.content.get('filename')

    @property
    def revision_id(self) -> int:
        return int(self._revision_id)

    @property
    def content_type(self):
        return self.content.get('content_type')

    @property
    def workspace_id(self):
        return self.content.get('workspace_id')

    @property
    def remote_id(self) -> int:
        return int(self.content_id)

    def set_revision_id(self, revision_id: int):
        self._revision_id = revision_id

    def is_file(self) -> bool:
        return ContentType.FILE.value == self.content_type

    def is_folder(self) -> bool:
        return ContentType.FOLDER.value == self.content_type

    def is_thread(self) -> bool:
        return ContentType.THREAD.value == self.content_type

    def is_document(self) -> bool:
        return ContentType.DOCUMENT.value == self.content_type

    def is_comment(self) -> bool:
        return ContentType.COMMENT.value == self.content_type

    def is_sub_content_of(self, parent_id: int) -> bool:
        return self.parent_id == parent_id

    def __repr__(self) -> str:
        return '<Content {}>'.format(self.__str__())

    def __str__(self) -> str:
        return 'id:{}, parent:{}, type:{}'.format(
            self.content_id,
            self.parent_id,
            self.content_type
        )


class WorkspaceAdapter(object):

    def __init__(self, workspace: dict):
        self.workspace = workspace

    @property
    def workspace_id(self):
        return self.workspace.get('workspace_id')

    @property
    def remote_id(self):
        return self.workspace_id

    @property
    def label(self):
        return self.workspace.get('label')

    def get_path(self):
        return self.label


class InstanceAdapter(object):

    def __init__(self, instance_label: str, instance_params: dict):
        self.label = instance_label
        self.remote_url = instance_params.get('url')
        self.auth = (
            instance_params.get('login'),
            instance_params.get('password')
        )
        self.webdav_url = instance_params.get('webdav')
        self.excluded_workspaces = instance_params.get('excluded_workspaces')
        self.excluded_folders = instance_params.get('excluded_folders')

    def load_all_contents(self):

        workspaces = self.load_workspaces()
        contents = list()
        for workspace in workspaces:
            contents += self.load_workspace_contents(workspace)
        return contents

    def load_workspaces(self):
        request = requests.get(
            Url.WORKSPACE.value.format(remote=self.remote_url),
            auth=self.auth
        )
        if request.status_code != 200:
            raise ConnectionException(request.reason)
        workspaces = list()
        tracim_workspaces = json.loads(request.content.decode('utf-8'))

        for tracim_workspace in tracim_workspaces:
            workspace = WorkspaceAdapter(tracim_workspace)
            if workspace.workspace_id not in self.excluded_workspaces:
                workspaces.append(workspace)

        return workspaces

    def load_workspace_contents(self, workspace: WorkspaceAdapter):
        workspace_id = workspace.workspace_id
        url = Url.CONTENT.value.format(
            remote=self.remote_url, workspace_id=workspace_id
        )
        request = requests.get(
            url,
            auth=self.auth
        )
        if request.status_code != 200:
            raise ConnectionException('{} - {}'.format(request.reason, url))
        contents = list()
        tracim_contents = json.loads(request.content.decode('utf-8'))

        for tracim_content in tracim_contents:
            content = ContentAdapter(
                self.label,
                workspace.label,
                tracim_content
            )
            if content.is_file():
                content.set_revision_id(self.load_file_revision_id(
                    workspace_id=workspace_id,
                    content_id=content.content_id
                ))

            if content.is_document():
                content.set_revision_id(self.load_document_revision_id(
                    workspace_id=workspace_id,
                    content_id=content.content_id
                ))

            if content.is_folder():
                content.set_revision_id(self.load_folder_revision_id(
                    workspace_id=workspace_id,
                    content_id=content.content_id
                ))

            if content.is_thread():
                print('content ignored {}'.format(content.filename))
                # content.set_revision_id(self.load_thread_revision_id(
                    # workspace_id=workspace_id,
                    # content_id=content.content_id
                # ))

            if not (content.is_comment() or content.is_thread()):
                contents.append(content)
        return contents

    def load_file_revision_id(self, workspace_id: int, content_id: int):
        url = Url.FILE.value.format(
            remote=self.remote_url,
            workspace_id=workspace_id,
            content_id=content_id
        )
        request = requests.get(
            url,
            auth=self.auth
        )
        if request.status_code != 200:
            raise ConnectionException('{} - {}'.format(request.reason, url))

        return json.loads(
            request.content.decode('utf-8')
        )['current_revision_id']

    def load_thread_revision_id(self, workspace_id: int, content_id: int):
        url = Url.THREAD.value.format(
            remote=self.remote_url,
            workspace_id=workspace_id,
            content_id=content_id
        )
        request = requests.get(
            url,
            auth=self.auth
        )
        if request.status_code != 200:
            raise ConnectionException('{} - {}'.format(request.reason, url))

        return json.loads(
            request.content.decode('utf-8')
        )['current_revision_id']

    def load_document_revision_id(self, workspace_id: int, content_id: int):
        url = Url.DOCUMENT.value.format(
            remote=self.remote_url,
            workspace_id=workspace_id,
            content_id=content_id
        )
        request = requests.get(
            url,
            auth=self.auth
        )
        if request.status_code != 200:
            raise ConnectionException('{} - {}'.format(request.reason, url))

        return json.loads(
            request.content.decode('utf-8')
        )['current_revision_id']

    def load_folder_revision_id(self, workspace_id: int, content_id: int):
        url = Url.FOLDER.value.format(
            remote=self.remote_url,
            workspace_id=workspace_id,
            content_id=content_id
        )
        request = requests.get(
            url,
            auth=self.auth
        )
        if request.status_code != 200:
            raise ConnectionException('{} - {}'.format(request.reason, url))

        return json.loads(
            request.content.decode('utf-8')
        )['current_revision_id']
