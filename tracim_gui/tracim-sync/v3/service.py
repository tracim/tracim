# coding: utf-8

from config import ConfigParser
from adapters import InstanceAdapter
from sync import Synchronizer
from file_manager import FileManager
from db import engine
from db import BaseModel
from models import ContentModel

def main():
    # first sync
    BaseModel.metadata.create_all(engine)
    config = ConfigParser().load_config_from_file()
    for label, params in config.INSTANCES.items():
        instance = InstanceAdapter(label, params)
        synchronizer = Synchronizer(instance)
        synchronizer.detect_changes()
        synchronizer.update_db()
    file_manager = FileManager()
    file_manager.update_local_files()


if __name__ == "__main__":
    main()
