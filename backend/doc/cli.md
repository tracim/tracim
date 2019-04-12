# TracimCli #

Tracim has a build-in command line tool.

## Introduction ##

This document is intended to developers or sysadmin.

In order to use the `tracimcli` commands, go to the root of the project and
and active the Tracim virtualenv:

    user@host:~/tracim_backend$ source env/bin/activate
    (env) user@host:~/tracim_backend$

## Database ##

### Create database

    tracimcli db init

### Create database with some default test data (many users, workspaces, etc…)

    tracimcli db init --test-data

### Delete database /!\

This will drop all your database, be carefull !

    tracimcli db delete --force

## User ##
   
### add a user

    tracimcli user create -l "john@john@john.john" -p "superpassword"

### update user password

    tracimcli user update -l "john@john@john.john" -p "mynewsuperpassword"

### Help

    tracimcli user create -h
    tracimcli user update -h
 
## Caldav ##

### Run service ###

    tracimcli caldav start

### Check and recreate agenda for user/workspace ###

in some case, agenda of user or workspace can failed to be created,
to check if all agenda are created and force their creation if they're not,
you can do:

    tracimcli caldav agenda create

## Webdav ##

### Run service ###

    tracimcli webdav start

## Help ##

    tracimcli -h
