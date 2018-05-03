# -*- coding: utf-8 -*-
import datetime
from redis import Redis
from rq import Queue

from tracim.config import CFG

DEFAULT_WEBDAV_CONFIG_FILE = "wsgidav.conf"
DEFAULT_TRACIM_CONFIG_FILE = "development.ini"


def get_redis_connection(config: CFG) -> Redis:
    """
    :param config: current app_config
    :return: redis connection
    """
    return Redis(
        host=config.EMAIL_SENDER_REDIS_HOST,
        port=config.EMAIL_SENDER_REDIS_PORT,
        db=config.EMAIL_SENDER_REDIS_DB,
    )


def get_rq_queue(redis_connection: Redis, queue_name: str ='default') -> Queue:
    """
    :param queue_name: name of queue
    :return: wanted queue
    """

    return Queue(name=queue_name, connection=redis_connection)


def cmp_to_key(mycmp):
    """
    List sort related function

    Convert a cmp= function into a key= function
    """
    class K(object):
        def __init__(self, obj, *args):
            self.obj = obj

        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0

        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0

        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0

        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0

        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0

        def __ne__(self, other):
            return mycmp(self.obj, other.obj) != 0

    return K


def current_date_for_filename() -> str:
    """
    ISO8601 current date, adapted to be used in filename (for
    webdav feature for example), with trouble-free characters.
    :return: current date as string like "2018-03-19T15.49.27.246592"
    """
    # INFO - G.M - 19-03-2018 - As ':' is in transform_to_bdd method in
    # webdav utils, it may cause trouble. So, it should be replaced to
    # a character which will not change in bdd.
    return datetime.datetime.now().isoformat().replace(':', '.')
