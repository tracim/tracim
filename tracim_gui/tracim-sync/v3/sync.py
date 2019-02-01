# coding: utf-8

from config import ConfigParser

from adapters import InstanceAdapter
from adapters import ContentAdapter
from db import session
from models import ContentModel
from models import Flag
from file_manager import FileManager

from sqlalchemy.orm.exc import NoResultFound


class Synchronizer(object):

    def __init__(self, instance: InstanceAdapter):
        self.instance = instance
        self.updated_contents = list()
        self.deleted_contents = list()
        self.comments = list()
        self.file_manager = FileManager()

    def update_db(self) -> None:
        self._flag_updated_and_moved()
        self._flag_updated_threads()
        self._flag_deleted()
        session.commit()

    def _flag_updated_and_moved(self):
        if not self.updated_contents:
            print('Nothing to update')
        for remote_content in self.updated_contents:
            content = None
            try:
                local_content = session.query(ContentModel).filter_by(
                    instance_label=self.instance.label,
                    remote_id=remote_content.remote_id,
                ).one()
                if local_content.revision_id < remote_content.revision_id:
                    content = self._cast_to_model(remote_content)
                    content.id = local_content.id
                    content.flag = Flag.CHANGED
                    if content.filename != local_content.filename\
                            or content.parent_id != local_content.parent_id:
                        content.flag = Flag.MOVED
                    session.merge(content)
            except NoResultFound:
                content = self._cast_to_model(remote_content)
                session.add(content)

    def _flag_updated_threads(self):
        for comment in self.comments:
            try:
                thread = session\
                    .query(ContentModel)\
                    .filter(ContentModel.remote_id == comment.parent_id)\
                    .filter(ContentModel.flag != Flag.DELETED)\
                    .one()

                if thread.flag == Flag.SYNCED:
                    thread.flag = Flag.CHANGED
                thread.revision_id = comment.revision_id
                session.merge(thread)
                
            except NoResultFound:
                print('Passed on update thread id: {}'.format(comment.parent_id))

    def _flag_deleted(self):
        if not self.deleted_contents:
            print('Nothing to delete')
        for content in self.deleted_contents:
            session\
                .query(ContentModel)\
                .filter(ContentModel.remote_id == content.remote_id)\
                .update({ContentModel.flag: Flag.DELETED})

    def detect_changes(self):
        remote_contents = set(self.instance.load_all_contents())
        self.deleted_contents = set(filter(
            lambda x: x.is_deleted() or x.is_archived(),
            remote_contents
        ))

        self.updated_contents = remote_contents - self.deleted_contents

    def _cast_to_model(self, content: ContentAdapter):
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
