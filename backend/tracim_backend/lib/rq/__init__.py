# -*- coding: utf-8 -*-
import enum

import redis
import rq

from tracim_backend.config import CFG


class RqQueueName(str, enum.Enum):
    DEFAULT = "default"
    EVENT = "event"
    MAIL_SENDER = "mail_sender"
    ELASTICSEARCH_INDEXER = "elasticsearch_indexer"


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
    redis_connection: redis.Redis,
    queue_name: RqQueueName = RqQueueName.DEFAULT,
    is_async: bool = True,
) -> rq.Queue:
    """
    :param queue_name: name of queue
    :return: wanted queue
    """

    return rq.Queue(name=queue_name.value, connection=redis_connection, is_async=is_async)


def get_rq_queue2(config: CFG, queue_name: RqQueueName) -> rq.job.Job:
    connection = get_redis_connection(config)
    return get_rq_queue(connection, queue_name)
