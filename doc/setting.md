# Setting #

Here is a short description of settings available in the file `development.ini`.

## Listening port ##

Default configuration is to listen on port 6534.
If you want to adapt this to your environment, edit the `.ini` file and setup the port you want:

    [server:main]
    ...
    listen = localhost:6543

To allow other computer to access to this website, listen to "*" instead of localhost:

    [server:main]
    ...
    listen = *:6534

## Prod/Debug configuration ##


To enable simple debug conf:

    [app:main]
    ...
    pyramid.reload_templates = true
    pyramid.debug_all = true
    pyramid.includes =
        pyramid_debugtoolbar

production conf (no reload, no debugtoolbar):

    [app:main]
    ...
    pyramid.reload_templates = false
    pyramid.debug_authorization = false
    pyramid.debug_notfound = false
    pyramid.debug_routematch = false

You can, of course, also set level of one of the different logger to have more/less log
about something.

    [logger_sqlalchemy]
    ...
    level = INFO
