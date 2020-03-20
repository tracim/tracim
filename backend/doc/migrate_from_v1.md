# Migration from Tracim v2.1 to Tracim v2.2

**:warning:** Agenda is now available. You can now migrate your Tracim v1 calendar to the Tracim v2.2 agenda.

## How to migrate your Calendar/Agenda

### Reminder
- data/file about all calendar (Tracim v1) are in this folder `radicale_data/` in your instance server.
Files is in format of radicale 1.1.1
- data/file about all agenda (Tracim v2.2) are in this folder `radicale_storage/` in path `/tracim/backend/` by default.
Files is in format of radicale 2.0.0

### Step by Step Migration

**:warning:** The current user must have read/write access on the Tracim v1 folder and read/write access to the migration output folder.


Create folder in your system to make migration of files. For instance:

    mkdir /your/migration/folder/path/

Create venv with python >= 3.3 in this folder:

    python3 -m venv env

Activate this venv:

    source env/bin/activate

Install radicale 1.1.6 in this venv with this command:

    pip install --upgrade radicale==1.1.6

Copy folder `radicale_data/` from Tracim v1 to folder `/<your>/<migration>/<folder>/<path>/`:

    cp -r /your/tracimv1/path/radicale_data /<your>/<migration>/<folder>/<path>/

Create a configuration file (e.g. `conf.ini`) for the migration in `/<your>/<migration>/<folder>/<path>/` with this parameter:


    [storage]
    filesystem_folder = /<your>/<migration>/<folder>/<path>/radicale_data


Convert the file:

    radicale --export-storage export -C conf.ini --debug \
        && cd export/collection-root/ \
        && mv collections/ agenda/ \
        && cd agenda/user/ \
        && for i in $(find [0-9]* -type d); do mv "$i" `echo $i | sed -E 's/^([0-9]+)(\.ics)/\1/g'`;done \
        && cd ../workspace/ \
        && for i in $(find [0-9]* -type d); do mv "$i" `echo $i | sed -E 's/^([0-9]+)(\.ics)/\1/g'`;done

After migration, the file can be found in `/<your>/<migration>/<folder>/<path>/export/`.

Copy folder `collection-root/agenda/` in `radicale_storage/`:

    cp -r export/collection-root /<your>/<tracimv2>/<path>/backend/radicale_storage/
    
Make sure that file `.Radicale.props` does not exist in the following folders (otherwise delete them):
  
- `/<your>/<tracimv2>/<path>/backend/radicale_storage/collection-root/agenda/user/`
- `/<your>/<tracimv2>/<path>/backend/radicale_storage/collection-root/agenda/workspace/`

After starting the CalDAV server, you need to synchronize Tracim with radicale:

    tracimcli caldav sync
    
Now all of your agendas are visible in Tracim.

## Parameter changed from v2.1 to v2.2

### CalDAV

New alias parameter: `basic_setup.caldav_storage_dir = %(here)s/radicale_storage/`

New block of parameters: `caldav.*` (Radicale)

New app caldav:

- "[pipeline:caldav]"
- "[app:tracim_caldav]"
- "[server:caldav]"

### WebDAV

This parameter does not exist anymore: `wsgidav.client.base_url = localhost:<WSGIDAV_PORT>`

Replaced by: `webdav.base_url = http://localhost:3030` (Syntaxe is not the same than oldest version)

New parameter: `webdav.ui.enabled = True`

### Other

New parameter: `default_lang = en`

Parameter `user.reset_password.validity` is replaced by `user.reset_password.token_lifetime`

Remove the unused parameter: `email.notification.processing_mode`

This is not a new parameter but it is not visible in the configuration file in 2.1:
`preview.jpg.allowed_dims = 256x256,512x512,1024x1024`
`preview.jpg.restricted_dims = True`


# Migration from Tracim v1 to Tracim v2.1

**:warning:** version 2.0 of Tracim doesn't support folder and LDAP. If you want to migrate from Tracim v1, you should use version 2.1 or later.

**:warning:** Backward migration from Tracim v2 to Tracim v1 is not supported. See sectrion "About backward migration" of this document.

If you are using Tracim v1 and you want to use Tracim v2.1 there are a few steps to do.

## 1. Verify that Tracim v1 is Up to Date

In order to avoid issues with migration, you should have the latest version of Tracim v1.
This is the tag for the latest version `release_01.xx.xx_end_of_life`.

## 2. Save your Old Data

If you want to update from v1 to v2, you make sure to backup your data from Tracim v1.

Relevant data:
 - **config file**: .ini file used by process running Tracim, by default, `development.ini`.
 - **SGBD database** (sqlite, postgresql, mysql, ...): database connection is configured in config file of Tracim v1 ini in `sqlalchemy.url` field,
 - **Depot folder** : folder path is configured in config file of Tracim v1 ini in `depot_storage_dir` field.

## 3. Setup Tracim v2

There is many way to set up Tracim v2, easiest is to use shell script, see [README](../../README.md).

One easy way to migrate from Tracim v1 to Tracim v2 with shell script is :
 - running shell automatic install with default sqlite database
 - active virtual environment (in `/backend` folder) `source env/bin/activate`
 - check that Tracim v2 is running correctly by launching `pserve development.ini`
 - do `pip install -e .[mysql]` or `pip install -e .[postgresql] `to install proper package for your 
SGDB.
 - modify default config file (`development.ini` name here but you can change it) with `basic_setup.sqlalchemy_url` linking to your own database with Tracim v1 data and `basic_setup.depot_storage_dir` with path giving access to your old Tracim v1 depot dir content.
 - force migration of database with `alembic -c developement.ini upgrade head` (see also [here](migration.md) for more info)
 - run Tracim with these parameters and check that content from Tracim v1 is correctly added. (If you used LDAP for auth, check that you have one Tracim administrator user or create one with INTERNAL auth)

## 4. Migrate the configuration from Tracim v1.

You now have a running Tracim v2 instance with a working database, you can now check [developement.ini.sample](../development.ini.sample)
and check which Tracim v1 parameters already exist and add them to your configuration file.

## 5. More About New Configuration in Tracim v2

A big change in the configuration in Tracim v2 was to move most of the configuration (mostly from `[app:main]`) in section `[DEFAULT]` and
properly separate the global configuration from app specific parameters such as `pyramid.*` in tracim_web app section , `[app:tracim_web]`  .
In order to have something working easily, the best solution is to use [developement.ini.sample](../development.ini.sample) and
edit parameters, which are mostly in section `[DEFAULT]`.

| parameters        | status in Tracim v2 |complementary informations  |
|-------------------|--------------------|----------------------------|
| auth_type         |  renamed           | only `auth_type=internal` is supported in Tracim v2.0, Tracim v2.1 use now `auth_types` a list of ',' separated auth type, valid value are `internal` and  `ldap`.
|-------------------|-------------------|-----------------------------|
| sqlalchemy.*    |    no change        |                            |
| cache_dir         |    no change      |                            |
| preview_cache_dir |    no change      |                            |
| depot_storage_name|    no change      |                            |
| depot_storage_dir |    no change      |                            |
| website.title     |    no change      |                            |
| website.server_name| no change        ||
| email.notification.* | no change      | |
| email.processing_mode | no change ||
| email.async.* | no change ||
| email.reply.*     | no change ||
| debug             | no change      | :warning: debug mode in Tracim v2 allows to have traceback in http api error response|
| ldap_url          | no change ||
| ldap_base_dn      | no change ||
| ldap_bind_dn      | no change ||
| ldap_bind_pass    | no change ||
| ldap_tls          | no change ||
-------------------|-------------------|----------------------------|
| resetpassword.*   | removed           | no specific smtp config for reset password, smtp config is actually in `email.notification.smtp` |
| smtp_server       | removed           |                            |
| error_email_from  | removed           |                            |
| full_stack        | removed           |                            |
| wsgidav.*         | removed | official support in Tracim v2.1+, use `webdav.*` params|
| i18n.lang         | removed           | partially replaced by `pyramid.default_locale_name`  in Tracim web app (`[app:tracim_web]` )section                        |
| cookie_secret     | removed           | `[sa_auth]` section is not anymore used |
| beaker.session.*  | removed          | see new `session.*` parameters      | |
| templating.*      | removed           | all parameters beginning with `templating.` are not used anymore. |
| auto_reload_template | removed | see `pyramid.reload_templates` in `[app:tracim_web]` section
|| website.title.color| disabled         | not used in Tracim v2, will probably deleted soon|
| website.home.subtitle | removed ||
| website.home.tag_line | removed ||
| website.home.below_login_form | removed ||
| ldap_ldap_naming_attribute | removed | replaced by `ldap_name_attribute`
| ldap_user_attribute | removed | partially replaced by `ldap_name_attribute`, `ldap_login_attribute`
| ldap_group_enabled | removed ||
-------------------|-------------------|----------------------------|
| user.auth_token.validity | disabled   | not really used in Tracim v2 |
| tracim_instance.uuid | disabled       | not used yet in Tracim v2  |
| jitsi_meet.* | disabled | feature not added yet in Tracim v2|
| content.update.allowed.duration | disabled | not used in Tracim v2|
| radicale.* | disabled | feature not added yet in Tracim v2|
|-------------------|-------|---- |
| pyramid.*         | new   | in tracim_web app section (`[app:tracim_web]` ), see pyramid doc for more information.
| app.enabled       | new   | if provided, should be a list of app slug separated by `,` char, this allow you to activate beta app or disable some unwanted app.|
| api.key           | new   |  :warning: Required ! API key, should be secret.|
| user.reset_password.validity | new | |
|  api.base_url      | new   | |
| webdav.*         | new | official support in Tracim v2.1+, webdav configuration params|
| cors.access-control-allowed-origin | new | if provided, should be a list of `protocol://hostname:port` separated by `,` char.|
| color.config_file_path | new ||
| backend.18n_folder_path | new ||
| invitation.new_user.minimal_profile | new | default = trusted_user
| frontend.serve | new |  :warning: Probably Required if you want to enabled frontend of Tracim v2, default value to `False`|
| frontend.dist_folder_path | new ||
| preview.jpg.allowed_dims | new ||
| preview.jpg.restricted_dims | new ||
| session.* | new |  :warning: parameters required to allow cookie auth, see  [developement.ini.sample](../development.ini.sample) and/or [pyramid_beaker doc](https://docs.pylonsproject.org/projects/pyramid_beaker/en/latest/) for configuration   |
| pipeline | new | :warning: metaconfig (PasteDeploy) :  used to ordonnate properly config file with multiple app. you should probably leave this as default like in [developement.ini.sample](../development.ini.sample) |
| retry.attemps | new | pyramid specific parameter link to [pyramid_retry](https://docs.pylonsproject.org/projects/pyramid-retry/en/latest/), number of try per request. |
| script_location | new | :warning: required for database migration, in `[alembic]` section, alembic specific param. you probably should use default value: `tracim_backend/migration`|
| ldap_user_base_dn | new | base dn to make queries of users
| ldap_login_attribute | new | attribute for email login (default:mail) in ldap
| ldap_name_attribute | new | attribute for user name in ldap, used only for automatic new Tracim user creation at first login
--------------------------------

Other changes to the configuration file include:
* reordering file with `pipeline` and `app`
* added `[alembic]` section for migration
* new logger for `alembic` and `hapic` (`auth` logger has been removed)
* old personnalization file from Tracim v1 like  `assets/img/home_illustration.jpg`
 or `/assets/img/bg.jpg` are not anymore used.

# About Backward Migrations

Backward migration from v2 to v1 is not supported, you can try to downgrade the database from
Tracim v2.1 to Tracim v1 using `alembic downgrade` command, but some contents like `page`/`html-document` will not be accessible anymore because Tracim v2 uses `html-document` whereas Tracim v1 uses `page`.
