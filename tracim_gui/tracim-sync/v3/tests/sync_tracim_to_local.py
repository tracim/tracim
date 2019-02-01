# coding utf:8

import pytest
import requests
import shutil

import os
from db import session
from service import Service
from models import ContentModel

def clean_files():
    shutil.rmtree('/tmp/tracim-sync')
    os.remove('/tmp/test.sqlite')


def test_first_sync(mock_get_workspaces_and_webdav, mock_get_contents_first_sync):
    service = Service()
    service.main()
    assert session.query(ContentModel).count() == 2


def test_sync_new_content(mock_get_workspaces_and_webdav, mock_get_contents_new_content):
    service = Service()
    service.main()
    assert session.query(ContentModel).count() == 3


def test_sync_update_content(mock_get_workspaces_and_webdav, mock_get_contents_update_content):
    service = Service()
    service.main()
    assert session.query(ContentModel).count() == 3


def test_sync_move_content(mock_get_workspaces_and_webdav, mock_get_contents_move_content):
    service = Service()
    service.main()
    assert session.query(ContentModel).count() == 3


def test_sync_rename_content(mock_get_workspaces_and_webdav, mock_get_contents_rename_content):
    service = Service()
    service.main()
    assert session.query(ContentModel).count() == 3


def test_sync_rename_folder(mock_get_workspaces_and_webdav):
    raise NotImplementedError()


def test_sync_delete_content(mock_get_workspaces_and_webdav):
    raise NotImplementedError()


def test_sync_new_content_in_moved_folder(mock_get_workspaces_and_webdav):
    raise NotImplementedError()

clean_files()