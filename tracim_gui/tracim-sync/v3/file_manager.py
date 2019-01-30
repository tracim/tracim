# coding: utf-8
import os
import requests

from config import ConfigParser
from db import session
from models import ContentModel
from models import Flag
from url_normalize import url_normalize
import shutil


config = ConfigParser().load_config_from_file()
url = '{remote}/api/v2/workspaces/{workspace_id}/files/{content_id}/revisions/{revision_id}/raw/{filename}'

class FileManager(object):

    def __init__(self):
        self.create_base()
        self.config = config

    def create_base(self):
        dirs = session.query(
            ContentModel.instance_label,
            ContentModel.workspace_label
        ).distinct().all()
        for dir_ in dirs:
            self.create_dirs(os.path.join(*dir_))

    def update_local_files(self):
        self.move_contents()
        self.delete_contents()
        self.update_files()
        self.create_contents()
        session.commit()

    def delete_contents(self):
        contents = self.get_contents_by_flag(Flag.DELETED)

        for content in contents:
            print('deleting {}'.format(content.relative_path))
            self.delete_content(content)
            session.delete(content)

    def delete_content(self, content):
        absolute_path = self.get_absolute_path(content)
        if content.content_type == 'folder':
            shutil.rmtree(absolute_path)
        else:
            os.remove(absolute_path)

    def move_contents(self):
        contents = self.get_contents_by_flag(Flag.MOVED)

        for content in contents:
            self.move_content(content)
            print('updating {}'.format(content.relative_path))
            if not content.content_type == 'folder':
                self.create_or_update_file(content)
            content.flag = Flag.SYNCED
            session.merge(content)
            for sub_content in content.children:
                session.merge(sub_content)

    def move_content(self, content):
        old_absolute_path = self.get_absolute_path(content)
        content.set_relative_path()
        new_absolute_path = self.get_absolute_path(content)
        print('moving from {} to {}'.format(
                old_absolute_path,
                new_absolute_path
            )
        )
        shutil.move(old_absolute_path, new_absolute_path)

    def update_files(self):
        contents = self.get_contents_by_flag(Flag.CHANGED)
        for content in contents:
            self.create_or_update_file(content)
            content.flag = Flag.SYNCED
            session.merge(content)
        

    def create_contents(self):
        contents = self.get_contents_by_flag(Flag.NEW)

        for content in contents:
            content.set_relative_path()
            print('new file {}'.format(content.relative_path))
            self.create_content(content)
            content.flag = Flag.SYNCED
            session.merge(content)

    def create_content(self, content):
        if content.content_type == 'folder':
            self.create_dirs(content.relative_path)
        else:
            self.create_or_update_file(content)

    def get_contents_by_flag(self, flag: Flag):
        return session\
            .query(ContentModel)\
            .filter(ContentModel.flag == flag)\
            .order_by(ContentModel.remote_id)\
            .all()

    def create_or_update_file(self, content):
        instance_params= self.config.get_instance(content.instance_label)
        normalized_url = self.get_download_url(content)
        request = requests.get(
            normalized_url, auth=(instance_params['login'], instance_params['password']), stream=True
        )

        absolute_path = os.path.join(
            self.config.BASE_FOLDER,
            content.relative_path
        )
        with open(absolute_path, 'wb') as file_:
            request.raw.decode_content = True
            shutil.copyfileobj(request.raw, file_)

    def create_dirs(self, dir_path):
        os.makedirs(
            os.path.join(config.BASE_FOLDER, dir_path),
            exist_ok=True
        )

    def get_absolute_path(self, content):
        return os.path.join(
            self.config.BASE_FOLDER,
            content.relative_path
        )
            
    def get_download_url(self, content):
        return url_normalize(os.path.join(
            self.config.get_instance(content.instance_label)['webdav']['url'],
            content.relative_path[len(content.instance_label) + 1 :]
            )
        )

    
    



