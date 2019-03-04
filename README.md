develop branch status:
[![Build Status](https://travis-ci.org/tracim/tracim.svg?branch=develop)](https://travis-ci.org/tracim/tracim)
[![Coverage Status](https://coveralls.io/repos/github/tracim/tracim/badge.svg?branch=develop)](https://coveralls.io/github/tracim/tracim?branch=develop)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/tracim/tracim/badges/quality-score.png?b=develop)](https://scrutinizer-ci.com/g/tracim/tracim/?branch=develop)

## What is tracim?

Tracim is a collaborative plateforme software intended for (not only technical) team collaboration. It is simple to use, offers a user-friendly interface and runs on every computer. It is very valuable for R&D teams, assocations, remote collaboration.

More information on the website: https://www.tracim.fr (in French)

## Quickstart (using docker)

Test  tracim on your computer with docker:

```
TRACIM_STORAGE=~/tracim
mkdir -p $TRACIM_STORAGE/etc
mkdir -p $TRACIM_STORAGE/var
docker run -e DATABASE_TYPE=sqlite -p 8080:80 -v $TRACIM_STORAGE/etc/:/etc/tracim -v $TRACIM_STORAGE/var:/var/tracim algoo/tracim
```
Then visit the url http://localhost:8080 and login in to tracim:

- email: `admin@admin.admin`
- password: `admin@admin.admin`

For advanced docker-based usage, look at the full [tracim docker documentation](https://github.com/tracim/tracim/tree/develop/tools_docker), 

## Licence 

Tracim is distributed under the terms of the MIT License.

## Contribute

In order to contribute to tracim source_code, please read [CONTRIBUTING.md](./CONTRIBUTING.md) file

## Advanced - Install tracim from the sources

### Get the source

Get the sources from GitHub (you need git):

    git clone https://github.com/tracim/tracim.git
    cd tracim/

### Install backend

#### Option 1: Install backend manually

see [Backend README](backend/README.md)

#### Option2: Install backend: Automated script for easy setup

This script run backend with simple default conf: development.ini conf file, use
default config file, sqlite database, etc...

    ./setup_default_backend.sh

This script use command with sudo, make sure you have installed and configured sudo.
You can run also with root if you add root in parameter of this script.

For each conf file missing, this script will generated them from default conf.
If sqlite default database is missing, script will generate it.
This script is also able to serve for update. If you want to update a script
generated tracim install, you can just update source code with git pull and
rerun the same script to update database model, system deps and python deps.

for more information about configuring tracim_backend, see [Backend README](backend/README.md)
for more information about configuration file, see development.ini.sample documentation
and [Backend setting file doc](backend/doc/setting.md).


### Install frontend: Automated Script for easy setup

    ./install_frontend_dependencies.sh
    ./build_full_frontend.sh

This script use command with sudo, make sure you have installed and configured sudo.
You can run also with root if you add root in parameter of this script.
  
You can add "-d" to build_full_frontend.sh to disabled obfuscation and reduce build time. 

### Run tracim (using pserve)

    cd backend/
    source env/bin/activate
    pserve development.ini

You can now enter the application at
[http://127.0.0.1:6543](http://127.0.0.1:6543) and login with admin user:

 * user: `admin@admin.admin`
 * password: `admin@admin.admin`

### Running tests with Cypress

#### Installation of Cypress: Automated script for easy setup

This script check if nodejs is installed (npm is necessary to install Cypress), if file package.json and cypress.json exist in 'functionnal_tests' folder. if not the script install necessary file and install Cypress and his dependency's.

    ./setup_functionnal_tests.sh

This script use command with sudo, make sure you have installed and configured sudo.
You can run also with root if you add root in parameter of this script.

If you need to run cypress with external server of tracim, modify "baseurl" in cypress.json (look here for more detail: https://docs.cypress.io/guides/references/configuration.html#Options ).

#### Prerequisit for running Cypress tests

⚠ To launch cypress test, you need a running tracim with specific config

    cd backend/
    source env/bin/activate
    pserve cypress_test.ini
    
#### If you are running tests in a development environment

You must change the apiUrl property in `frontend/configEnv.json` to 

    http://localhost:1337/api/v2

Then rebuild the frontend
    
    cd frontend/
    npm run build 

#### Run tests with command line ##

This command run all test present in 'functionnal_tests/cypress/integration' folder.

    cd functionnal_tests/
    npm run cypress-run

#### Run tests with cypressgui ##

Open Cypress with graphical interface. You can show test running directly in web interface.

    cd functionnal_tests/
    npm run cypress-open
