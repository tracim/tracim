# Migration from Tracim v2.1 to Tracim v2.2

**:warning:** Agenda is now available. You can now migrate your Tracim v1 calendar to Tracim v2.2 agenda.

## How to migrate your calendar/agenda

### Reminder
- data/file about all calendar (Tracim v1) are in this folder `radicale_data/` in your instance server.
Files is in format of radicale 1.1.1
- data/file about all agenda (Tracim v2.2) are in this folder `radicale_storage/` in path `/tracim/backend/` by default.
Files is in format of radicale 2.0.0

### Migration stage by stage

**:warning:** Current user must have read/write access on tracim v1 folder and read/write access for migration output folder.


Create folder in your system to make migration of files. ex:

    mkdir /your/migration/folder/path/

Create venv with python >= 3.3 in this folder

    python3 -m venv env

Activate this venv

    source env/bin/activate

Install radicale 1.1.6 in this venv with this command:

    pip install --upgrade radicale==1.1.6

Copy folder `radicale_data/` from Tracim v1 to folder `/<your>/<migration>/<folder>/<path>/`

    cp -r /your/tracimv1/path/radicale_data /<your>/<migration>/<folder>/<path>/

Make a config file (ex: conf.ini) for migration in `/<your>/<migration>/<folder>/<path>/` with this parameter:


    [storage]
    filesystem_folder = /<your>/<migration>/<folder>/<path>/radicale_data


Convert file with this command:

    radicale --export-storage export -C conf.ini --debug \
        && cd export/collection-root/ \
        && mv collections/ agenda/ \
        && cd agenda/user/ \
        && for i in $(find [0-9]* -type d); do mv "$i" `echo $i | sed -E 's/^([0-9]+)(\.ics)/\1/g'`;done \
        && cd ../workspace/ \
        && for i in $(find [0-9]* -type d); do mv "$i" `echo $i | sed -E 's/^([0-9]+)(\.ics)/\1/g'`;done

After migration, file is accessible in:

    /<your>/<migration>/<folder>/<path>/export/

Copy folder `collection-root/agenda/` in `radicale_storage/`.

    cp -r export/collection-root /your/tracimv2/path/radicale_storage/

Now when you start caldav all this data is used.
    
**:warning:** If you have starting tracim and created some shared space without starting caldav you need to start caldav and after that to start this command `tracimcli caldav sync` to create missing agenda.

## Parameter changed from v2.1 to v2.2

### Caldav

New alias parameter: `basic_setup.caldav_storage_dir = %(here)s/radicale_storage/`

New block of parameters: `caldav.*` (Radicale)

New app caldav:

- "[pipeline:caldav]"
- "[app:tracim_caldav]"
- "[server:caldav]"

### Webdav

This parameter not exist anymore: `wsgidav.client.base_url = localhost:<WSGIDAV_PORT>`

Replaced by: `webdav.base_url = http://localhost:3030` (Syntaxe is not the same than oldest version)

New parameter: `webdav.ui.enabled = True`

### Other
New parameter: `default_lang = en`

Parameter `user.reset_password.validity` replaced by `user.reset_password.token_lifetime`

Remove unused parameter: `email.notification.processing_mode`

This is not new parameter but not visible in config file in 2.1:
`preview.jpg.allowed_dims = 256x256,512x512,1024x1024`
`preview.jpg.restricted_dims = True`


# Migration from Tracim v1 to Tracim v2.1

**:warning:**  2.0 version of Tracim doesn't support folder and ldap. If you want to migrate from tracim v1, you should use 2.1 or latest.

**:warning:** Backward migration is not supported from tracim v2 to tracim v1, see "About backward migration" part in this document.

If you are using tracim v1 and want to use now tracim_v 2.1 there is
few step to do.

## 1. Verify Tracim_v1 is up-to-date

In order to avoid issue with migration, you should have latest version of tracim_v1.
This is the tag for the latest version `release_01.xx.xx_end_of_life`.

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
 - active virtual environment (in `/backend` folder) `source env/bin/activate`
 - verify if tracim v2 is running correctly by launching `pserve development.ini`
 - do `pip install -e .[mysql]` or `pip install -e .[postgresql] `to install proper package for your 
SGDB.
 - modify default config file (`development.ini` name here but you can change it) with `basic_setup.sqlalchemy_url` linking to your own database with tracim_v1 data and `basic_setup.depot_storage_dir` with path giving access to your old tracim v1 depot dir content.
 - force migration of database with `alembic -c developement.ini upgrade head` (see also [here](migration.md) for more info)
 - run tracim with those param and check if tracim_v1 content is correctly added. (If you have used LDAP for auth, verify that you have one tracim administrator user or create one with INTERNAL auth)

## 4. Configure Tracim_v2 according to old tracim_v1.

Now you have a running tracim_v2 with working database, you can now check [developement.ini.sample](../development.ini.sample)
and verify which tracim_v1 parameter already exist and add them to your config file.

## 5. More infos about new config in Tracim_v2

Big change in config ini in tracim_v2 was to move most of the config (mostly from `[app:main]`) in `[DEFAULT]` section and 
separated more properly global config from app specific param like `pyramid.*` param in tracim_web app section , `[app:tracim_web]`  .
In order to have something working easily, best solution is using  [developement.ini.sample](../development.ini.sample) and
modify parameters, which are mostly in `[DEFAULT]` section.

| parameters        | status in tracim v2 |complementary informations  | 
|-------------------|--------------------|----------------------------|
| auth_type         |  renamed           | only `auth_type=internal` is supported in tracim v2.0, tracim v2.1 use now `auth_types` a list of ',' separated auth type, valid value are `internal` and  `ldap`.
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
| debug             | no change      | :warning: debug mode in tracim_v2 allow to have traceback in http api error response|
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
| wsgidav.*         | removed | official support in tracim v2.1+, use `webdav.*` params|
| i18n.lang         | removed           | partially replaced by `pyramid.default_locale_name`  in tracim web app (`[app:tracim_web]` )section                        |
| cookie_secret     | removed           | `[sa_auth]` section is not anymore used |
| beaker.session.*  | removed          | see new `session.*` parameters      | |
| templating.*      | removed           | all parameters beginning with `templating.` are not used anymore. |
| auto_reload_template | removed | see `pyramid.reload_templates` in `[app:tracim_web]` section
|| website.title.color| disabled         | not used in tracim_v2, will probably deleted soon|
| website.home.subtitle | removed ||
| website.home.tag_line | removed ||
| website.home.below_login_form | removed ||
| ldap_ldap_naming_attribute | removed | replaced by `ldap_name_attribute`
| ldap_user_attribute | removed | partially replaced by `ldap_name_attribute`, `ldap_login_attribute`
| ldap_group_enabled | removed ||
-------------------|-------------------|----------------------------|
| user.auth_token.validity | disabled   | not really used in tracim_v2 |
| tracim_instance.uuid | disabled       | not used yet in tracim_v2  |
| jitsi_meet.* | disabled | feature not added yet in tracim_v2|
| content.update.allowed.duration | disabled | not used in tracim_v2|
| radicale.* | disabled | feature not added yet in tracim_v2|
|-------------------|-------|---- |
| pyramid.*         | new   | in tracim_web app section (`[app:tracim_web]` ), see pyramid doc for more information.
| app.enabled       | new   | if provided, should be a list of app slug separated by `,` char, this allow you to activate beta app or disable some unwanted app.|
| api.key           | new   |  :warning: Required ! API key, should be secret.|
| user.reset_password.validity | new | |
|  api.base_url      | new   | |
| webdav.*         | new | official support in tracim v2.1+, webdav configuration params|
| cors.access-control-allowed-origin | new | if provided, should be a list of `protocol://hostname:port` separated by `,` char.|
| color.config_file_path | new ||
| backend.18n_folder_path | new ||
| invitation.new_user.minimal_profile | new | default = trusted_user
| frontend.serve | new |  :warning: Probably Required if you want to enabled frontend of tracim_v2, default value to `False`|
| frontend.dist_folder_path | new ||
| preview.jpg.allowed_dims | new ||
| preview.jpg.restricted_dims | new ||
| session.* | new |  :warning: parameters required to allow cookie auth, see  [developement.ini.sample](../development.ini.sample) and/or [pyramid_beaker doc](https://docs.pylonsproject.org/projects/pyramid_beaker/en/latest/) for configuration   |
| pipeline | new | :warning: metaconfig (PasteDeploy) :  used to ordonnate properly config file with multiple app. you should probably leave this as default like in [developement.ini.sample](../development.ini.sample) |
| retry.attemps | new | pyramid specific parameter link to [pyramid_retry](https://docs.pylonsproject.org/projects/pyramid-retry/en/latest/), number of try per request. |
| script_location | new | :warning: required for database migration, in `[alembic]` section, alembic specific param. you probably should use default value: `tracim_backend/migration`|
| ldap_user_base_dn | new | base dn to make queries of users
| ldap_login_attribute | new | attribute for email login (default:mail) in ldap
| ldap_name_attribute | new | attribute for user name in ldap, used only for automatic new tracim user creation at first login
--------------------------------

Others modifications in config file includes :
* reordering file with `pipeline` and `app`
* added `[alembic]` section for migration
* new logger for `alembic` and `hapic` (`auth` logger has been removed)
* old personnalization file from tracim_v1 like  `assets/img/home_illustration.jpg`
 or `/assets/img/bg.jpg` are not anymore used.

# About backward migration

Backward migration from v2 to v1 is not supported, you can tried to downgrade database from
tracim v2.1 to tracim v1 using `alembic downgrade` command, but some content like `page`/`html-document` will not be accessible anymore.
That because Tracim v2 use `html-document` whereas Tracim v1 use `page`.
