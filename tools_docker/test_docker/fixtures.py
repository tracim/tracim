import os
from distutils.util import strtobool
from time import sleep

from dotenv import dotenv_values
import pytest
import subprocess
import testinfra


test_config_value = dotenv_values(os.path.dirname(os.path.realpath(__file__))+'/test_config.env')
STOP_CONTAINER_AT_THE_END = strtobool(test_config_value['STOP_CONTAINER_AT_THE_END'])
DOCKER_TRACIM_IMAGE = test_config_value['DOCKER_TRACIM_IMAGE']
DOCKER_ELASTICSEARCH_IMAGE =  test_config_value['DOCKER_ELASTICSEARCH_IMAGE']
DOCKER_COLLABORA_IMAGE = test_config_value['DOCKER_COLLABORA_IMAGE']
DOCKER_TEST_NETWORK = test_config_value['DOCKER_TEST_NETWORK']
SLEEP_AFTER_START_TRACIM_CONTAINER = int(test_config_value['SLEEP_AFTER_START_TRACIM_CONTAINER'])
SLEEP_AFTER_START_ELASTICSEARCH_CONTAINER = int(test_config_value['SLEEP_AFTER_START_ELASTICSEARCH_CONTAINER'])
SLEEP_AFTER_START_COLLABORA_CONTAINER = int(test_config_value['SLEEP_AFTER_START_COLLABORA_CONTAINER'])
TRACIM_DOMAIN_NAME = test_config_value['TRACIM_DOMAIN_NAME']
TRACIM_ETC_FOLDER = test_config_value['TRACIM_ETC_FOLDER']
TRACIM_VAR_FOLDER = test_config_value['TRACIM_VAR_FOLDER']
TRACIM_SECRET_FOLDER = test_config_value['TRACIM_SECRET_FOLDER']

@pytest.fixture(scope='session')
def tracim_env_var_file_path():
    return os.path.dirname(os.path.realpath(__file__))+'/tracim.env'

@pytest.fixture(scope='session')
def tracim_env_var_params(tracim_env_var_file_path):
    env_vars=dotenv_values(tracim_env_var_file_path)
    return env_vars


@pytest.fixture(scope='session')
def tracim_docker_params(tracim_env_var_params):
    params = [
        'docker',
        'run',
        '--name', 'tracim.test',
        '--hostname', "tracim.test",
        '-d',
        '--device', '/dev/fuse',
        '--cap-add', 'SYS_ADMIN',
        '--security-opt', 'apparmor:unconfined',
        '--network',
        DOCKER_TEST_NETWORK,
    ]
    for name,value in tracim_env_var_params.items():
        params.append('-e')
        params.append('{}={}'.format(name, value))
    if TRACIM_ETC_FOLDER:
        params.append('-v')
        params.append('{}:/etc/tracim'.format(TRACIM_ETC_FOLDER))
    if TRACIM_VAR_FOLDER:
        params.append('-v')
        params.append('{}:/var/tracim'.format(TRACIM_VAR_FOLDER))
    if TRACIM_SECRET_FOLDER:
        params.append('-v')
        params.append('{}:/var/secret'.format(TRACIM_SECRET_FOLDER))
    params.append(DOCKER_TRACIM_IMAGE)
    return params

@pytest.fixture(scope='session')
def client():
    return testinfra.get_host('local://')

@pytest.fixture()
def tracim(request, tracim_docker_params, elasticsearch, collabora):
    # run a container
    docker_id = subprocess.check_output(tracim_docker_params).decode().strip()
    # return a testinfra connection to the container
    sleep(SLEEP_AFTER_START_TRACIM_CONTAINER)
    yield testinfra.get_host("docker://" + docker_id)
    # at the end of the test suite, destroy the container
    if STOP_CONTAINER_AT_THE_END:
        subprocess.check_call(['docker', 'rm', '-f', docker_id])

@pytest.fixture(scope='session')
def elasticsearch(request):
    # run a container
    params = [
        'docker',
        'run',
        '--name', "elasticsearch.test",
        '--hostname', "elasticsearch.test",
        '-d',
        '--network',
        DOCKER_TEST_NETWORK,
        '-e', 'discovery.type=single-node',
        DOCKER_ELASTICSEARCH_IMAGE
    ]
    docker_id = subprocess.check_output(
        params

    ).decode().strip()
    # return a testinfra connection to the container
    sleep(SLEEP_AFTER_START_ELASTICSEARCH_CONTAINER)
    yield testinfra.get_host("docker://" + docker_id)
    # at the end of the test suite, destroy the container
    if STOP_CONTAINER_AT_THE_END:
        subprocess.check_call(['docker', 'rm', '-f', docker_id])


@pytest.fixture(scope='session')
def collabora(request):
    # run a container
    params = [
        'docker',
        'run',
        '--hostname', "collabora.test",
        '--name', "collabora.test",
        '-d',
        '--network',
        DOCKER_TEST_NETWORK,
        '-e', 'domain='+TRACIM_DOMAIN_NAME,
        '-e', "SLEEPFORDEBUGGER=0",
        '-e' "extra_params=--o:ssl.enable=false",
        '--cap' '-add', 'MKNOD', '--restart', 'always',
        DOCKER_COLLABORA_IMAGE
    ]
    docker_id = subprocess.check_output(
        params

    ).decode().strip()
    # return a testinfra connection to the container
    sleep(SLEEP_AFTER_START_COLLABORA_CONTAINER)
    yield testinfra.get_host("docker://" + docker_id)
    # at the end of the test suite, destroy the container
    if STOP_CONTAINER_AT_THE_END:
        subprocess.check_call(['docker', 'rm', '-f', docker_id])
