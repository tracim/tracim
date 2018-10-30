# Migration from Tracim v1 to Tracim v2

**Warning !** : 2.0 version of Tracim doesn't support yet folders correctly. If you want to migrate
from tracim v1, you should use future 2.1 or latest.

If you are using tracim v1 and want to use now tracim_v2 there is
few step to do.

## 1. Verify Tracim_v1 is up-to-date

In order to avoid issue with migration, you should have latest version of tracim_v1.

## 2. Save your old data

If you want to switch from v1 to v2, you should probably save all you data
from tracim v1.

All data which are relevant are:
 - **config file**: .ini file used by process running tracim, by default, `development.ini`.
 - **SGBD database** (sqlite, postgresql, mysql, ...): database connection is configured in config file of tracim v1 ini in `sqlalchemy.url` field,
 - **Depot folder** : folder path is configured in config file of tracim v1 ini in `depot_storage_dir` field.

## 3. Setup Tracim v2

There is many way to set up tracim v2, easiest is to use shell script, see [README](../../README.md).

One easy way to migrate from tracim v1 to tracim v2 with shell script is :
- running shell automatic install with default sqlite database
- go into tracim v2 python env (in `/backend` folder) `source env/bin/activate`
- verify if tracim v2 is running correctly by launching `pserve development.ini`
- do `pip install -e .[mysql]` or `pip install -e .[postgresql] `to install proper package for your
own SGDB.
- modify/copy default config file(we will stay with `development.ini` name here but you can change it) with `sqlalchemy.url` linking to your own database with tracim_v1 data and `depot_storage_dir`
with path giving access to your old tracim v1 depot dir content.
- force migration of database with `alembic -c developement.ini upgrade head` (see also [here](migration.md) for more info)
- run tracim with those param and check if tracim_v1 content is correctly added.

## 4. Configure Tracim_v2 according to old tracim_v1.

Now you have a running tracim_v2 with working database, you can now check [developement.ini.sample](../development.ini.sample)
and verify which tracim_v1 parameter already exist and add them to your config file.

