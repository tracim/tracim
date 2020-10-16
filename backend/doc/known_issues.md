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


## WebDAV

### Spaces with the same name are not properly displayed in WebDAV

In Tracim v3.2+. you cannot show multiple spaces with same name at the same level through WebDAV. The WebDAV view will only show you the one that was created first.
In order to workaround this issue, we recommand that you rename the conflicting spaces.
If it is not an option, you may also move the conflicting spaces into other spaces.
Be careful with this solution: users should be members of the parents to see the full hierarchy. If a user only has access to the spaces with the same name but not their parents, they will still have the issue.
