# Settings #

Here is a short description of settings available in backend config files.

# Tracim config ini file #

This file is called'development.ini' file by default, it's located is backend
subdir, default config is [development.ini.sample](../development.ini.sample) with some doc.

## Listening port (for pserve only) ##

Default configuration is to listen on port 6534.
If you want to adapt this to your environment, edit the `.ini` file and setup the port you want:

    [server:main]
    ...
    listen = localhost:6543

To allow other computer to access to this website, listen to "*" instead of localhost:

    [server:main]
    ...
    listen = *:6534

## Database path ##

To configure a database, you need to provide a valid sqlalchemy url:

for sqlite, a valid value is something like this:

    sqlalchemy.url = sqlite:///%(here)s/tracim.sqlite

to know more about this, see [sqlalchemy documentation](http://docs.sqlalchemy.org/en/latest/core/engines.html).

Be carefull, if sqlalchemy support many kind of Database, Tracim support is **not** guarantee.
Tracim is officially supporting sqlite, postgresql and mysql.

## Debugging and Logs ##
### Debug params ###


For debugging you can uncomment this 2 lines in '/backend/development.ini' to
enable pyramid debugtoolbar.
If you use debugtoolbar, you can seen one red button on right of the Tracim web interface.

    ~~~
    #pyramid.includes =
    #    pyramid_debugtoolbar
    ~~~

you can add this line to active pyramid debug mode for almost anything:

    ~~~
    pyramid.debug_all = true
    ~~~


Hapic debug mode : this line is needed for more explicit json error,
raised error traceback will be send through json. you can uncomment it

   ~~~
   # debug = True
   ~~~

pyramid.reload_templates = true

### Prod/Debug configuration example ###


To enable simple debug conf:

    [app:tracim_web]
    ...
    pyramid.reload_templates = true
    pyramid.debug_all = true
    pyramid.includes =
        pyramid_debugtoolbar

    [DEFAULT]
    ...
    debug = True


production conf (no reload, no debugtoolbar):

    [app:tracim_web]
    ...
    pyramid.reload_templates = false
    pyramid.debug_authorization = false
    pyramid.debug_notfound = false
    pyramid.debug_routematch = false

    [DEFAULT]
    ...
    debug = False

You can, of course, also set level of one of the different logger
to have more/less log about something.

    [logger_sqlalchemy]
    ...
    level = INFO

# Color File #

You can change default color of apps by setting color.json file, by default,
placed at root of tracim_v2 dir, see [color.json.sample](../../color.json.sample)
for default config file.

# Wsgidav File

This file is by default placed in backend subdir,
it by default called wsigdav.conf, for more information, see default
conf file [wsigdav.conf.sample](../wsgidav.conf.sample).
