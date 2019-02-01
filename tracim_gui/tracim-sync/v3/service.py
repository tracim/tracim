# coding: utf-8

from config import ConfigParser
from adapters import InstanceAdapter
from sync import Synchronizer
from file_manager import FileManager
from db import engine
from db import BaseModel
from db import session
from models import ContentModel
from tracim_sync_exceptions import ConnectionException

from sqlalchemy.sql.expression import func

class Service(object):

    def __init__(self):
        BaseModel.metadata.create_all(engine)
        self.config = ConfigParser().load_config_from_file()

    def main(self):
        for label, params in self.config.INSTANCES.items():
            try:
                last_revision_id = session\
                    .query(func.max(ContentModel.revision_id))\
                    .filter(ContentModel.instance_label == label)\
                    .scalar() or 0
                instance = InstanceAdapter(label, params, last_revision_id)
                synchronizer = Synchronizer(instance)
                synchronizer.detect_changes()
                synchronizer.update_db()
            except ConnectionException as ex:
                print(ex)

        try:
            file_manager = FileManager()
            file_manager.update_local_files()
        except ConnectionException as ex:
            print(ex)


if __name__ == "__main__":
    Service().main()
