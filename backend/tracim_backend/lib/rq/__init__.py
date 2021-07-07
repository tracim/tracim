# -*- coding: utf-8 -*-

import redis
import rq

from tracim_backend.config import CFG


def get_redis_connection(config: CFG) -> redis.Redis:
    """
    :param config: current app_config
    :return: redis connection
    """
    return redis.Redis(
        host=config.JOBS__ASYNC__REDIS__HOST,
        port=config.JOBS__ASYNC__REDIS__PORT,
        db=config.JOBS__ASYNC__REDIS__DB,
    )


def get_rq_queue(
    redis_connection: redis.Redis, queue_name: str, is_async: bool = True,
) -> rq.Queue:
    """
    :param queue_name: name of queue
    :return: wanted queue
    """
    return rq.Queue(name=queue_name, connection=redis_connection, is_async=is_async)
