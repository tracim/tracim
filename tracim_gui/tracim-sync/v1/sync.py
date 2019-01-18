# utf-8

import json
import os
import shutil
import time
from urllib.parse import urlparse
from stat import S_IREAD, S_IRGRP, S_IROTH

import pytz
import requests
from dateutil import parser
from url_normalize import url_normalize
from tzlocal import get_localzone

WORKSPACE_URL = '{remote}/api/v2/workspaces'
CONTENT_URL = '{remote}/api/v2/workspaces/{workspace_id}/contents'
FILE_URL = '{remote}/api/v2/workspaces/{workspace_id}/files/{content_id}'
WEBDAV_FILE_URL = '{webdav}/{file_path}/'

FOLDER_TYPE = 'folder'

conf = {
    "remote_urls": ["http://localhost:6543"],
    "root_folder_path": '/tmp/tracim',
    "tracim": {
        "excluded_workspaces": [],
        "excluded_folders": [],
        "label": "localhost:6543",
        "url": "http://localhost:6543",
        "auth": {
            "login": "admin@admin.admin",
            "password": "admin@admin.admin"
        },
        "webdav": {
            "url": "http://localhost:3030"
        }
    }
}


def sync_remotes(root_folder_path, remotes):
    assert remotes, 'You must give at least one remote url'
    create_folder_or_ignore(root_folder_path)
    for remote in remotes:
        remote_folder_path = os.path.join(
            root_folder_path, conf.get(remote).get('label')
        )
        create_folder_or_ignore(remote_folder_path)
        sync_workspaces(remote, remote_folder_path)


def sync_workspaces(remote_url, remote_folder_path):

    for workspace in get_workspace_list(remote_url):
        workspace_id = workspace.get('workspace_id')
        workspace_folder_path = os.path.join(
            remote_folder_path, workspace.get('label')
        )
        create_folder_or_ignore(workspace_folder_path)
        file_list = get_file_list(remote_url, workspace_id)
        sync_files(workspace_folder_path, None, file_list, remote_url)
        folder_list = get_folder_list(remote_url, workspace_id)
        sync_sub_folders(
            folder_list, None, workspace_folder_path, file_list, remote_url
        )


def sync_files(folder_path, folder_id, file_list, remote_url):

    for i, file in enumerate(file_list):
        if file.get('parent_id', -1) == folder_id:
            file_path = os.path.join(folder_path, file.get('filename'))
            if file_up_to_date(file_path, file):
                continue
            create_or_update_file(remote_url, file_path)
            os.chmod(file_path, S_IREAD | S_IRGRP | S_IROTH)
            file_list.pop(i)


def create_or_update_file(remote_url, file_path):
    tracim_file_path = file_path.replace(
        conf.get('root_folder_path') + '/', ''
    )
    tracim_file_path = tracim_file_path.replace(
        conf.get(remote_url).get('label'), ''
    )
    url = WEBDAV_FILE_URL.format(
        webdav=conf.get(remote_url).get('webdav').get('url'),
        file_path=tracim_file_path
    )
    normalized_url = url_normalize(url)
    request = requests.get(
        normalized_url, auth=get_identifiers(remote_url), stream=True
    )

    with open(file_path, 'wb') as file_:
        request.raw.decode_content = True
        shutil.copyfileobj(request.raw, file_)


def sync_sub_folders(folder_list, parent_id, parent_path, file_list, remote_url):
    sub_folder_list = list(filter(
        lambda x: x.get('parent_id') == parent_id, folder_list
    ))
    for i, sub_folder in enumerate(sub_folder_list):
        sub_folder_id = sub_folder['content_id']
        sub_folder_path = os.path.join(parent_path, sub_folder.get('label'))
        create_folder_or_ignore(sub_folder_path)
        sub_folder_list.pop(i)
        sync_files(sub_folder_path, sub_folder_id, file_list, remote_url)
        sync_sub_folders(
            folder_list, sub_folder_id, sub_folder_path, file_list, remote_url
        )


def get_folder_list(remote_url, workspace_id):
    contents = load_contents_from_remote(remote_url, workspace_id)

    folder_list = list()
    excluded_folder_list = conf.get(remote_url).get('excluded_folders')
    for content in contents:
        if content.get('content_id', -1) in excluded_folder_list:
            print(
                'Folder {} is excluded from sync'.format(
                    content['content_id']
                )
            )
        elif is_tracim_folder(content):
            folder_list.append(content)
    return folder_list


def get_workspace_list(remote_url):
    workspaces = load_workspaces_from_remote(remote_url)

    workspace_list = list()
    excluded_workspace_list = conf.get(remote_url).get('excluded_workspaces')
    for workspace in workspaces:
        if workspace.get('workspace_id', -1) in excluded_workspace_list:
            print(
                'Workspace id: {} is excluded from sync'.format(
                    workspace['workspace_id']
                )
            )
        else:
            workspace_list.append(workspace)
    return workspace_list


def get_file_list(remote_url, workspace_id):
    return list(filter(
        lambda x: not is_tracim_folder(x),
        load_contents_from_remote(remote_url, workspace_id)
    ))


def get_identifiers(remote_url):
    auth = conf.get(remote_url).get('auth')
    return (auth.get('login'), auth.get('password'))


def load_contents_from_remote(remote_url, workspace_id):
    request = requests.get(
        CONTENT_URL.format(remote=remote_url, workspace_id=workspace_id),
        auth=get_identifiers(remote_url)
    )
    if request.status_code != 200:
        print(request.reason)
        return
    return json.loads(request.content.decode('utf-8'))


def load_workspaces_from_remote(remote_url):
    request = requests.get(
        WORKSPACE_URL.format(remote=remote_url),
        auth=get_identifiers(remote_url)
    )
    if request.status_code != 200:
        print(request.reason)
        return
    return json.loads(request.content.decode('utf-8'))


def create_folder_or_ignore(folder_path):
    if not (os.path.exists(folder_path) and os.path.isdir(folder_path)):
        os.mkdir(folder_path)


def is_tracim_folder(tracim_content):
    return tracim_content.get('content_type') == FOLDER_TYPE


def file_up_to_date(file_path, tracim_file):
    if not os.path.exists(file_path):
        print("File {} is not up to date".format(tracim_file.get('filename')))
        return False

    if not os.path.isfile(file_path):
        print("File {} is not up to date".format(tracim_file.get('filename')))
        return False

    remote_dt = parser.parse(tracim_file.get('modified'))

    # INFO BL - 2018.12.28 - If the remote modified datetime is
    # inferior to the system modified datetime then the file is up to date
    res = remote_dt < last_modification_date(file_path)
    if not res:
        print("File {} is not up to date".format(tracim_file.get('filename')))
    return res


def last_modification_date(path_to_file):
    file_dt = parser.parse(time.ctime(os.path.getctime(path_to_file)))
    local_file_dt = get_localzone().localize(file_dt)
    return local_file_dt.astimezone(pytz.utc)


if __name__ == "__main__":
    sync_remotes('/tmp/tracim', ["http://localhost:6543"])
