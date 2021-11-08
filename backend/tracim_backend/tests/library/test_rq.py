import time

import pytest

from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.rq import RqQueueName
from tracim_backend.lib.rq import get_redis_connection
from tracim_backend.lib.rq import get_rq_queue
from tracim_backend.lib.rq.worker import worker_context
from tracim_backend.tests.fixtures import *  # noqa F403,F401


def get_public_name(user_id: int) -> str:
    with worker_context() as context:
        user_api = UserApi(current_user=None, session=context.dbsession, config=context.app_config)
        return user_api.get_one(user_id).public_name


@pytest.mark.usefixtures("base_fixture")
class TestRQDatabaseWorker(object):

    JOB_EXECUTION_TIMEOUT = 2

    def test_unit__submit_job__OK_nominal_case(
        self, app_config, session, rq_database_worker
    ) -> None:
        redis = get_redis_connection(app_config)
        queue = get_rq_queue(redis, queue_name=RqQueueName.EVENT)
        job = queue.enqueue(
            # need to enqueue by name as enqueuing with get_public_name fails in pytest
            "tracim_backend.tests.library.test_rq.get_public_name",
            1,
            job_timeout=self.JOB_EXECUTION_TIMEOUT,
        )
        while not job.result:
            if job.exc_info:
                raise job.exc_info
            time.sleep(0.1)
        user_api = UserApi(current_user=None, session=session, config=app_config)
        user = user_api.get_one(1)
        job_public_name = job.result
        assert user.public_name == job_public_name
