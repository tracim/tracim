# Docker Tests

This is a tool to help test Docker images, for simple cases, but also for complicated tests.
This allows:
- automatically running Tracim with Collabora and Elasticsearch on by default (it just needs some tweaks
for emails and you need to setup dns resolving using a special Docker image)
- testing if the Docker container correctly starts
- automatically testing services running in the docker container using `testinfra` lib (check `test_dockers.py`)
- test specific tracim docker image (check `test_config.env`) and specific tracim docker config (check `tracim.env`), etc...
- do manual test easily on docker image using `STOP_CONTAINER_AT_THE_END=False`
- etc.

## Prerequisities

- install some python packages:
`pip install pytest testinfra python-dotenv`
- build tracim docker image `DOCKER_TRACIM_IMAGE` set in `test_config.env` and [build part of tracim docker doc](../README.md), default
value is `algoo/tracim:test` which does not exist in dockerhub, adapt `DOCKER_TRACIM_IMAGE` according to the image you decide to test)
- choose elasticsearch docker image `DOCKER_ELASTICSEARCH_IMAGE` set in`test_config.env`   (we do recommand you to build and use
`elasticsearch_ingest` docker, see [this doc](../elasticsearch_ingest/README.md))
- create tracim env config file from sample:`cp tracim.sample.env tracim.env`
- create docker test config file from sample: `cp test_config.sample.env test_config.env`

for hostname resolving from host, use `dns-proxy-server` container, which allow you to dns resolve your local containers:

```sh
docker run --name dns_docker_solver --hostname dns.mageddo --restart=unless-stopped -p 5380:5380 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /etc/resolv.conf:/etc/resolv.conf \
defreitas/dns-proxy-server
```

- create the dedicated docker network:

```sh
docker network create -d bridge tracim-test-net
```

## Example of quick start on fresh install

```sh
# build docker image
BRANCH=develop
cd tools_docker/Debian_Uwsgi
docker build --build-arg BRANCH=$BRANCH -t algoo/tracim:test .
cd ../..
# build elasticsearch image
cd tools_docker/elasticsearch_ingest
docker build -t elasticsearch-ingest .
cd ../..
# install needed python package
pip install pytest testinfra python-dotenv # need to be in tracim venv
# run dns_docker_solver
docker run --name dns_docker_solver --hostname dns.mageddo --restart=unless-stopped -p 5380:5380 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /etc/resolv.conf:/etc/resolv.conf \
defreitas/dns-proxy-server
# create network
docker network create -d bridge tracim-test-net
# run tests
cd tool_docker/
pytest test_docker  
```

## Automatic testing

Tests can now be started:

```sh
pytest test_docker
```

It will check in the Docker container if all the Tracim services are correctly running after launching the Tracim, Collabora and ElasticSearch Docker containers


## Semi-Manual testing

Using configurations files and `STOP_CONTAINER_AT_THE_END=False` you can manually test the docker container after launching automatic tests.
This way you can try some custom cases like using existing data or testing whether Collabora works, email notifications and email replies work.
If you have correctly set up `dns-proxy-server`, tracim should be available with "http://tracim.test"

for semi manual test, its better to do this:
```sh
pytest -m test_all_in_one_step test_docker
```

## Configuration file

There are 2 configuration files: `tracim.env` and `test_config.env`, first one
allow to pass custom env var to tracim container, whereas the second one allow us
to configure the whole process (stopping container at the end, changing image used, etc..)
