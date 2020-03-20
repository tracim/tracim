# Performing Migrations #

## Introduction ##

This document is intended to developers.

Migrations on `Tracim` lays on [`alembic`](http://alembic.zzzcomputing.com/en/latest/index.html) which is the migration tool dedicated to `SQLAlchemy`.

In order to use the `tracimcli` commands, go to the root of the project and
and activate the Tracim virtualenv:

    user@host:~/tracim_backend$ source env/bin/activate
    (env) user@host:~/tracim_backend$

## Migration How-To - Overview ##
   
### Upgrading the Schema to the Last Revision ###

    alembic -c development.ini upgrade head

### Downgrading the Schema ###

    alembic -c development.ini downgrade -1

## Migration How-To - Advanced (for Developers) ##

### Retrieving the Current Version of the Schema ###

    alembic -c development.ini current

## Set Alembic Stamp to the Last Version (First-Time Use) ##

    alembic -c development.ini stamp head

### Creating a New Schema Migration ###

This creates a new auto-generated python migration file 
in `tracim_backend/migration/versions/` ending with `migration_label.py`:

    alembic -c development.ini revision --autogenerate -m "migration label"
