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

### Delete user(s)

Theses commands allow to delete user from database. Unlike deletion from tracim
ui which only make data not visible anymore, this command does delete content in
database, so you need to be careful using this.

user delete provide many parameter in order to choose how you want to delete user,
we suggest to anonymize them (see `-a` or `-b` ) if deleting them could create trouble.

```
$ tracimcli user delete -h
usage: tracimcli user delete [-h] [-c CONFIG_FILE] [-d] [-w] [-a] [-r] [-b]
                             [-f] [--dry-run] -l LOGINS [LOGINS ...]
                             [--anonymize-name ANONYMIZE_NAME]

Remove user and associated information from database

optional arguments:
  -h, --help            show this help message and exit
  -c CONFIG_FILE, --config CONFIG_FILE
                        application config file to read (default:
                        development.ini)
  -d, --debug_mode      enable tracim log for debug
  -w, --delete-owned-sharespaces
                        delete also owned sharespaces of user
  -a, --anonymize-if-required
                        anonymizes the user where he cannot be deleted
  -r, --delete-all-user-revisions
                        this allow to delete all user revisions. Warning !
                        This may create inconsistent database
  -b, --best-effort     trying doing the best deletion possible, same as '-w
                        -a'
  -f, --force           force user deletion, same as '-r -w'. Warning ! This
                        may create inconsistent database
  --dry-run             dry-run mode, simulate action to be done but do not
                        modify anything
  -l LOGINS [LOGINS ...], --login LOGINS [LOGINS ...]
                        user logins (email) to delete one or more user
  --anonymize-name ANONYMIZE_NAME
                        anonymized user display name to use if anonymize
                        option is activated
```

### Anonymize user(s)

You can also anonymize user without deleting any user data user using
`tracimcli anonymize` command.

```
$ tracimcli user anonymize -h
usage: tracimcli user anonymize [-h] [-c CONFIG_FILE] [-d] [--dry-run]
                                [--anonymize-name ANONYMIZE_NAME] -l LOGINS
                                [LOGINS ...]

anonymize user from database

optional arguments:
  -h, --help            show this help message and exit
  -c CONFIG_FILE, --config CONFIG_FILE
                        application config file to read (default:
                        development.ini)
  -d, --debug_mode      enable tracim log for debug
  --dry-run             dry-run mode
  --anonymize-name ANONYMIZE_NAME
                        anonymized user display name to use if anonymize
                        option is activated
  -l LOGINS [LOGINS ...], --login LOGINS [LOGINS ...]
                        user logins (email)
```

## Caldav ##

### Run service ###

    tracimcli caldav start

### Check and recreate agenda for user/workspace ###

in some case, agenda of user or workspace can failed to be created,
to check if all agenda are created and force their creation if they're not,
you can do:

    tracimcli caldav sync

## Webdav ##

### Run service ###

    tracimcli webdav start

## Help ##

    tracimcli -h
