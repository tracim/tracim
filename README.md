develop branch status:
[![Build Status](https://travis-ci.org/tracim/tracim_v2.svg?branch=develop)](https://travis-ci.org/tracim/tracim_v2)
[![Coverage Status](https://coveralls.io/repos/github/tracim/tracim_v2/badge.svg?branch=develop)](https://coveralls.io/github/tracim/tracim_v2?branch=develop)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/tracim/tracim_v2/badges/quality-score.png?b=develop)](https://scrutinizer-ci.com/g/tracim/tracim_v2/?branch=develop)

## Install Tracim on your server ##

Following the installation documentation below, you'll be able to run your own instance on your server.

----

# Installation #

## Get the source ##

Get the sources from GitHub:

    git clone https://github.com/tracim/tracim_v2.git
    cd tracim_v2/

## Install backend ##

    ./setup_default_backend.sh

For debugging you can uncomment this 2 lines in '/backend/development.ini'
    
    ~~~
    #pyramid.includes =
    #    pyramid_debugtoolbar
    ~~~

If you use debugtoolbar, you can seen one red button on right of the Tracim web interface.

## Install frontend ##

    ./install_frontend_dependencies.sh
    ./build_full_frontend.sh

## Running Tracim  ##

    cd backend/
    source env/bin/activate
    pserve development.ini

You can now enter the application at
[http://127.0.0.1:6543](http://127.0.0.1:6543) and login with admin user:

 * user : `admin@admin.admin`
 * password : `admin@admin.admin`


