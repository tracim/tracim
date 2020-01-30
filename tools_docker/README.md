## Tracim with Docker

### Run containers

#### Information about container

Environment variables can be given to the container:

* DATABASE_TYPE (values: postgresql, mysql, sqlite)

If DATABASE_TYPE is `postgresql` or `mysql` set these variables:

* DATABASE_USER
* DATABASE_PASSWORD
* DATABASE_HOST
* DATABASE_PORT
* DATABASE_NAME

Container volume are:

* /etc/tracim
* /var/tracim (used for persistent data like user session and sqlite SQLite database if chosen)

Used port in container:

* 80 (Tracim HTTP API and web user interface)

⚠ You can also use this list of [supported var](https://github.com/tracim/tracim/blob/master/backend/doc/setting.md) (this var are from development.ini.sample conf file)

If you want to use notification by email:

* You need to give some smtp parameter visible in [development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample))

If you want to use reply_by_email feature:

* REPLY_BY_EMAIL=1 (In this case you need to give some imap parameter visible in [development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample))

If you don't want to use webdav (webdav is started by default):

* START_WEBDAV=0 (to deactivate webdav in tracim)

If you don't want to use caldav (webdav is started by default):

* START_CALDAV=0 (to deactivate agenda in tracim)

If you want to use collaborative_document_edition feature:

* ENABLE_COLLABORATIVE_DOCUMENT_EDITION=1 (In this case you need to set `collaborative_document_edition.*` parameters in [development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample))

see also [setting documentation](https://github.com/tracim/tracim/blob/master/backend/doc/setting.md)

You can override app activated in Tracim using `TRACIM_APP__ENABLED` env var, this allow to disable some default enabled apps like `contents/file`, see `app.enabled_app` parameter in [development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample) for more information about possible app enabled list values.
⚠ if you decide to override app list, be careful about docker parameters : `ENABLE_COLLABORATIVE_DOCUMENT_EDITION`, `START_CALDAV` and `START_WEBDAV`, they need to be consistent with app list configuration, for example if you do not
have `agenda` app in `app.enabled` list, you MUST have `START_CALDAV=0`.


If you want to use plugins and/or custom_toolbox you need to add files in `~/tracim/etc/plugins/` and `~/tracim/etc/custom_toolbox/` (default configuration). This two path are created when you start docker image for the first time.


#### Updating index of ElasticSearch

⚠ Prerequiste: elasticsearch is running and you have starting tracim with parameter to communicate with elasticsearch

To make an update of elasticsearch index you need to go inside you tracim container running:

        docker ps
        docker exec -it {CONTAINER ID} /bin/bash

Now you are in your tracim container.

        cd /tracim/backend
        tracimcli search index-drop -c /etc/tracim/development.ini -d
        tracimcli search index-create -c /etc/tracim/development.ini -d
        tracimcli search index-populate -c /etc/tracim/development.ini -d

When is finished, you can quit your container. Index is now updated with all of your tracim content.

#### Example commands

Exemple with basic instance of tracim (local usage with webdav and caldav):

        docker run -e DATABASE_TYPE=sqlite \
               -p 8080:80 \
               -v ~/tracim/etc:/etc/tracim -v ~/tracim/var:/var/tracim algoo/tracim

To run tracim container with MySQL or PostgreSQL, you must set environment ``DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME`` variable.

Example with PostgreSQL:

    docker run -e DATABASE_TYPE=postgresql -e DATABASE_HOST=192.168.1.2 -e DATABASE_PORT=5432 \
               -e DATABASE_USER=tracim -e DATABASE_PASSWORD=tracim -e DATABASE_NAME=tracim \
               -p 8080:80 \
               -v ~/tracim/etc:/etc/tracim -v ~/tracim/var:/var/tracim algoo/tracim

Example with MySQL

    docker run -e DATABASE_TYPE=mysql -e DATABASE_HOST=192.168.1.2 -e DATABASE_PORT=3306 \
               -e DATABASE_USER=tracim -e DATABASE_PASSWORD=tracim -e DATABASE_NAME=tracim \
               -p 8080:80 \
               -v ~/tracim/etc:/etc/tracim -v ~/tracim/var:/var/tracim algoo/tracim

Example with SQLite

    docker run -e DATABASE_TYPE=sqlite \
               -p 8080:80 \
               -v ~/tracim/etc:/etc/tracim -v ~/tracim/var:/var/tracim algoo/tracim

Exemple with SQlite, email_notification and some small instance personnalisation:

    docker run -e DATABASE_TYPE=sqlite \
               -e TRACIM_EMAIL__NOTIFICATION__ACTIVATED=True \
               -e TRACIM_EMAIL__NOTIFICATION__SMTP__SERVER=xxxx.servermail.xx \
               -e TRACIM_EMAIL__NOTIFICATION__SMTP__PORT=25 \
               -e TRACIM_EMAIL__NOTIFICATION__SMTP__USER=xxxxxxxxxx \
               -e TRACIM_EMAIL__NOTIFICATION__SMTP__PASSWORD=xxxxxxxxxx \
               -e TRACIM_WEBSITE__TITLE=xxxxxx \
               -e TRACIM_WEBSITE__BASE_URL=http://{ip_or_domain} \
               -p 8080:80 \
               -v ~/tracim/etc:/etc/tracim -v ~/tracim/var:/var/tracim algoo/tracim

With this exemple, tracim is now accessible on my network and I can send notification by email when content change.

Exemple to use tracim with ElasticSearch: (you need to start elasticsearch first)

    docker run -e DATABASE_TYPE=sqlite \
               -e TRACIM_SEARCH__ENGINE=elasticsearch \
               -e TRACIM_SEARCH__ELASTICSEARCH__HOST={ip_of_elasticsearch_container} \
               -e TRACIM_SEARCH__ELASTICSEARCH__PORT=9200 \
               -e TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS=test_tracim \
               -p 8080:80 \
               -v ~/tracim/etc:/etc/tracim -v ~/tracim/var:/var/tracim algoo/tracim

Exemple to use tracim with ElasticSearch-ingest: (you need to create your elasticsearch-ingest image first and start this image before tracim)

    docker run -e DATABASE_TYPE=sqlite \
               -e TRACIM_SEARCH__ENGINE=elasticsearch \
               -e TRACIM_SEARCH__ELASTICSEARCH__HOST={ip_of_elasticsearch_container} \
               -e TRACIM_SEARCH__ELASTICSEARCH__PORT=9200 \
               -e TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS=test_tracim \
               -e TRACIM_SEARCH__ELASTICSEARCH__USE_INGEST=True \
               -p 8080:80 \
               -v ~/tracim/etc:/etc/tracim -v ~/tracim/var:/var/tracim algoo/tracim

⚠ After execute one of these command, tracim will be available on your system on port 8080.

### Build images

To build image

    cd tools_docker/Debian_Uwsgi
    docker build -t algoo/tracim:latest .

You can build with specific branch

    cd tools_docker/Debian_Uwsgi
    docker build --build-arg BRANCH="<branch_name>" -t algoo/tracim:<version_name> .

Ex: `docker build --build-arg BRANCH="feature/new_app" -t algoo/tracim:test_branch .`

You can also build image with specific tag (This build is make just with necessary files: no other branch available)

    cd tools_docker/Debian_Uwsgi
    docker build --build-arg TAG="<tag_name>" -t algoo/tracim:<tag_name> .

Ex: `docker build --build-arg TAG="release_02.00.00" -t algoo/tracim:release_02.00.00 .`

⚠ **Its not possible to build image with ARG TAG and ARG BRANCH in same time.**
