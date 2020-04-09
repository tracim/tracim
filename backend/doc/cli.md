# Controlling Tracim from the Command Line Using `tracimcli` #

Tracim has a build-in command line tool.

## Introduction ##

This document is intended to developers or sysadmin.

In order to use the `tracimcli` commands, go to the root of the project and
and active the Tracim virtualenv:

    user@host:~/tracim_backend$ source env/bin/activate
    (env) user@host:~/tracim_backend$

## Database ##

### Create the database

    tracimcli db init

### Create the database with some default test data (many users, workspaces, etc…)

    tracimcli db init --test-data

### Delete the database /!\

This will drop the entire database, be careful!

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

Theses commands allow deleting users from the database. Unlike deletion from the Tracim
UI which only hides data, this command does delete the content from database, so be careful using this.

`user delete` provides many parameters in order to choose how you want to delete an user.
We suggest to anonymize them (see `-a` or `-b` ) in case deleting them might cause trouble.

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
  -d, --debug_mode      enable Tracim log for debug
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

### Anonymize User(s)

You can also anonymize user without deleting any user data user using
command `tracimcli anonymize`.

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

### Run the Service ###

    tracimcli caldav start

### Check and Recreate the Agenda for a User/Workspace ###

In some cases, creating the agenda of an user or a workspace can fail.
To check if all agendas are created and to force their creation if they are not,
you can run:

    tracimcli caldav sync

## WebDAV ##

### Run the Service ###

    tracimcli webdav start

## Help ##

    tracimcli -h
