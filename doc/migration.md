# Performing migrations #

## Introduction ##

Migrations on `Tracim` lays on [`gearbox migrate`](http://turbogears.readthedocs.io/en/tg2.3.7/turbogears/migrations.html), which in turn lays on [`alembic`](http://alembic.zzzcomputing.com/en/latest/index.html) which is the migration tool dedicated to `SQLAlchemy`.

## Quick summup ##

In order to use the `gearbox migrate [...]` commands, change your current directory to be `tracim/` from the root of the project :

    (tg2env) user@host:~/tracim$ cd tracim/
    (tg2env) user@host:~/tracim/tracim$

### Retrieving schema current version ###

    gearbox migrate db_version

### Creating new schema migration ###

This creates a new python migration file in `tracim/migration/versions/` ending by `migration_label.py`:

    gearbox migrate create 'migration label'

### Upgrading schema ###

    gearbox migrate upgrade

### Downgrading schema ###

    gearbox migrate downgrade
