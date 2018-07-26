# Performing migrations #

## Introduction ##

This document is intended to developers.

Migrations on `Tracim` lays on [`alembic`](http://alembic.zzzcomputing.com/en/latest/index.html) which is the migration tool dedicated to `SQLAlchemy`.

In order to use the `tracimcli` commands, go to the root of the project and
and active the Tracim virtualenv:

    user@host:~/tracim_backend$ source env/bin/activate
    (env) user@host:~/tracim_backend$

## Migration howto - Overview ##
   
### Upgrading schema to last revision ###

    alembic -c development.ini upgrade head

### Downgrading schema ###

    alembic -c development.ini downgrade -1

## Migration howto - Advanced (for developers) ##

### Retrieving schema current version ###

    alembic -c development.ini current

### Creating new schema migration ###

This creates a new auto-generated python migration file 
in `tracim/migration/versions/` ending by `migration_label.py`:

    alembic -c development.ini revision --autogenerate -m "migration label"
