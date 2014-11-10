# Tracim - Introduction #

Tracim is a collaborative software designed to allow people to share and work on various data and document types.

If you hesitate to install a wiki, a forum or a file management software, stop hesitating and install Tracim.

With Tracim, you manage in the same place:

- forum-like threads,
- files and automatic versionning,
- wiki-like pages for online information,

All data offers:

- information status: open / resolved / cancelled / deprecated
- native versionning
- comment threads making tracim knowledge-growth ready.

## Use-cases ##

### Collaborate with clients ###

Share information with your clients.

In the same place you will be able to share trouble-shooting threads, files and general information. You can define who the information is shared with.

Example: share the documentation with all your users, run a forum open to your clients, another forum for your collaborators and share troubleshooting threads with each of your clients in a private workspace.

### Run a community of experts or passionate people ###

Collaborate and share experience and stimulate knowledge growth.

In a unique place, you centralize files and threads, and raw information too. Every collaborator can update the information status.
Stop worrying about information loss: the traceability is at the hearth of Tracim.

The newcomers knowledge growth is easy because all information has a status and full history.
You get the status of information and know how it got there.

### Work on quality-driven projects ###

In quality-driven projects like research and development, knowledge and quality are more important that task ownership and deadlines.

With Tracim, you centralize information, you can stay in touch by configuring your email notifications and work on several projects.

### Manage documents and files ###

Traceability and versionning are very important for high-quality processes. Unfortunately, specialized software are hard to setup and to use.

Let's try Tracim ! You define access-control for each workspace and store documents and file there. Users can't delete information: everything is versionned and never deleted.

The user interface is easy to use: it's based on the well-known folders and files explorer paradigm.

----

# Tracim - the software #

## Licence ##

Tracim is licensed under the terms of the 
[GNU Affero General Public License](http://www.gnu.org/licenses/agpl.txt) as published by the [Free Software Foundation](http://www.fsf.org/).

## Technical information ##

Tracim is a web application:

* developed with python 3.
* based on the [TurboGears](http://www.turbogears.org/) web framework.
* relying on [PostgreSQL](http://www.postgresql.org/) as the storage engine.

The user interface is based on the following resources and technologies:

* [Mako](http://www.makotemplates.org/) templating engine (server-side)
* [Bootstrap 3](http://getbootstrap.com/)
* [jQuery](http://wwwjquery.corm)
* Icons are taken from [Tango Icons](http://tango.freedesktop.org/) and [Font Awesome](http://fortawesome.github.io/Font-Awesome/)
* The design is based on the [Bootstrap dashboard example](http://getbootstrap.com/examples/dashboard/) and uses some images from [Start Boostrap free templates](http://startbootstrap.com/)



It runs on [Debian GNU/Linux](http://www.debian.org/), it should work out-of-the-box on [Ubuntu](http://www.ubuntu.com/) and also on other GNU/Linux distributions.

Hopefully it works on BSD and Windows OSes (but this has not been tested yet)

----

# Use it (or give it a try) #

## Online Demo ##

The easiest way to test Tracim is to test it through the online demo:

* [http://sandbox.tracim.org](http://sandbox.tracim.org)
* login as admin: admin@admin.admin
* password: admin@admin.admin

## Ask for a dedicated instance ##

If you wan't your own dedicated instance but do not want to manage it by yourself, let's contact me at damien.accorsi@free.fr

## Install Tracim on your server ##

Following the installation documentation below, you'll be able to run your own instance on your server.

----

# Installation #

## Dependencies ##

_Note: the following information is for Debian. For other OS, adapt the package names._

You'll need to install the following packages:

    apt-get install realpath python3 python-virtualenv python3-dev python-pip build-essential postgresql-server-dev-all

If you work on a local database, then you also need to install PostgreSQL:

    apt-get install postgresql postgresql-client

## Installation ##

### Get the source ###

Get the sources from Bitbucket:

    git clone https://bitbucket.org/lebouquetin/tracim.git

*Note: Now everything is documented to be executed from the tracim directory newly created.*

### Setting-up python virtualenv ###

_Reminder : Tracim is developped and tested using python3._

Tracim uses virtualenv as deployment environment. This ensure that there will be no 
conflict between system-wide python installation and Tracim required ones.

    virtualenv -p /usr/bin/python3 tg2env
    source tg2env/bin/activate
    cd tracim && python setup.py develop && cd -
    pip install -r install/requirements.txt
    ./bin/tg2env-patch tg2env/
    
Notes:

* Debian: you may get errors with stevedore/pbr which is not supported by python 3.2
(debian version of python 3). This is not a real problem
* Ubuntu (at least 14.04): you should remove _distribute_ and _wsgiref _
  from the requirements.txt file

## Database Setup ##

### Minimalist introduction to PostgreSQL ###

If you already use/know PostgreSQL, you can directly go to *Test the database access*.

#### Allowing local connections on PostgreSQL ####

PostgreSQL stores connections ahtorization in *pg\_hba.conf*

Edit the pg_hba.conf file and check that connectionx from 127.0.0.1 are allowed using user/password. You should find the following line in the file:

    # IPv4 local connections:
    host    all             all             127.0.0.1/32            md5

Note: on Debian, the *pg\_hba.conf* file is found at */etc/postgresql/9.1/main/pg\_hba.conf*

If you changed the file, reload PostgreSQL:

    service postgresql reload

#### Creating a user and associated database ####

You need a database and associated user/password.

Tracim comes with a tool that will make this step easy : pgtool.

    ~/tracim$ ./bin/pgtool help

login as *postgres* user and run the follwoing commands (which are self explanatory)

    ./bin/pgtool create_user tracimuser tracimpassword
    ./bin/pgtool create_database tracimdb
    ./bin/pgtool grant_all_priviles tracimdb tracimuser

Notes :

* in order to login as postgres user, su as root (with your password) then su postgres.
* pgtool also offers options to delete users / databases. Run *./bin/pgtool help* for more information

#### Test the database access ####

So, now you have a database and an associated user/password.

A good habit is to test things before to use them, that's why we want to test the database access now. This is easily done with tracim pgtool :

    ./bin/pgtool test_connection tracimdb tracimuser tracimpassword 127.0.0.1

The result is similar to the following :

    PG # CONNECT TO DATABASE
    ------------------------
    server:     127.0.0.1
    database:   tracimdb
    username:   bibi

                  now              
    -------------------------------
     2014-11-10 09:40:23.306199+01
    (1 row)

In case of failure, you would get something like this:

    PG # CONNECT TO DATABASE
    ------------------------
    server:     127.0.0.1
    database:   tracimdb
    username:   bibi

    psql: FATAL:  password authentication failed for user "bibi"
    FATAL:  password authentication failed for user "bibi"
    ERRROR

In this case, delete the user and database you previously created (using pgtool) and do it again. Do not forget to run the grant_all_rights command!

## Configuration ##

At this point, you have :

* an installation of Tracim with its dedicated python3-ready virtualenv
* a PostgreSQL server and dedicated database

What you have to do now is to configure the application and to initialize the database content.

### Create configuration ###

    cp tracim/development.ini.base tracim/development.ini

You can now edit the file and setup required files. Here are the main ones:

#### Database access ####

Configure database in the development.ini file. This is defined as sqlalchemy.url
and the default value is below:

    sqlalchemy.url = postgresql://tracimuser:tracimpassword@127.0.0.1:5432/tracimdb?client_encoding=utf8

#### Listening port

Default configuration is to listen on port 8080. If you want to adapt this to your environment, edit the .ini file and setup the port you want:

    port = 8080

#### Interface language

The default language is English. You can change it to French by uncommenting the following line in the .ini file:

    lang = fr

#### SMTP parameters for resetpassword and notifications

for some reason, you have to configure SMTP parameters for rest password process and SMTP parameters for notifications in separate places.

The reset password related parameters are the follwoing ones :

    resetpassword.email_sender = tracim@mycompany.com
    resetpassword.smtp_host = smtp.mycompany.com
    resetpassword.smtp_port = 25
    resetpassword.smtp_login = username
    resetpassword.smtp_passwd = password

The main parameters for notifications are the following ones:

    email.notification.from = Tracim Notification <tracim@tmycompany.com>
    email.notification.smtp.server = smtp.mycompany.com
    email.notification.smtp.port = 25
    email.notification.smtp.user = username
    email.notification.smtp.password = password

#### Website ####

You must define general parameters like the base_url and the website title which are required for home page and email notification links

    website.title = My Company Intranet
    website.base_url = http://intranet.mycompany.com:8080

#### Other parameters  ####

There are other parameters which may be of some interest for you. For example, you can:

* include a JS tracker like Piwik or Google Analytics,
* define your own notification email subject
* personalize notification email
* personalize home page (background image, title color...)
* ...

### database schema ###

The last step before to run the application is to initialize the database schema. This is done through the following command:

    source tg2env/bin/activate
    cd tracim && gearbox setup-app && cd -

## Running the server ##

### Running Tracim in standalone mode ###

Now you can run the standalone server:

    ./bin/run.sh
    
Which should result in something like this:

    13:53:49,982 INFO  [gearbox] Starting subprocess with file monitor
    13:53:50,646 WARNI [py.warnings] /tmp/tracim/protov1/tg2env/lib/python3.2/site-packages/tw2/core/validation.py:12: ImportWarning: Not importing directory '/tmp/tracim/protov1/tg2env/lib/python3.2/site-packages/tw2/core/i18n': missing __init__.py
      from .i18n import _
    
    13:53:50,862 INFO  [gearbox] Starting server in PID 11174.
    Starting HTTP server on http://0.0.0.0:8080
    
You can now enter the application at [http://localhost:8080](http://localhost:8080) and login:

* user : admin@admin.admin
* password : admin@admin.admin
    
Enjoy :)

### Running Tracim through Apache WSGI ###

#### Dependencies ####

Install dependencies:

    apt-get install apache2 libapache2-mod-wsgi-py3

#### WSGI configuration ####

Example of Apache WSGI configuration. This configuration refers to productionapp.wsgi which is a copy of the file *app.wsgi* available in the repo. (this file has to be updated to match with your environment and installation)

    <VirtualHost *:80>
        ServerAdmin webmaster@tracim.mycompany.com
        ServerName tracim.mycompany.com

        WSGIProcessGroup tracim
        WSGIDaemonProcess tracim user=www-data group=adm threads=4 python-path=/opt/traciminstall/tg2env/lib/python3.2/site-packages
        WSGIScriptAlias / /opt/traciminstall/tracim/productionapp.wsgi

        #Serve static files directly without TurboGears
        Alias /assets     /opt/traciminstall/tracim/tracim/public/assets
        Alias /favicon.ico /opt/traciminstall/tracim/tracim/public/favicon.ico

        CustomLog /var/log/apache2/demotracim-access.log combined
        ErrorLog /var/log/apache2/demotracim-error.log
        LogLevel debug
    </VirtualHost>

# Support and Community #

Building the community is a work in progress.

Need help ? Do not hesitate to contact me : damien.accorsi@free.fr

