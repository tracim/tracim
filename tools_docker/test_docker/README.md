# Docker Tests

This is a tool to help test Docker images, for simple cases, but also for complicated tests.
This allows:
- automatically running Tracim with Collabora and Elasticsearch on by default (it just needs some tweaks
for emails and you need to setup dns resolving using a special Docker image)
- testing if the Docker container correctly starts
- automatically testing services running in the docker container

## Prerequisities

- pip install pytest testinfra python-dotenv
- build tracim docker image "DOCKER_TRACIM_IMAGE" (see test_config.env)
- build elasticsearch docker image "DOCKER_ELASTICSEARCH_IMAGE"
- cp tracim.sample.env tracim.env
- cp test_config.sample.env test_config.env

for hostname resolving from host, use:

```sh
docker run --name dns_docker_solver --hostname dns.mageddo --restart=unless-stopped -p 5380:5380 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /etc/resolv.conf:/etc/resolv.conf \
defreitas/dns-proxy-server
```
## Automatic testing

Tests can now be started:

pytest test_docker

It will check in the Docker container if all the Tracim services are correctly running after launching the Tracim, Collabora and ElasticSearch Docker containers


## Semi-Manual testing

Using configurations files and `STOP_DOCKER_AT_END=False` you can manually test the docker container after launching automatic tests.
This way you can try some custom cases like using existing data or testing whether Collabora works, email notifications and email replies work.

## Configuration file

There are 2 configuration files: `tracim.env` and `test_config.env`.
