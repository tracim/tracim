# coding: utf-8

import pytest
import requests_mock
import re


@pytest.fixture
def mock_get_workspaces_and_webdav(requests_mock):
    requests_mock.get(
        'http://localhost:6543/api/v2/workspaces',
        json=[{'workspace_id': 1, 'slug': 'workspace-1', 'label': 'Workspace 1', 'sidebar_entries': [{'route': '/ui/workspaces/1/dashboard', 'label': 'Dashboard', 'fa_icon': 'home', 'hexcolor': '#fdfdfd', 'slug': 'dashboard'}, {'route': '/ui/workspaces/1/contents', 'label': 'All Contents', 'fa_icon': 'th', 'hexcolor': '#bbbbbb', 'slug': 'contents/all'}, {'route': '/ui/workspaces/1/contents?type=thread', 'label': 'Threads', 'fa_icon': 'comments-o', 'hexcolor': '#428BCA', 'slug': 'contents/thread'}, {'route': '/ui/workspaces/1/contents?type=file', 'label': 'Files', 'fa_icon': 'paperclip', 'hexcolor': '#ffa500', 'slug': 'contents/file'}, {'route': '/ui/workspaces/1/contents?type=html-document', 'label': 'Text Documents', 'fa_icon': 'file-text-o', 'hexcolor': '#00CC00', 'slug': 'contents/html-document'}], 'description': '', 'is_deleted': False}]
    )
    matcher = re.compile('localhost:3030')
    requests_mock.get(matcher, body=b'')
    yield requests_mock


@pytest.fixture
def mock_get_contents_first_sync(requests_mock):
    requests_mock.get(
        'http://localhost:6543/api/v2/workspaces/1/contents/extended',
        json=[{'status': 'open', 'workspace_id': 1, 'current_revision_id': 2, 'is_archived': False, 'is_deleted': False, 'file_extension': '.document.html', 'filename': 'Document de niveau 1.document.html', 'show_in_ui': True, 'content_id': 1, 'label': 'Document de niveau 1', 'parent_id': None, 'slug': 'document-de-niveau-1', 'sub_content_types': ['comment'], 'content_type': 'html-document', 'is_editable': True, 'modified': '2019-02-01T13:06:08Z', 'created': '2019-02-01T13:05:36Z'}, {'status': 'open', 'workspace_id': 1, 'current_revision_id': 3, 'is_archived': False, 'is_deleted': False, 'file_extension': '', 'filename': 'Dossier de niveau 1', 'show_in_ui': True, 'content_id': 2, 'label': 'Dossier de niveau 1', 'parent_id': None, 'slug': 'dossier-de-niveau-1', 'sub_content_types': ['file', 'html-document', 'thread', 'folder', 'comment'], 'content_type': 'folder', 'is_editable': True, 'modified': '2019-02-01T13:06:28Z', 'created': '2019-02-01T13:06:28Z'}] # nopep8
    )
    yield requests_mock


@pytest.fixture
def mock_get_contents_new_content(requests_mock):
    requests_mock.get(
        'http://localhost:6543/api/v2/workspaces/1/contents/extended',
        json=[{'workspace_id': 1, 'show_in_ui': True, 'is_editable': True, 'modified': '2019-02-01T14:02:52Z', 'label': 'firstOrderLogic', 'sub_content_types': ['comment'], 'current_revision_id': 5, 'is_deleted': False, 'is_archived': False, 'parent_id': 2, 'content_id': 3, 'file_extension': '.pdf', 'created': '2019-02-01T14:02:52Z', 'content_type': 'file', 'status': 'open', 'filename': 'firstOrderLogic.pdf', 'slug': 'firstorderlogic'}]

    )
    yield requests_mock


@pytest.fixture
def mock_get_contents_update_content(requests_mock):
    requests_mock.get(
        'http://localhost:6543/api/v2/workspaces/1/contents/extended',
        json=[{'show_in_ui': True, 'status': 'open', 'label': 'Document de niveau 1', 'current_revision_id': 6, 'created': '2019-02-01T13:05:36Z', 'content_id': 1, 'parent_id': None, 'modified': '2019-02-01T14:07:46Z', 'filename': 'Document de niveau 1.document.html', 'sub_content_types': ['comment'], 'content_type': 'html-document', 'file_extension': '.document.html', 'slug': 'document-de-niveau-1', 'is_deleted': False, 'workspace_id': 1, 'is_editable': True, 'is_archived': False}]
    )
    yield requests_mock


@pytest.fixture
def mock_get_contents_move_content(requests_mock):
    requests_mock.get(
        'http://localhost:6543/api/v2/workspaces/1/contents/extended',
        [{'sub_content_types': ['comment'], 'is_deleted': False, 'current_revision_id': 9, 'file_extension': '.document.html', 'modified': '2019-02-01T14:18:47Z', 'is_archived': False, 'label': 'Document de niveau 1', 'show_in_ui': True, 'status': 'open', 'workspace_id': 1, 'content_id': 1, 'filename': 'Document de niveau 1.document.html', 'slug': 'document-de-niveau-1', 'content_type': 'html-document', 'is_editable': True, 'created': '2019-02-01T13:05:36Z', 'parent_id': 2}]
    )
    yield requests_mock

@pytest.fixture
def mock_get_contents_rename_content(requests_mock):
    requests_mock.get(
        'http://localhost:6543/api/v2/workspaces/1/contents/extended',
        [{'show_in_ui': True, 'file_extension': '.document.html', 'content_id': 1, 'is_deleted': False, 'slug': 'document-de-niveau-2', 'content_type': 'html-document', 'filename': 'Document de niveau 2.document.html', 'parent_id': 2, 'created': '2019-02-01T13:05:36Z', 'workspace_id': 1, 'is_editable': True, 'status': 'open', 'is_archived': False, 'modified': '2019-02-01T14:29:23Z', 'label': 'Document de niveau 2', 'current_revision_id': 10, 'sub_content_types': ['comment']}]
    )
    yield requests_mock
