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

If you want to use webdav:

* START_WEBDAV=1

If you want to use reply_by_email function:

* REPLY_BY_EMAIL=1 (if email reply is enabled)

If you want to use async for sendinf email

* EMAIL_MODE_ASYNC=1 (for async email notification)

#### Example commands

To run tracim container with MySQL or PostgreSQL, you must set environment ``DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME`` variable.

Example with PostgreSQL:

    docker run -e DATABASE_TYPE=postgresql -e DATABASE_HOST=192.168.1.2 -e DATABASE_PORT=5432 \
               -e DATABASE_USER=tracim -e DATABASE_PASSWORD=tracim -e DATABASE_NAME=tracim \
               -p 80:80 \
               -v /var/tracim/etc/:/etc/tracim -v /var/tracim/var:/var/tracim algoo/tracim

Example with MySQL

    docker run -e DATABASE_TYPE=mysql -e DATABASE_HOST=192.168.1.2 -e DATABASE_PORT=3306 \
               -e DATABASE_USER=tracim -e DATABASE_PASSWORD=tracim -e DATABASE_NAME=tracim \
               -p 80:80 \
               -v /var/tracim/etc/:/etc/tracim -v /var/tracim/var:/var/tracim algoo/tracim

Example with SQLite

    docker run -e DATABASE_TYPE=sqlite \
               -p 80:80 \
               -v /var/tracim/etc/:/etc/tracim -v /var/tracim/var:/var/tracim algoo/tracim
               
Exemple with SQlite, webdav, reply_by_email and email_mode_async

    docker run -e DATABASE_TYPE=sqlite \
               -e START_WEBDAV=1 \
               -e REPLY_BY_EMAIL=1 \
               -e EMAIL_MODE_ASYNC=1 \
               -p 80:80 \
               -v /var/tracim/etc/:/etc/tracim -v /var/tracim/var:/var/tracim algoo/tracim


After execute one of these command, tracim will be available on your system on port 80.

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
