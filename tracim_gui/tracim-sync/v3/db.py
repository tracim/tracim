# coding: utf-8


from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config import CONFIG


engine = create_engine(
    'sqlite:///{}'.format(CONFIG.DB_PATH),
    echo=False,
)
Session = sessionmaker(bind=engine)
BaseModel = declarative_base()
