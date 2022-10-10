# Using WebDAV on Various Operating Systems

## Windows

### Windows 7

- Open the Start Menu
- Click on Computer
- click on "Map network drive"

### Windows 8 and 10

- Open the file explorer
- Right-click on "This PC" (left panel)
- From the drop-down menu, select "Map network drive"

### Map Windows Network Drives

On Windows, WebDAV URLs look like:

```
https://<yourinstance>/webdav/ (secure)
http://<yourinstance>/webdav/ (unsecure)
```

- Enter the WebDAV URL (you can find it in each workspace, under workspace details)
- Check "Reconnect at sign-in" and "Connect using different credentials"
- Click on "Finish"
- Your login/password will be asked; use your Tracim credentials
- After that, your WebDAV access should be mounted

### Unsecure HTTP using Windows

If you want to use WebDAV with Tracim without HTTPS, you need to make Windows accept basic http authentication.

- Run regedit.
- Go to "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters\BasicAuthLevel".
- Set "BasicAuthLevel" to "2".

### Fix Windows Big file >50Mb file download.

To avoid security problems, by default, Windows doesn't allow to download >50Mb files
from WebDAV shares.

To change the file size limit:
- Run regedit.
- Go to "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters".
- Set "FileSizeLimitInBytes" as DWORD decimal to the number of bytes needed,
for example. 1Go is 1073741824, 500Mo is 524288000.

See https://support.microsoft.com/en-us/help/900900/folder-copy-error-message-when-downloading-a-file-that-is-larger-than for more information.

### Fix Windows 30 Minutes Timeouts.

When handling large files, you may encounter a 30 minute timeout. You may increase the timeout value as follows:
- Launch regedit.
- Go to "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Services\MRxDAV\Parameters"
- set "FsCtlRequestTimeoutInSec" DWORD decimal to more than 1800 second (30Min).
for example : 3600 : 1H , 14400 : 4H , 86400 : A day (24H).

See https://support.microsoft.com/fr-fr/help/2668751/you-cannot-download-more-than-50-mb-or-upload-large-files-when-the-upl for more information.


## macOS

On macOS, WebDAV addresses look like:

```
https://<yourinstance>/webdav/ (secure)
http://<yourinstance>/webdav/ (unsecure)
```

- In the Finder, choose "Go > Connect to Server".
- Enter the WebDAV URL (you can find it in each workspace, under workspace details). Click On Connect.
- Your login/password will be asked. Use your Tracim credentials.
- After that, your WebDAV access should be mounted.


## Linux

On Linux, WebDAV addresses look like:

```
davs://<yourinstance>/webdav/ (secure)
dav://<yourinstance>/webdav/ (unsecure)
```

### Gnome3 (nautilus)

- Run Nautilus.
- Show the URL bar: Ctrl+L.
- Enter the WebDAV URL (you can find it in each workspace, under workspace details). Press Enter.
- Your login/password will be asked. Use your Tracim credentials.
- After that, your webdav access should be mounted.
