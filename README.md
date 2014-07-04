# Introduction to POD #

Pod is collaborative software designed to allow people to work on and share various data and document types. 

It is [AGPL licenced](http://fr.wikipedia.org/wiki/GNU_Affero_General_Public_License) software.

Pod is licensed under the terms of the 
[GNU Affero General Public License](http://www.gnu.org/licenses/agpl.txt)
as published by the [Free Software Foundation](http://www.fsf.org/).

It is currently unstable, it is recommended to use it for test purpose only.

It's a python 3 web application based on [TurboGears](http://www.turbogears.org/); it uses [PostgreSQL](http://www.postgresql.org/) as storage engine.

## Features ##

* Data and document sharing: text documents, files, contact, calendar, comments
* Data and document status
* Full traceability
* Access control management, document granularity.

It allows to keep private and shared data in the same place.
The ACL is based on share with groups or individual users.

## Give it a try ##

### Online demo ###
The fastest way to test it is to test the demo:

* http://demo.archipeldata.com
* login: demo@archipeldata.com
* password: demo

### Install your own instance ###

The other way to test it is to install it on your computer. See documentation below.

## Installation ##

### Dependencies###

Note: the following information is for Debian. For other OS, adapt the package names.

You'll need to install the following packages:

    apt-get install realpath python3 python-virtualenv python3-dev python-pip build-essential postgresql-server-dev-all

If you work on a local database, then you also need to install PostgreSQL:

    apt-get install postgresql postgresql-client

### Get the source ###

Get the sources from Bitbucket:

    git clone https://bitbucket.org/lebouquetin/pod.git

**Note: Now everything is documented to be executed from the pod directory newly created.**

### Setup a database ###

#### Allowing local connections on PostgreSQL ####

Check the pg_hba.conf file, it should allow connection for user/pass through loopback IP address.
The file should include the following configuration:

    # IPv4 local connections:
    host    all             all             127.0.0.1/32            md5

Note: on Debian, the pg\_hba file is found at /etc/postgresql/9.1/main/pg_hba.conf

If you changed the file, reload PostgreSQL:

    service postgresql reload

#### Create a new database and user on PostgreSQL ####

We suppose you will create a user named _poduser_ with passowrd _podpassword_
and a database _poddb_

First login as root, then su as postgre and run a PostgreSQL client:

    root@hostname:~# su postgres
    postgres@hostname:/root$ psql
    psql (9.1.13)
    Type "help" for help.
    
    postgres=# 
    
    
Now, type the following commands:

    CREATE ROLE poduser WITH LOGIN PASSWORD 'podpassword';
    CREATE DATABASE poddb OWNER poduser;
    GRANT ALL PRIVILEGES ON DATABASE poddb TO poduser;

At the end, you can quit the psql client by running the \q quit command:

    postgres=# \q
    postgres@mozart:/root$

#### Test the database access ####

You can test your newly created user by running the following command:

    psql -h 127.0.0.1 -W -U poduser poddb -c 'SELECT NOW();'

The result should be similar to:

    user@hostname:~$ psql -h 127.0.0.1 -W -U poduser poddb -c 'SELECT NOW();'
    Password for user poduser: 
                  now              
    -------------------------------
     2014-06-16 11:35:48.590838+02
    (1 row)

#### Setup the database schema and initial data ####

Your database is now ready. Fill it with the required schema and data by importing SQL:

    psql -h 127.0.0.1 -W -U poduser poddb < doc/database/pod-init-database.sql

You can test it through the following command:

    user@hostname:~$ psql -h 127.0.0.1 -W -U poduser poddb -c 'SELECT * from pod_user;'

You should find the admin@localhost user entry.

### Setup python virtualenv ###

Pod uses virtualenv as deployment environment. This ensure that there will be no 
conflict between system-wide python modules and pod required ones.

    virtualenv -p /usr/bin/python3 tg2env
    source tg2env/bin/activate
    cd pod && python setup.py develop && cd -
    pip install -r install/requirements.txt
    
Notes:

* Debian: you may get errors with stevedore/pbr which is not supported by python 3.2
(debian version of python 3). This is not a real problem
* Ubuntu (at least 14.04): you should remove _distribute_ and _wsgiref _
  from the requirements.txt file

### Create configuration ###

    cp pod/development.ini.base pod/development.ini

#### Database 

Configure database in the development.ini file. This is defined as sqlalchemy.url
and the default value is below:

    sqlalchemy.url = postgresql://pod_user:pod_user_password@127.0.0.1:5432/pod

#### Listening port

Default configuration is to listen on port 8080. If you want to adapt this to your environment, edit the .ini file and setup the port you want:

    port = 8080

#### Interface language

The default language is English. You can change it to french by uncommenting the following line in the .ini file:

    lang = fr_FR

    
### Running Pod as standalone ###

Now you can run the standalone server:

    ./bin/run.sh
    
Which should result in something like this:

    13:53:49,982 INFO  [gearbox] Starting subprocess with file monitor
    13:53:50,646 WARNI [py.warnings] /tmp/pod/protov1/tg2env/lib/python3.2/site-packages/tw2/core/validation.py:12: ImportWarning: Not importing directory '/tmp/pod/protov1/tg2env/lib/python3.2/site-packages/tw2/core/i18n': missing __init__.py
      from .i18n import _
    
    13:53:50,862 INFO  [gearbox] Starting server in PID 11174.
    Starting HTTP server on http://0.0.0.0:8080
    
You can now enter the application at [http://localhost:8080](http://localhost:8080) and login:

* user : admin@localhost
* password : admin
    
Enjoy :)


### Running Pod through Apache WSGI ###

#### Dependencies ####

Install dependencies:

    apt-get install apache2 libapache2-mod-wsgi-py3

#### WSGI configuration ####

Example of Apache WSGI configuration. This configuration refers to productionapp.wsgi which is a copy of the file *app.wsgi* available in the repo. (this file has to be updated to match with your environment and installation)

    <VirtualHost *:80>
        ServerAdmin webmaster@archipeldata.com
        ServerName demo.archipeldata.com

        WSGIProcessGroup pod
        WSGIDaemonProcess pod user=www-data group=adm threads=4 python-path=/opt/podinstall/tg2env/lib/python3.2/site-packages
        WSGIScriptAlias / /opt/podinstall/pod/productionapp.wsgi

        #Serve static files directly without TurboGears
        Alias /img     /opt/podinstall/pod/pod/public/img/
        Alias /favicon.ico /opt/podinstall/pod/pod/public/favicon.ico
        Alias /css        /opt/podinstall/pod/pod/public/css
        Alias /javascript /opt/podinstall/pod/pod/public/javascript

        CustomLog /var/log/apache2/demopod-access.log combined
        ErrorLog /var/log/apache2/demopod-error.log
        LogLevel debug
    </VirtualHost>

### Help required ###

If you need help, contact us. If you want to help, contact us. So... contact us ;)

Damien Accorsi - damien.accorsi@free.fr