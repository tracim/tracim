# Settings #

Here is a short description of settings available in backend config files.

# Tracim config ini file #

This file is called'development.ini' file by default, it's located is backend
subdir, default config is [development.ini.sample](../development.ini.sample) with some doc.

## Fix URL for access to tracim from network (simple) ##

To have a working tracim, you need to explicitly explain where backend and frontend are.
If backend serve frontend or if you do not need frontend at all, you can just set:

    website.base_url = http://mysuperdomainame.ndd
    # website.server_name = mysuperdomainename.ndd

or (non-default http port):

    website.base_url = http://mysuperdomainame.ndd:8080
    # website.server_name = mysuperdomainename.ndd

or (for https):

    website.base_url = https://mysuperdomainame.ndd
    # website.server_name = mysuperdomainename.ndd

you also need to NOT set website.server_name and api.base_url

## Fix URL for access to tracim from network (complex) ##

If the website.base_url trick is not enough for your own configuration, you can:
- Explicitly set backend base url different from frontend url with api.base_url
- Override allowed access control allowed origin for cors.


     # with this configuration, i allowed cors to work with 2 different server with 2 different port
     # that may be needed if frontend is in another computer distinct from backend.
     # you can add how many server you want separated by ','
     cors.access-control-allowed-origin = http://mysuperservername.ndd:6543,http://myotherservername.ndd:8090

## Activating Mail Notification feature ##

to activate mail notification, smallest config is this:

    email.notification.activated = True
    # from header of mail, need to be a valid adress
    email.notification.from.email = test_user+{user_id}@supersmtpserver.ndd
    # reply to header of mail, need to be a valid address
    email.notification.reply_to.email = test_user+{content_id}@supersmtpserver.ndd
    # references header of mail, similar to mail, used to have threaded mail
    # but do not need to be a valid email address
    email.notification.references.email = test_user+{content_id}@supersmtpserver.ndd

    email.notification.processing_mode = sync
    email.processing_mode = async
    email.notification.smtp.server = supersmtpserver.ndd
    email.notification.smtp.port = 1025
    email.notification.smtp.user = test_user
    email.notification.smtp.password = just_a_password

don't forgot to set website.base_url and website.title for frontend, as some feature use this to return
link to frontend in email.

## Activating Email reply feature ##

to activate reply by email, smallest config is this:

    # Email reply configuration
    email.reply.activated = True
    email.reply.imap.server = superimapserver.ndd
    email.reply.imap.port = 993
    email.reply.imap.user = imap_user
    email.reply.imap.password = imap_password
    email.reply.imap.folder = INBOX
    email.reply.imap.use_ssl = true
    email.reply.imap.use_idle = true

don't forgot to start mail_fetcher daemon, documentation here /backend/README.md and chapter "Run daemons according to your config"

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


Hapic debug mode: this line is needed for more explicit json error,
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
