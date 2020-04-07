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

