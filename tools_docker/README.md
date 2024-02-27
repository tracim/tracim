# Tracim with Docker

## Table of contents

- [Run containers](#run-containers)
  - [Information about container](#information-about-container)
  - [Example commands](#example-commands)
- [Build images](#build-images)
  - [With custom branch or tag](#with-custom-branch-or-tag)
  - [With custom repository](#with-custom-repository)
- [Troubleshooting](#troubleshooting)
- [Tracimcli inside docker](#tracimcli-inside-docker)
  - [Updating index of ElasticSearch](#updating_index_of_elasticSearch)
- [ARM64 build](#arm64-build)
- [Running with gocryptfs encryption](#running-with-gocryptfs-encryption)

## Run containers

### Information about container

Environment variables can be given to the container:

* `DATABASE_TYPE` (values: `postgresql` or `sqlite`)

If DATABASE_TYPE is `postgresql` set these variables:

* `DATABASE_USER`
* `DATABASE_PASSWORD`
* `DATABASE_HOST`
* `DATABASE_PORT`
* `DATABASE_NAME`

Container volume are:

* `/etc/tracim` (used for persistent configuration files)
* `/var/tracim` (used for persistent data like user session and sqlite SQLite database if chosen)

Used port in container:

* `80` (Tracim HTTP API and web user interface)

⚠ You can also use this list of [supported variables](https://github.com/tracim/tracim/blob/develop/doc/backend/env_settings.md) (there variables are from development.ini.sample configuration file)

If you want to use notification by email:

* You need to give some smtp parameter visible in [development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample)

If you want to use reply_by_email feature:

* `REPLY_BY_EMAIL=1` (In this case you need to give some imap parameter visible in [development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample))

If you don't want to use webdav (webdav is started by default):

* `START_WEBDAV=0` (to deactivate webdav in Tracim)

If you don't want to use caldav (webdav is started by default):

* `START_CALDAV=0` (to deactivate agenda in Tracim)

If you want to use collaborative_document_edition feature:

* `ENABLE_COLLABORATIVE_DOCUMENT_EDITION=1` (In this case you need to set `collaborative_document_edition.*` parameters in [development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample))

see also [setting documentation](https://github.com/tracim/tracim/blob/master/doc/backend/setting.md)

You can override app activated in Tracim using `TRACIM_APP__ENABLED` environnement variable, this allow to disable some default enabled apps like `contents/file`, see `app.enabled_app` parameter in [development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample) for more information about possible app enabled list values.
⚠ if you decide to override app list, be careful about docker parameters : `ENABLE_COLLABORATIVE_DOCUMENT_EDITION` and `START_CALDAV`, they need to be consistent with app list configuration, for example if you do not
have `agenda` app in `app.enabled` list, you MUST have `START_CALDAV=0`.


If you want to use plugins and/or custom_toolbox you need to add files in `~/tracim/etc/plugins/` and `~/tracim/etc/custom_toolbox/` (default configuration). This two path are created when you start docker image for the first time.


### Example commands

Example with SQLite:

```bash
    docker run \
        -e DATABASE_TYPE=sqlite \
        -e TRACIM_WEBSITE__BASE_URL=http://{ip_address}:{port} \
        -p 8080:80 \
        -v ~/tracim/etc:/etc/tracim \
        -v ~/tracim/var:/var/tracim \
        algoo/tracim:latest
```
To run the Tracim container with PostgreSQL, you must set the `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME` environment variables.

Example with PostgreSQL:

```bash
    docker run \
        -e DATABASE_TYPE=postgresql \
        -e DATABASE_HOST=192.168.1.2 \
        -e DATABASE_PORT=5432 \
        -e DATABASE_USER=tracim \
        -e DATABASE_PASSWORD=tracim \
        -e DATABASE_NAME=tracim \
        -e TRACIM_WEBSITE__BASE_URL=http://{ip_address}:{port} \
        -p 8080:80 \
        -v ~/tracim/etc:/etc/tracim \
        -v ~/tracim/var:/var/tracim \
        algoo/tracim:latest
```

Example with SQlite, email notifications and some small customisations:

```bash
    docker run \
        -e DATABASE_TYPE=sqlite \
        -e TRACIM_EMAIL__NOTIFICATION__ACTIVATED=True \
        -e TRACIM_EMAIL__NOTIFICATION__SMTP__SERVER=xxxx.servermail.xx \
        -e TRACIM_EMAIL__NOTIFICATION__SMTP__PORT=25 \
        -e TRACIM_EMAIL__NOTIFICATION__SMTP__USER=xxxxxxxxxx \
        -e TRACIM_EMAIL__NOTIFICATION__SMTP__PASSWORD=xxxxxxxxxx \
        -e TRACIM_EMAIL__NOTIFICATION__FROM__EMAIL=xxx+{user_id}@servermail.xx \
        -e TRACIM_EMAIL__NOTIFICATION__REPLY_TO__EMAIL=xxxx+{content_id}@servermail.xx \
        -e TRACIM_EMAIL__NOTIFICATION__REFERENCES__EMAIL=xxxx+{content_id}@servermail.xx \
        -e TRACIM_WEBSITE__TITLE=xxxxxx \
        -e TRACIM_WEBSITE__BASE_URL=http://{ip_address}:{port} \
        -p 8080:80 \
        -v ~/tracim/etc:/etc/tracim \
        -v ~/tracim/var:/var/tracim \
        algoo/tracim:latest
```
With this example, Tracim is now accessible on your network and Tracim can send notification by email when content change.

Example to use Tracim with ElasticSearch: (you need to start elasticsearch first)

```bash
    docker run \
        -e DATABASE_TYPE=sqlite \
        -e TRACIM_SEARCH__ENGINE=elasticsearch \
        -e TRACIM_SEARCH__ELASTICSEARCH__HOST={ip_of_elasticsearch_container} \
        -e TRACIM_SEARCH__ELASTICSEARCH__PORT=9200 \
        -e TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS_PREFIX=test_tracim \
        -e TRACIM_WEBSITE__BASE_URL=http://{ip_address}:{port} \
        -p 8080:80 \
        -v ~/tracim/etc:/etc/tracim \
        -v ~/tracim/var:/var/tracim \
        algoo/tracim:latest
```

Example to use Tracim with ElasticSearch-ingest: (you need to create your elasticsearch-ingest image first and start this image before Tracim)

```bash
    docker run \
        -e DATABASE_TYPE=sqlite \
        -e TRACIM_SEARCH__ENGINE=elasticsearch \
        -e TRACIM_SEARCH__ELASTICSEARCH__HOST={ip_of_elasticsearch_container} \
        -e TRACIM_SEARCH__ELASTICSEARCH__PORT=9200 \
        -e TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS_PREFIX=test_tracim \
        -e TRACIM_SEARCH__ELASTICSEARCH__USE_INGEST=True \
        -e TRACIM_WEBSITE__BASE_URL=http://{ip_address}:{port} \
        -p 8080:80 \
        -v ~/tracim/etc:/etc/tracim \
        -v ~/tracim/var:/var/tracim \
        algoo/tracim:latest
```
⚠ After execute one of these command, Tracim will be reachable on your system on port 8080.

## Build images

To build image

```bash
cd tools_docker/Debian_Uwsgi
docker build -t algoo/tracim:<version_name> .
```

To build encryption-enabled (gocryptfs based) image (experimental):

```bash
cd tools_docker/Debian_New_Uwsgi
docker build -t algoo/tracim:<version_name> .
```

### With custom branch or tag

⚠ **It is not possible to build an image with both ARG `TAG` and ARG `BRANCH` at same time.**

You can build with specific branch

```bash
cd tools_docker/Debian_Uwsgi
docker build --build-arg BRANCH="<branch_name>" -t algoo/tracim:<version_name> .
```
Ex: `docker build --build-arg BRANCH="feature/new_app" -t algoo/tracim:test_branch .`

You can also build image with specific tag (This build is make just with necessary files: no other branch available)

```bash
cd tools_docker/Debian_Uwsgi
docker build --build-arg TAG="<tag_name>" -t algoo/tracim:<tag_name> .
```
Ex: `docker build --build-arg TAG="release_02.00.00" -t algoo/tracim:release_02.00.00 .`

### With custom repository

By default, the Docker image is built from the main repository of Tracim. To clone Tracim from another repository, use the REPO argument. Don't forget to set a suitable image name.

Ex: `docker build --build-arg REPO="https://github.com/<me>/tracim.git" -t algoo/tracim:myrepo .`

## Troubleshooting

If you encounter problems during the startup of the docker image, you can pass `DEBUG=1` to get additional messages that can help to find the problem cause:

```bash
    docker run \
        -e DATABASE_TYPE=sqlite \
        -e TRACIM_WEBSITE__BASE_URL=http://{ip_address}:{port} \
        -p 8080:80 \
        -v ~/tracim/etc:/etc/tracim \
        -v ~/tracim/var:/var/tracim \
        -e DEBUG=1 \
        algoo/tracim:latest
```

## Tracimcli inside docker

For maintenance purpose you can use tracimcli command line in the docker this way:

```bash
docker exec -it -u www-data -w /etc/tracim {CONTAINER ID or NAMES} tracimcli
```
for the interactive mode
note: /etc/tracim is the folder in container where the configuration file is stored.


or launching command directly:

```bash
docker exec -i -u www-data -w /etc/tracim {CONTAINER ID or NAMES} tracimcli dev parameters value -f -d
```

### Updating index of ElasticSearch

⚠ Prerequiste: ElasticSearch is running and you have starting Tracim with parameter to communicate with elasticsearch

To make an update of ElasticSearch index you need to go inside your running Tracim container:

```bash
docker ps
docker exec -it -u www-data -w /etc/tracim {CONTAINER ID or NAMES} tracimcli
```

Now you are in your Tracim container.

```bash
search index-drop -d
search index-create -d
search index-populate -d
```
When is finished, you can quit your container. Index is now updated with all of your Tracim content.

## ARM64 build

> Experimental!

The ARM64 build is an experimental build without VTK enabled.

To build image for ARM64 on a AMD64 machine, you need to:
- install docker buildx: https://docs.docker.com/buildx/working-with-buildx/
- add `binfmt_misc` multi-arch support (check `tonistiigi/binfmt` docker image in this doc: https://github.com/docker/buildx/#building-multi-platform-images)
- install `qemu` and `qemu-user-static`.

then do:

```bash
cd tools_docker/Debian_New_Uwsgi_ARM64
docker buildx build -t algoo/tracim:arm64 . --platform linux/arm64/v8
```
for arm64/aarch64/v8

## Running with gocryptfs encryption

> Experimental!

Warning: This is an experimental docker image,
the new feature from this docker will maybe be merged to the standard docker or removed.

Warning: content should be migratable from gocryptfs-encrypted to plain dir and also in the other side, but
this was not tested. For previews, there is no need to migrate data, so you can just start with a plain new dir.

This need the new specific Debian_New_Uwsgi docker (see build section).
Example with basic instance of Tracim (local usage with webdav and caldav) with encrypted storage:

Note: with this new docker, all tracimcli and alembic command should be runned as
user www-data, example:

```bash
docker exec -i -u www-data -w /etc/tracim {CONTAINER ID or NAMES} tracimcli dev parameters value -f -d
```

for this example,
you first need to write password you want in `~/tracim/secret/password.txt` file.
Folder `~/tracim/secret` will be mounted as a docker volume.

```bash
mkdir -p ~/tracim/secret
echo "password" > ~/tracim/secret/password.txt
```

Note: this is just an example, we suggest you to write password with a text editor
instead in order to not store the password in the bash history.

```bash
    docker run \
        --device /dev/fuse \
        --cap-add SYS_ADMIN \
        --security-opt apparmor:unconfined \
        -e DATABASE_TYPE=sqlite \
        -e ENABLE_GOCRYPTFS_ENCRYPTION=1 \
        -e GOCRYPTFS_PREVIEW_STORAGE_DIR=/var/tracim/data/preview \
        -e TRACIM_PREVIEW_CACHE_DIR=/media/previews \
        -e GOCRYPTFS_UPLOADED_FILES_STORAGE_DIR=/var/tracim/data/uploaded_files \
        -e TRACIM_DEPOT_STORAGE_DIR=/media/uploaded_files \
        -e GOCRYPTFS_PASSWORD_PATH=/var/secret/password.txt \
        -e TRACIM_WEBSITE__BASE_URL=http://{ip_address}:{port} \
        -p 8080:80 \
        -v ~/tracim/etc:/etc/tracim \
        -v ~/tracim/var:/var/tracim \
        -v ~/tracim/secret:/var/secret \
        algoo/tracim:latest
```

For more security, you may want to remove the password file.
You will need it each time you need to run the docker.

```bash
rm ~/tracim/secret/password.txt
```
