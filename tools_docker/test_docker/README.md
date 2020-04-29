# Docker Tests

This is a too to help test docker, for simple case, but also for complicated test.
This allow:
- to run automatically tracim, collabora and elasticsearch with by defaut a working case where all features of tracim work (it just need some tweak
for email and you need to setup resolving using special docker)
- to test if docker start correctly
- to test automatically service running in the docker

## Prerequisities

- pip install pytest testinfra python-dotenv
- build tracim docker image "DOCKER_TRACIM_IMAGE" (see test_config.env)
- build elasticsearch docker image "DOCKER_ELASTICSEARCH_IMAGE"
- cp tracim.sample.env tracim.env
- cp test_config.sample.env test_config.env

for hostname resolving from host, use:

```
docker run --name dns_docker_solver --hostname dns.mageddo --restart=unless-stopped -p 5380:5380 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /etc/resolv.conf:/etc/resolv.conf \
defreitas/dns-proxy-server
```
## Automatic testing

you can now start the test:

pytest test_docker

It will check on docker image if all tracim services are correctly running after launching tracim, collabora and elasticsearch
docker.


## Semi-Manual testing

Using configurations files and STOP_DOCKER_AT_END=False you can manually test the docker after launching automatic tests
This way you can tried some custom case like using existing data, testing if collabora work, testing if email notification
and email_reply work.

## configuration file

There is 2 config file tracim.env and test_config.env.
