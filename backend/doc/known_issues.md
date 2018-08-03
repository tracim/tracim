# Known issue with Tracim Backend

## Uwsgi

### plaster.exceptions.LoaderNotFound

If you obtain error with :


    plaster.exceptions.LoaderNotFound: Could not find a matching loader for the scheme "file+ini"".


you most probably don't set correctly TRACIM_CONF_PATH or TRACIM_WEBDAV_CONF_PATH.
You have to set a correct absolute path.
be careful for uwsgi ini file :


    # incorrect
    env = TRACIM_CONF_PATH="/home/me/tracim_v2/backend/development.ini"

    # correct
    env = TRACIM_CONF_PATH=/home/me/tracim_v2/backend/development.ini

