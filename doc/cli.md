## TracimCli ##

Tracim has a build-in command line tool.

## Introduction ##

This document is intended to developers or sysadmin.

In order to use the `tracimcli` commands, change your current directory to be `tracim/` from the root of the project, also usually named `tracim/` 
and active the Tracim virtualenv:

    user@host:~/tracim_backend$ cd tracim/
    user@host:~/tracim_backend/tracim$ source env/bin/activate
    (env) user@host:~/tracim_backend/tracim$

## Database ##

### Create database

    tracim db init

## User ##
   
### add a user

    tracimcli user create -l "john@john@john.john" -p "superpassword"

### update user password

    tracimcli user update -l "john@john@john.john" -p "mynewsuperpassword"

### Help

    tracim user create -h
    tracim user update -h
 
## Help ##

    tracimcli -h
    



