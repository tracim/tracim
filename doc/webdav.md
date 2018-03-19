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
