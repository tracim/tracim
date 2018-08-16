develop branch status:
[![Build Status](https://travis-ci.org/tracim/tracim_v2.svg?branch=develop)](https://travis-ci.org/tracim/tracim_v2)
[![Coverage Status](https://coveralls.io/repos/github/tracim/tracim_v2/badge.svg?branch=develop)](https://coveralls.io/github/tracim/tracim_v2?branch=develop)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/tracim/tracim_v2/badges/quality-score.png?b=develop)](https://scrutinizer-ci.com/g/tracim/tracim_v2/?branch=develop)


## Install Tracim on your server ##

Following the installation documentation below, you'll be able to run your own instance on your server.

----

# Installation #

## Get the source ##

Get the sources from GitHub (you need git):

    git clone https://github.com/tracim/tracim_v2.git
    cd tracim_v2/

## Install backend
### Option 1: Install backend manually ###

see [Backend README](backend/README.md)

### Option2: Install backend: Automated script for easy setup ###

This script run backend with simple default conf: development.ini conf file, use
default config file, sqlite database, etc...

    ./setup_default_backend.sh

For each conf file missing, this script will generated them from default conf.
If sqlite default database is missing, script will generate it.
This script is also able to serve for update. If you want to update a script
generated tracim install, you can just update source code with git pull and
rerun the same script to update database model, system deps and python deps.

for more information about configuring tracim_backend, see [Backend README](backend/README.md)
for more information about configuration file, see development.ini.sample documentation
and [Backend setting file doc](backend/doc/setting.md).


## Install frontend: Automated Script for easy setup ##

    ./install_frontend_dependencies.sh
    ./build_full_frontend.sh

## Running Tracim using pserve ##

    cd backend/
    source env/bin/activate
    pserve development.ini

You can now enter the application at
[http://127.0.0.1:6543](http://127.0.0.1:6543) and login with admin user:

 * user: `admin@admin.admin`
 * password: `admin@admin.admin`


