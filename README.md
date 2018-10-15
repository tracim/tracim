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

This script use command with sudo, make sure you have installed and configured sudo.
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

This script use command with sudo, make sure you have installed and configured sudo.

## Running Tracim using pserve ##

    cd backend/
    source env/bin/activate
    pserve development.ini

You can now enter the application at
[http://127.0.0.1:6543](http://127.0.0.1:6543) and login with admin user:

 * user: `admin@admin.admin`
 * password: `admin@admin.admin`

----

## Running tests with cypress ##

----

## Installation of cypress: Automated script for easy setup ##

This script check if nodejs is installed (npm is necessary to install Cypress), if file package.json and cypress.json exist in 'functionnal_tests' folder. if not the script install necessary file and install Cypress and his dependency's.

    ./install_cypress.sh

## Run tests with command line ##

This command run all test present in 'cypress_test' folder.

    cd functionnal_tests/
    ./node_modules/.bin/cypress run

## Run tests with cypressgui ##

Open Cypress with graphical interface. You can show test running directly in web interface.

    cd functionnal_tests/
    ./node_modules/.bin/cypress open


