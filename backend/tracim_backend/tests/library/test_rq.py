import os
import subprocess
import time

import pytest

from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.rq import get_redis_connection
from tracim_backend.lib.rq import get_rq_queue
from tracim_backend.lib.rq import worker_app_config
from tracim_backend.lib.rq import worker_session
from tracim_backend.models.auth import User
from tracim_backend.tests.fixtures import *  # noqa F403,F401


@pytest.fixture
def run_rq_database_worker(config_uri):

    worker_env = os.environ.copy()
    worker_env["TRACIM_CONF_PATH"] = "{}#rq_worker_test".format(config_uri)
    worker_process = subprocess.Popen(
        "rq worker -q -w tracim_backend.lib.rq.worker.DatabaseWorker".split(" "), env=worker_env,
    )
    yield worker_process
    worker_process.terminate()
    worker_process.wait()


def worker_job(user_id: int) -> User:
    with worker_session() as session:
        user_api = UserApi(current_user=None, session=session, config=worker_app_config())
        return user_api.get_one(user_id)


@pytest.mark.usefixtures("base_fixture")
class TestRQDatabaseWorker(object):

    JOB_EXECUTION_TIMEOUT = 2

    def test_unit__submit_job__OK_nominal_case(
        self, app_config, session, run_rq_database_worker
    ) -> None:
        redis = get_redis_connection(app_config)
        queue = get_rq_queue(redis)
        job = queue.enqueue(
            # need to enqueue by name as enqueuing with worker_job fails in pytest
            "tracim_backend.tests.library.test_rq.worker_job",
            1,
            timeout=self.JOB_EXECUTION_TIMEOUT,
        )
        while not job.result:
            if job.exc_info:
                raise job.exc_info
            time.sleep(0.1)
        user_api = UserApi(current_user=None, session=session, config=app_config)
        user = user_api.get_one(1)
        user_from_job = job.result
        assert user.user_id == user_from_job.user_id
