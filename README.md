[![Build Status](https://travis-ci.org/tracim/tracim.svg?branch=master)](https://travis-ci.org/tracim/tracim) [![Coverage Status](https://img.shields.io/coveralls/tracim/tracim.svg)](https://coveralls.io/r/tracim/tracim) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/tracim/tracim/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/tracim/tracim/?branch=master) [![PyPI](https://img.shields.io/pypi/pyversions/tracim.svg)](https://pypi.python.org/pypi/tracim)

# Tracim - Introduction #

Tracim is a collaborative software designed to allow people to share and work on various data and document types.

If you hesitate to install a wiki, a forum or a file management software, stop hesitating and install Tracim.

With Tracim, you manage in the same place:

- forum-like threads,
- files and automatic versioning,
- wiki-like pages for online information,

All data offers:

- information status: open / resolved / cancelled / deprecated
- native versioning
- comment threads making Tracim knowledge-growth ready.

Join Tracim community : http://tracim.org

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

Traceability and versioning are very important for high-quality processes. Unfortunately, specialized software are hard to setup and use.

Let's try Tracim ! You define access-control for each workspace and store documents and file there. Users can't delete information: everything is versioned and never deleted.

The user interface is easy to use: it's based on the well-known folders and files explorer paradigm.

----

# Tracim - the software #

## Licence ##

Tracim is licensed under the terms of the [MIT License](https://opensource.org/licenses/mit-license.php)

## Technical information ##

Tracim is a web application:

* developed with python 3.4, 3.5, 3.6
* based on the [TurboGears](http://www.turbogears.org/) web framework.
* relying on [PostgreSQL](http://www.postgresql.org/) or [MySQL](https://www.mysql.fr/) or [SQLite](https://www.sqlite.org/) as the storage engine.

The user interface is based on the following resources and technologies:

* [Mako](http://www.makotemplates.org/) templating engine (server-side)
* [Bootstrap 3](http://getbootstrap.com/)
* [jQuery](http://wwwjquery.corm)
* Icons are taken from [Tango Icons](http://tango.freedesktop.org/) and [Font Awesome](http://fortawesome.github.io/Font-Awesome/)
* The design is based on the [Bootstrap dashboard example](http://getbootstrap.com/examples/dashboard/) and uses some images from [Start Boostrap free templates](http://startbootstrap.com/)

It runs on [Debian GNU/Linux](http://www.debian.org/), it should work out-of-the-box on [Ubuntu](http://www.ubuntu.com/) and also on other GNU/Linux distributions.

Hopefully it works on BSD and Windows OSes (but this has not been tested yet).

----

# Use it (or give it a try) #

## Online Demo ##

The easiest way to test Tracim is to test it through the online demo:

* [http://demo.tracim.fr](http://demo.tracim.fr)
* login as admin: admin@admin.admin
* password: admin@admin.admin

## Ask for a dedicated instance ##

If you want your own dedicated instance but do not want to manage it by yourself, let's contact me at damien.accorsi@free.fr

## Docker ##

In case you prefer using Docker:

    docker run -e DATABASE_TYPE=sqlite -p 80:80 -v /var/tracim/etc:/etc/tracim -v /var/tracim/var:/var/tracim algoo/tracim

## Install Tracim on your server ##

Following the installation documentation below, you'll be able to run your own instance on your server.

----

# Installation #

## Distribution dependencies ##

You'll need to install the following packages :

    sudo apt install git realpath redis-server \
                     python3 python-virtualenv python3-dev python-pip  python-lxml \
                     build-essential libxml2-dev libxslt1-dev zlib1g-dev libjpeg-dev \
                     libmagickwand-6.q16-3

## Get the source ##

Get the sources from GitHub:

    git clone https://github.com/tracim/tracim.git
    cd tracim/

## Frontend dependencies ##

[//]: # ( from https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)

Install `nodejs` by typing:

    curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
    sudo apt install -y nodejs

Check that this went well by getting `npm` version:

    npm -v

Then install frontend dependencies listed in the file `package.json`:

    npm install

At last, compile frontend files:

    npm run gulp-dev # for a development environment
    # npm run gulp-prod # for a production environment

## Tracim virtual environment ##

Create a python virtual environment:

    virtualenv -p /usr/bin/python3 tg2env

Activate it in your terminal session (**all tracim command execution must be executed under this virtual environment**):

    source tg2env/bin/activate

Ensure latest `pip`/`setuptools` versions are installed:

    pip install --upgrade pip setuptools

Install Tracim and its dependencies:

    cd tracim/
    python setup.py develop
    pip install -r ../install/requirements.txt

## Configuration files ##

Create configuration files for a development environment and for `WsgiDAV`:

    cp development.ini.base development.ini
    cp wsgidav.conf.sample wsgidav.conf

## Translation ##

Compile translation binary files from available catalogs:

    python setup.py compile_catalog

## Database schema ##

The last step before running the application is to initialize the database
schema. This is done through the following command:

    gearbox setup-app

## Running Tracim ##

The two parameters are optional but useful to reload the server upon code changes and to get debug data:

    gearbox serve --reload --debug

You can now enter the application at
[http://127.0.0.1:8080](http://127.0.0.1:8080) and login with admin user:

 * user : `admin@admin.admin`
 * password : `admin@admin.admin`

If admin user not created yet, execute following command:

    gearbox user create -l admin@admin.admin -p admin@admin.admin -g managers -g administrators

Enjoy :)

# Going further #

Here is additional documentation about configuring:

 * [Apache](doc/apache.md)
 * [PostgreSQL, MySQL and SQLAlchemy](doc/database.md)
 * [Tracim](doc/setting.md)

# Support and Community #

Building the community is a work in progress.

Need help ? Do not hesitate to contact me : damien.accorsi@free.fr

<a href='https://www.browserstack.com' target="_blank">
    <img src="https://raw.githubusercontent.com/tracim/tracim/master/tracim/tracim/public/assets/img/logo_browserstack.png" width="150">
</a>

BrowserStack support open source project and graciously helps us testing Tracim on every devices.
