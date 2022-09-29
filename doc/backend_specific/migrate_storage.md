## Migrate file storage

:warning: This feature is experimental !

If you want to migrate between the existing storage
available for uploaded_file or just want to migrate
from different same type of file storage, a command line
exist to simplify the migration.

First, you need to backup both database and file storage
as the migration will both:
- remove file from existing file storage
- modify the database in order to link to new storage file.

If you have done proper backup, you now can start the migration.
To do so, you will need 2 configuration file that does work: the actual one and
the new one. The new one MUST have a different value for `uploaded_files.storage.storage_name`,
this is both mandatory for the command line to work and is helpful for inspecting database.
you then need to change all the other value of `uploaded_files.*` you need to properly push
connect the new storage.

:warning: This feature is not intended to migrate between multiple database,
so different value for database url is not supported here.

:warning: this feature is not intended to work with env var, as
env var will override both old and new value, so verify you are not overriding
any `uploaded_files.*` parameters with environnement var.

If you do have your 2 config file, you can now do :

```db migrate-storage -c <new_config_file path> -o <old_config_file path> -d```

This will migrate all file stored content to the new storage.

You can then run tracim with you new config using you new storage !
