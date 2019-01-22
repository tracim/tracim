# How to use webdav from different OS ?

## Windows

### Windows 7

- Open Start Menu.
- Click on Computer.
- click on "Map network drive".

### Windows 8 and 10

- Open File explorer.
- Right click on "This PC" (left panel)
- From the dropdown menu, select "Map network drive".

### Map Network drive Windows:

Webdav Windows addresses are similar to:

```
https://<yourinstance>/webdav/ (secure)
http://<yourinstance>/webdav/ (unsecure)
```

- Enter the address of webdav (you can find it in each workspace, under workspace details)
- Check "Reconnect at sign-in" and "Connect using different credentials".
- Click "Finish".
- Your login/password will be ask. Use your Tracim credentials.
- After that, your webdav access should be mounted.

### Unsecure HTTP using Windows

If you want to use webdav with tracim without https, you need to set Windows to accept basic auth in http.

To enable it:
- Launch regedit.
- Go to "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters\BasicAuthLevel".
- set "BasicAuthLevel" to "2".

### Fix Windows Big file >50Mb file download.

To avoid security problems, Windows doesn't allow to download >50Mb file
by default from WebDAV share.

To change file size limit of Windows :
- Launch regedit.
- Go to "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters".
- set "FileSizeLimitInBytes" as DWORD decimal to the number of bytes needed,
for example. 1Go is 1073741824, 500Mo is 524288000.

see here for more info:
https://support.microsoft.com/en-us/help/900900/folder-copy-error-message-when-downloading-a-file-that-is-larger-than

### Fix Windows 30 Minutes timeout with big file.

Windows add also a 30 minutes timeout for big file. If you want download who take
more time, set the default timeout value.

To set the default timeout value:
- Launch regedit.
- Go to "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Services\MRxDAV\Parameters"
- set "FsCtlRequestTimeoutInSec" DWORD decimal to more than 1800 second (30Min).
for example : 3600 : 1H , 14400 : 4H , 86400 : A day (24H).

see here more info:
https://support.microsoft.com/fr-fr/help/2668751/you-cannot-download-more-than-50-mb-or-upload-large-files-when-the-upl


## OSX

Webdav OSX addresses are similar to:

```
https://<yourinstance>/webdav/ (secure)
http://<yourinstance>/webdav/ (unsecure)
```

- In the Finder, choose "Go > Connect to Server".
- Enter the address of webdav (you can find it in each workspace, under workspace details). Click Connect.
- Your login/password will be ask. Use your Tracim credentials.
- After that, your webdav access should be mounted.


## Linux

Webdav Linux addresses are similar to:

```
davs://<yourinstance>/webdav/ (secure)
dav://<yourinstance>/webdav/ (unsecure)
```

### Gnome3 (nautilus)

- Launch nautilus.
- Show url bar : Ctrl+l.
- Enter the address of webdav (you can find it in each workspace, under workspace details). Press Enter.
- Your login/password will be ask. Use your Tracim credentials.
- After that, your webdav access should be mounted.
