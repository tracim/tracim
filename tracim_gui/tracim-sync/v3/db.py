# coding: utf-8


from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config import ConfigParser

config = ConfigParser().load_config_from_file()

engine = create_engine(
    'sqlite:///{}'.format(config.DB_PATH),
    echo=False,
)
Session = sessionmaker(bind=engine)
session = Session()
BaseModel = declarative_base()
