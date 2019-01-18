import requests
import json
import os
from marshmallow import Schema, fields, pprint
from deepDiff import DeepDiff

WORKSPACE_URL = '{remote}/api/v2/workspaces'
CONTENT_URL = '{remote}/api/v2/workspaces/{workspace_id}/contents'
FILE_URL = '{remote}/api/v2/workspaces/{workspace_id}/files/{content_id}'
THREAD_URL = '{remote}/api/v2/workspaces/{workspace_id}/threads/{content_id}'
DOCUMENT_URL = '{remote}/api/v2/workspaces/{workspace_id}/html-documents/{content_id}'
WEBDAV_FILE_URL = '{webdav}/{file_path}/'


FOLDER_TYPE = 'folder'
DOCUMENT_TYPE = 'html-document'
THREAD_TYPE = 'thread'
FILE_TYPE = 'file'


class RemoteRevisionTree(object):

    workspaces = None
    contents = None

    def __init__(self, label='tracim', conf=None):
        if not conf:
            from sync import conf
            conf = conf
        self.connector = TracimConnector(conf.get(label))
        if self.workspaces is None:
            self.workspaces = list()
        self.label = label
        self.contents = dict()
        self.add_workspaces()
        self.build()

    def add_workspaces(self):
        for workspace in self.connector.load_workspaces():
            self.workspaces.append(
                RevisionNode(
                    content=workspace,
                    parent_node=None,
                )
            )

    def build(self):
        for node in self.workspaces:
            id_ = node.content.workspace_id
            self.contents[id_] = self.connector.load_workspace_contents(id_)
            node.build_children(
                tree=self,
                workspace_id=id_
            )

    def get_sub_contents(self, workspace_id, parent_id):
        sub_contents = list()
        if workspace_id == parent_id:
            parent_id = None
        for content in self.contents.get(workspace_id):
            if content.is_sub_content(parent_id):
                sub_contents.append(content)
        return sub_contents

    def serialize(self):
        schema = RemoteTreeSchema()
        return schema.dump(self).data

    def get_diff(self):
        with open('fake_dump.json') as json_file:
            json_dump = json.loads(json_file.read())

        return DeepDiff(json_dump, self.serialize())

    def update_node(self, node_path):
        node_list = self.format_node_to_list(node_path)

    def get_node(attr, node_id, node_list):
        container = getattr(self, )

    def format_node_to_list(self, node_path)

    '''
    format of the DeepDiff path is:
        `root['workspaces']['2']['children']['25']['revision_id']`
    We want to tranform it into a list like:
        ['workspaces', '2', 'children', '25', 'revision_id']
    '''

    # First remove root[ and the last ]
    node_path = node_path[5:-1]
    # Remove all the single quote as it's already a string
    node_path = node_path.replace("'", '')
    # Now we have something like "workspaces][2][children][25][revision_id"
    # so we can use ][ as a separator
    return node_path.split('][')






class RevisionNode(object):

    def __init__(self, content, parent_node):
        children = []
        self.content = content
        self.parent_node = parent_node
        self.revision_id = content.revision_id
        self.remote_id = content.remote_id

    def build_children(self, tree, workspace_id):
        self.children = list()
        contents = tree.get_sub_contents(
            workspace_id=workspace_id, parent_id=self.content.content_id
        )
        for content in contents:
            node = RevisionNode(
                content=content,
                parent_node=self,
            )
            self.children.append(node)
            if content.is_folder():
                node.build_children(tree, workspace_id)

    def get_full_path(self):
        if not self.parent_node:
            return self.content.get_path()
        return os.path.join(
            self.parent_node.get_full_path(),
            self.content.get_path()
        )

    def __repr__(self):
        return '<Node {}>'.format(self.content.__str__())


class ConnectionException(Exception):

    def __init__(self, message):
        self.message = message


class Content(object):

    _revision_id = None

    def __init__(self, tracim_content):
        self.content = tracim_content

    @property
    def content_id(self):
        return self.content.get('content_id')

    @property
    def label(self):
        return self.content.get('label')

    @property
    def parent_id(self):
        return self.content.get('parent_id')

    @property
    def filename(self):
        return self.content.get('filename')

    @property
    def revision_id(self):
        return self._revision_id

    @property
    def content_type(self):
        return self.content.get('content_type')

    @property
    def workspace_id(self):
        return self.content.get('workspace_id')

    @property
    def remote_id(self):
        return self.content_id

    def set_revision_id(self, revision_id):
        self._revision_id = revision_id

    def is_file(self):
        return self.content_type == FILE_TYPE

    def is_folder(self):
        return self.content_type == FOLDER_TYPE

    def is_thread(self):
        return self.content_type == THREAD_TYPE

    def is_document(self):
        return self.content_type == DOCUMENT_TYPE

    def is_comment(self):
        return self.content_type == 'comment'

    def is_sub_content(self, parent_id):
        return self.parent_id == parent_id

    def get_path(self):
        if self.is_folder():
            return self.label
        return self.filename

    def __repr__(self):
        return '<Content {}>'.format(self.__str__())

    def __str__(self):
        return 'id:{}, parent:{}, type:{}'.format(
            self.content_id,
            self.parent_id,
            self.content_type
        )


class Workspace(object):

    content_type = 'workspace'
    content_id = None
    revision_id = None

    def __init__(self, tracim_workspace):
        self.workspace = tracim_workspace

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


class TracimConnector(object):

    def __init__(self, conf):
        self.remote_url = conf.get('url')
        auth = conf.get('auth')
        self.auth = (auth.get('login'), auth.get('password'))
        self.webdav_url = conf.get('webdav')
        self.excluded_workspaces = conf.get('excluded_workspaces')
        self.excluded_folders = conf.get('excluded_folders')

    def load_workspaces(self):
        request = requests.get(
            WORKSPACE_URL.format(remote=self.remote_url),
            auth=self.auth
        )
        if request.status_code != 200:
            raise ConnectionException(request.reason)
        workspaces = list()
        tracim_workspaces = json.loads(request.content.decode('utf-8'))

        for tracim_workspace in tracim_workspaces:
            workspace = Workspace(tracim_workspace)
            if workspace.content_id not in self.excluded_workspaces:
                workspaces.append(workspace)

        return workspaces

    def load_workspace_contents(self, workspace_id):
        url = CONTENT_URL.format(
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
            content = Content(tracim_content)
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

            if content.is_thread():
                content.set_revision_id(self.load_thread_revision_id(
                    workspace_id=workspace_id,
                    content_id=content.content_id
                ))
            contents.append(content)

        return contents

    def load_file_revision_id(self, workspace_id, content_id):
        url = FILE_URL.format(
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

    def load_thread_revision_id(self, workspace_id, content_id):
        url = THREAD_URL.format(
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

    def load_document_revision_id(self, workspace_id, content_id):
        url = DOCUMENT_URL.format(
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


class NestedDict(fields.Nested):
    def __init__(self, nested, key, *args, **kwargs):
        super(NestedDict, self).__init__(nested, many=True, *args, **kwargs)
        self.key = key

    def _serialize(self, nested_obj, attr, obj):
        nested_list = super(NestedDict, self)._serialize(nested_obj, attr, obj)
        nested_dict = {str(item[self.key]): item for item in nested_list}
        for key, value in nested_dict.items():
            del value[self.key]
        return nested_dict

    def _deserialize(self, value, attr, data):
        raw_list = [item for key, item in value.items()]
        nested_list = super(NestedDict, self)._deserialize(raw_list, attr, data)
        return nested_list


class RemoteNodeSchema(Schema):

    revision_id = fields.Int()
    remote_id = fields.Int()
    label = fields.String()
    children = NestedDict('self', key='remote_id')


class RemoteTreeSchema(Schema):

    label = fields.Str()
    workspaces = NestedDict(RemoteNodeSchema, key='remote_id')


def setup_default():
    test = RemoteRevisionTree()
    return (test, test.workspaces[1].children[0])