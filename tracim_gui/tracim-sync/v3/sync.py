# coding: utf-8

from adapters import InstanceAdapter
from adapters import ContentAdapter
from db import session
from models import ContentModel
from models import Flag
from sqlalchemy.orm.exc import NoResultFound
from config import ConfigParser
from file_manager import FileManager


class Synchronizer(object):

    def __init__(self, instance: InstanceAdapter):
        self.instance = instance
        self.remote_contents = list()
        self.deleted_contents = list()
        self.file_manager = FileManager()

    def update_db(self):
        if not self.remote_contents:
            print('Nothing to update')
        for remote_content in self.remote_contents:
            content = None
            try:
                local_content = session.query(ContentModel).filter_by(
                    instance_label=self.instance.label,
                    remote_id=remote_content.remote_id,
                ).one()
                if local_content.revision_id != remote_content.revision_id:
                    content = self.cast_to_model(remote_content)
                    content.id = local_content.id
                    content.flag = Flag.CHANGED
                    if content.filename != local_content.filename:
                        content.flag = Flag.MOVED
                    session.merge(content)
            except NoResultFound:
                content = self.cast_to_model(remote_content)
                session.add(content)

        if not self.deleted_contents:
            print('Nothing to delete')
        for content in self.deleted_contents:
            content.flag = Flag.DELETED
            session.merge(content)

        session.commit()

    def detect_changes(self):
        self.remote_contents = self.instance.load_all_contents()
        remote_ids = [x.remote_id for x in self.remote_contents]
        self.deleted_contents = session\
            .query(ContentModel)\
            .filter(ContentModel.remote_id.notin_(remote_ids))\
            .all()

    def cast_to_model(self, content: ContentAdapter):
        return ContentModel(
            remote_id=content.remote_id,
            revision_id=content.revision_id,
            content_type=content.content_type,
            filename=content.filename,
            instance_label=self.instance.label,
            workspace_label=content.workspace_label,
            workspace_id=content.workspace_id,
            parent_id=content.parent_id
        )
