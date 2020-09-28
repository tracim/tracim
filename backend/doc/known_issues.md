# Known issues with the Tracim Backend

## uWSGI

### plaster.exceptions.LoaderNotFound

If you see the following error:


    plaster.exceptions.LoaderNotFound: Could not find a matching loader for the scheme "file+ini"".


Check the values of TRACIM_CONF_PATH and TRACIM_WEBDAV_CONF_PATH in the uWSGI configuration file.
These variables should contain absolute paths and should be quoted.

- Incorrect:
    env = TRACIM_CONF_PATH="/home/me/tracim/backend/development.ini"
- Correct:
    env = TRACIM_CONF_PATH=/home/me/tracim/backend/development.ini


## Webdav

### Same space name are not all showed properly in webdav

It's a known limitation of tracim 3.2+ version, you cannot show multiple space
with same name at the same level through webdav. The webdav view will only show you the "first" one
according to the tracim database. All the visible spaces are fully working.
In order to workaround this issue, you can either:

- rename space
- set same name space as children of different spaces

Be careful about the 2nd solution, user should be members of both parent and children to
see the hierarchy. If user has only access to 2 children same name space, it will get
the same issue in webdav.
