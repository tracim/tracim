## Tracim with Docker

### Build images

To build Prod/dev designed image

    docker build -t algoo/tracim:latest .

### Run containers

#### Run Prod/dev containers

Environment variables are:

* DATABASE_TYPE (values: postgresql, mysql, sqlite)

If DATABASE_TYPE is `postgresql` or `mysql`, please set these variables:

* DATABASE_USER
* DATABASE_PASSWORD
* DATABASE_HOST
* DATABASE_PORT
* DATABASE_NAME

Volumes are:

* /etc/tracim
* /var/tracim (used for SQLite database and radicale)

Ports are:

* 80 (industracim web interface)

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

After execute one of these command, tracim will be available on your system on port 80.
